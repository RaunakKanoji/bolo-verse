export interface XRCapabilities {
  webxrAvailable: boolean;
  immersiveVRSupported: boolean;
  immersiveARSupported: boolean;
  webglAvailable: boolean;
  secureContext: boolean;
  pointerSupported: boolean;
  touchSupported: boolean;
  microphoneAvailable: boolean;
}

export interface CapabilityEnvironment {
  secureContext: boolean;
  xr?: { isSessionSupported(mode: "immersive-vr" | "immersive-ar"): Promise<boolean> };
  webgl(): boolean;
  pointerSupported?: boolean;
  touchSupported?: boolean;
  microphoneAvailable?: boolean;
}

/** No browser globals at module scope and no permission requests while detecting. */
export async function detectCapabilities(environment: CapabilityEnvironment): Promise<{
  capabilities: XRCapabilities;
  error: string | null;
}> {
  let webglAvailable = false;
  try {
    webglAvailable = environment.webgl();
  } catch {
    /* Graphics may be disabled by policy. */
  }
  const capabilities: XRCapabilities = {
    webxrAvailable: Boolean(environment.xr),
    immersiveVRSupported: false,
    immersiveARSupported: false,
    webglAvailable,
    secureContext: environment.secureContext,
    pointerSupported: Boolean(environment.pointerSupported),
    touchSupported: Boolean(environment.touchSupported),
    microphoneAvailable: environment.secureContext && Boolean(environment.microphoneAvailable),
  };
  const errors: string[] = [];
  if (environment.xr && environment.secureContext) {
    const results = await Promise.allSettled([
      environment.xr.isSessionSupported("immersive-vr"),
      environment.xr.isSessionSupported("immersive-ar"),
    ]);
    capabilities.immersiveVRSupported = results[0].status === "fulfilled" && results[0].value;
    capabilities.immersiveARSupported = results[1].status === "fulfilled" && results[1].value;
    results.forEach((result, index) => {
      if (result.status === "rejected")
        errors.push(`${index ? "AR" : "VR"} support could not be checked.`);
    });
  }
  return { capabilities, error: errors.length ? errors.join(" ") : null };
}

export function availableModes(capabilities: XRCapabilities, arConfigured = false) {
  const modes: ("desktop" | "immersive-vr" | "immersive-ar")[] = [];
  if (!capabilities.webglAvailable) return modes;
  modes.push("desktop");
  if (capabilities.secureContext && capabilities.immersiveVRSupported) modes.push("immersive-vr");
  if (arConfigured && capabilities.secureContext && capabilities.immersiveARSupported)
    modes.push("immersive-ar");
  return modes;
}

export const XR_FALLBACK_MESSAGE =
  "Immersive XR is unavailable on this browser. You can still explore the studio in 3D.";

export function browserCapabilityEnvironment(): CapabilityEnvironment {
  return {
    secureContext: window.isSecureContext,
    xr: navigator.xr,
    pointerSupported: "PointerEvent" in window,
    touchSupported: navigator.maxTouchPoints > 0,
    microphoneAvailable: typeof navigator.mediaDevices?.getUserMedia === "function",
    webgl: () => {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2");
      const available = Boolean(gl);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      return available;
    },
  };
}
