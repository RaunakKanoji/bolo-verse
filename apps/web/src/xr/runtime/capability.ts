export type XRCapability = {
  state: "checking" | "supported" | "unavailable";
  message: string;
};

export interface XRSupportProbe {
  isSessionSupported(mode: "immersive-vr"): Promise<boolean>;
}

export async function detectXRCapability(
  xr: XRSupportProbe | undefined,
  secureContext: boolean,
): Promise<XRCapability> {
  if (!secureContext)
    return {
      state: "unavailable",
      message: "Desktop mode · HTTPS is required for a headset session.",
    };
  if (!xr)
    return {
      state: "unavailable",
      message: "Desktop mode · WebXR is not available in this browser.",
    };
  try {
    const supported = await xr.isSessionSupported("immersive-vr");
    return supported
      ? { state: "supported", message: "Immersive VR is available. Connect your headset to enter." }
      : { state: "unavailable", message: "Desktop mode · No immersive VR headset is available." };
  } catch {
    return {
      state: "unavailable",
      message: "Desktop mode · The headset support check is unavailable in this browser.",
    };
  }
}
