import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadAFrame } from "@/xr/runtime/load-aframe";
import { RuntimeScope } from "@/xr/runtime/scope";

class FakeScript extends EventTarget {
  src = "";
}
class FakeFrame extends EventTarget {
  title = "";
  allow = "";
  allowFullscreen = false;
  srcdoc = "";
  style = { cssText: "" };
  remove = vi.fn();
  script = new FakeScript();
  appendScript = vi.fn();
  registerComponent = vi.fn();
  contentDocument = { createElement: () => this.script, head: { append: this.appendScript } };
  contentWindow = { AFRAME: { components: {}, registerComponent: this.registerComponent } };
}

describe("isolated A-Frame realm", () => {
  let frame: FakeFrame;
  let append: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.useFakeTimers();
    frame = new FakeFrame();
    append = vi.fn();
    vi.stubGlobal("document", { createElement: () => frame });
    vi.stubGlobal("window", { setTimeout, clearTimeout });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("loads only the pinned local runtime and removes the entire frame on disposal", async () => {
    const scope = new RuntimeScope();
    const pending = loadAFrame({ append } as unknown as HTMLDivElement, scope);
    frame.dispatchEvent(new Event("load"));
    expect(frame.script.src).toBe("/vendor/aframe/aframe-1.8.0.min.js");
    expect(frame.allow).toBe("xr-spatial-tracking; fullscreen");
    expect(frame.srcdoc).toContain('http-equiv="Content-Security-Policy"');
    expect(frame.srcdoc).toContain("script-src 'self'");
    expect(frame.srcdoc).toContain("object-src 'none'");
    expect(frame.srcdoc).not.toContain("unsafe-eval");
    frame.script.dispatchEvent(new Event("load"));
    const realm = await pending;
    expect(realm?.frame).toBe(frame);
    expect(frame.registerComponent).toHaveBeenCalledTimes(2);
    scope.dispose();
    expect(frame.remove).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not register components or resurrect a frame after route teardown during loading", async () => {
    const scope = new RuntimeScope();
    const pending = loadAFrame({ append } as unknown as HTMLDivElement, scope);
    frame.dispatchEvent(new Event("load"));
    scope.dispose();
    frame.script.dispatchEvent(new Event("load"));
    expect(await pending).toBeUndefined();
    expect(frame.registerComponent).not.toHaveBeenCalled();
    expect(frame.remove).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not create a realm for an already disposed owner", async () => {
    const scope = new RuntimeScope();
    scope.dispose();
    const pending = loadAFrame({ append } as unknown as HTMLDivElement, scope);
    expect(append).not.toHaveBeenCalled();
    expect(await pending).toBeUndefined();
  });
});
