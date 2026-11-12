import { describe, expect, it, vi } from "vitest";
import { detectXRCapability } from "@/xr/runtime/capability";
import { RuntimeScope } from "@/xr/runtime/scope";
import { registerStudioComponents } from "@/xr/components/register-components";
import type { AFrameRuntime } from "@/xr/runtime/aframe-types";

describe("immersive capability", () => {
  it("does not equate a browser or fullscreen support with immersive VR", async () => {
    expect((await detectXRCapability(undefined, true)).state).toBe("unavailable");
    const isSessionSupported = vi.fn().mockResolvedValue(true);
    expect((await detectXRCapability({ isSessionSupported }, false)).state).toBe("unavailable");
    expect(isSessionSupported).not.toHaveBeenCalled();
  });

  it("checks the real immersive-vr session mode", async () => {
    const isSessionSupported = vi.fn().mockResolvedValue(true);
    expect((await detectXRCapability({ isSessionSupported }, true)).state).toBe("supported");
    expect(isSessionSupported).toHaveBeenCalledExactlyOnceWith("immersive-vr");
  });

  it("keeps desktop available when support is false or the browser rejects the check", async () => {
    expect((await detectXRCapability({ isSessionSupported: async () => false }, true)).state).toBe(
      "unavailable",
    );
    const rejected = await detectXRCapability(
      {
        isSessionSupported: async () => {
          throw new Error("blocked");
        },
      },
      true,
    );
    expect(rejected.state).toBe("unavailable");
    expect(rejected.message).toMatch(/check.*unavailable/i);
  });
});

describe("runtime ownership", () => {
  it("registers each A-Frame component once across remounts and hot reloads", () => {
    const components: Record<string, unknown> = {};
    const registerComponent = vi.fn((name: string, definition: unknown) => {
      components[name] = definition;
    });
    const runtime = { components, registerComponent } as unknown as AFrameRuntime;
    registerStudioComponents(runtime, {} as Document);
    registerStudioComponents(runtime, {} as Document);
    expect(registerComponent.mock.calls.map(([name]) => name)).toEqual([
      "studio-panel",
      "studio-stats",
    ]);
  });

  it("aborts pending work and releases each owned resource once in reverse order", () => {
    const scope = new RuntimeScope();
    const calls: string[] = [];
    scope.own(() => calls.push("scene"));
    scope.own(() => calls.push("listeners"));
    scope.dispose();
    scope.dispose();
    expect(scope.signal.aborted).toBe(true);
    expect(calls).toEqual(["listeners", "scene"]);
  });

  it("immediately disposes resources that finish loading after route teardown", () => {
    const scope = new RuntimeScope();
    scope.dispose();
    const disposeLateResource = vi.fn();
    scope.own(disposeLateResource);
    expect(disposeLateResource).toHaveBeenCalledOnce();
  });

  it("continues releasing other resources if one cleanup throws", () => {
    const scope = new RuntimeScope();
    const cleanup = vi.fn();
    scope.own(cleanup);
    scope.own(() => {
      throw new Error("already released");
    });
    expect(() => scope.dispose()).not.toThrow();
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
