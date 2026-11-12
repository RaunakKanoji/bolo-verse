import { describe, expect, it, vi } from "vitest";
import { StudioAdapter } from "@/xr/runtime/studio-adapter";

class BrowserSession extends EventTarget {
  end = vi.fn(async () => {
    this.dispatchEvent(new Event("end"));
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function sessionHarness() {
  const session = new BrowserSession();
  const requestSession = vi.fn().mockResolvedValue(session);
  const xr = {
    enabled: false,
    isPresenting: false,
    setReferenceSpaceType: vi.fn(),
    setSession: vi.fn(async () => {
      xr.isPresenting = true;
    }),
  };
  const scene = {
    renderer: { xr },
    addState: vi.fn(),
    removeState: vi.fn(),
    emit: vi.fn(),
    resize: vi.fn(),
  };
  const callbacks = { onSelect: vi.fn(), onSession: vi.fn(), onStats: vi.fn(), onError: vi.fn() };
  const adapter = new StudioAdapter(
    {} as HTMLDivElement,
    { id: "test", name: "Project", objective: "Objective" },
    callbacks,
  );
  // Inject only the browser/renderer boundary. No A-Frame implementation is
  // mocked; these tests exercise the real adapter's public session methods.
  Reflect.set(adapter, "scene", scene);
  Reflect.set(adapter, "realm", {
    window: { isSecureContext: true, navigator: { xr: { requestSession } } },
  });
  return { adapter, session, requestSession, xr, scene, callbacks };
}

describe("adapter immersive session ownership", () => {
  it("requests immersive-vr before announcing a session and restores desktop on end", async () => {
    const { adapter, session, requestSession, xr, scene, callbacks } = sessionHarness();
    await adapter.enterVR();
    expect(requestSession).toHaveBeenCalledExactlyOnceWith("immersive-vr", {
      requiredFeatures: ["local-floor"],
    });
    expect(xr.setReferenceSpaceType).toHaveBeenCalledWith("local-floor");
    expect(xr.setSession).toHaveBeenCalledExactlyOnceWith(session);
    expect(scene.addState).toHaveBeenCalledWith("vr-mode");
    expect(callbacks.onSession).toHaveBeenLastCalledWith(true);

    await adapter.exitVR();
    expect(session.end).toHaveBeenCalledOnce();
    expect(xr.enabled).toBe(false);
    expect(scene.removeState).toHaveBeenCalledWith("vr-mode");
    expect(scene.emit).toHaveBeenLastCalledWith("exit-vr", { target: scene });
    expect(callbacks.onSession).toHaveBeenLastCalledWith(false);
  });

  it("does not claim immersive entry when the browser rejects the request, and permits a retry", async () => {
    const { adapter, requestSession, xr, scene, callbacks } = sessionHarness();
    requestSession.mockRejectedValueOnce(new Error("Permission denied"));
    await expect(adapter.enterVR()).rejects.toThrow(/could not start/i);
    expect(xr.setSession).not.toHaveBeenCalled();
    expect(scene.addState).not.toHaveBeenCalled();
    expect(callbacks.onSession).not.toHaveBeenCalledWith(true);
    await adapter.enterVR();
    expect(callbacks.onSession).toHaveBeenLastCalledWith(true);
  });

  it("ends a request that resolves after route disposal without attaching it to a dead renderer", async () => {
    const { adapter, session, requestSession, xr, callbacks } = sessionHarness();
    const request = deferred<BrowserSession>();
    requestSession.mockReturnValueOnce(request.promise);
    const entering = adapter.enterVR();
    adapter.dispose();
    request.resolve(session);
    await entering;
    expect(session.end).toHaveBeenCalledOnce();
    expect(xr.setSession).not.toHaveBeenCalled();
    expect(callbacks.onSession).not.toHaveBeenCalledWith(true);
  });

  it("ends an allocated session if renderer binding fails", async () => {
    const { adapter, session, xr, callbacks } = sessionHarness();
    xr.setSession.mockRejectedValueOnce(new Error("Context lost"));
    await expect(adapter.enterVR()).rejects.toThrow(/could not start/i);
    expect(session.end).toHaveBeenCalledOnce();
    expect(callbacks.onSession).not.toHaveBeenCalledWith(true);
  });

  it("awaits session termination and propagates an exit failure without claiming desktop mode", async () => {
    const { adapter, session, callbacks } = sessionHarness();
    await adapter.enterVR();
    session.end.mockRejectedValueOnce(new Error("Headset failed to close"));
    await expect(adapter.exitVR()).rejects.toThrow("Headset failed to close");
    expect(callbacks.onSession).toHaveBeenLastCalledWith(true);
  });
});
