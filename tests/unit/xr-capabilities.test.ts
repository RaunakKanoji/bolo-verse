import { describe, expect, it, vi } from "vitest";
import { detectCapabilities, availableModes } from "@/xr/capabilities";

describe("feature-based XR capabilities", () => {
  it("retains desktop when XR is absent without requesting microphone permission", async () => {
    const result = await detectCapabilities({ secureContext: true, webgl: () => true, pointerSupported: true, touchSupported: false, microphoneAvailable: true });
    expect(result.capabilities).toMatchObject({ webxrAvailable: false, immersiveVRSupported: false, immersiveARSupported: false, webglAvailable: true, microphoneAvailable: true });
    expect(availableModes(result.capabilities, false)).toEqual(["desktop"]);
  });
  it("checks VR and AR independently and keeps AR gated by scene configuration", async () => {
    const probe = vi.fn().mockResolvedValue(true);
    const { capabilities } = await detectCapabilities({ secureContext: true, webgl: () => true, xr: { isSessionSupported: probe }, pointerSupported: false, touchSupported: true, microphoneAvailable: false });
    expect(probe.mock.calls).toEqual([["immersive-vr"], ["immersive-ar"]]);
    expect(availableModes(capabilities, false)).toEqual(["desktop", "immersive-vr"]);
    expect(availableModes(capabilities, true)).toEqual(["desktop", "immersive-vr", "immersive-ar"]);
  });
  it("contains rejected support probes without failing desktop rendering", async () => {
    const { capabilities, error } = await detectCapabilities({ secureContext: true, webgl: () => true, xr: { isSessionSupported: async (mode) => { if (mode === "immersive-ar") throw new Error("policy"); return true; } } });
    expect(capabilities.immersiveVRSupported).toBe(true);
    expect(capabilities.immersiveARSupported).toBe(false);
    expect(error).toContain("AR");
  });
  it("avoids protected probes in insecure contexts and catches graphics failures", async () => {
    const probe = vi.fn();
    const { capabilities } = await detectCapabilities({ secureContext: false, webgl: () => { throw new Error("GPU"); }, xr: { isSessionSupported: probe }, microphoneAvailable: true });
    expect(probe).not.toHaveBeenCalled();
    expect(capabilities).toMatchObject({ webglAvailable: false, microphoneAvailable: false, immersiveVRSupported: false });
    expect(availableModes(capabilities, true)).toEqual([]);
  });
});
