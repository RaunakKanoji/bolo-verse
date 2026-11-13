import type { Metadata } from "next";
import SpatialHUDShell from "@/xr/hud/SpatialHUDShell";
import XRErrorBoundary from "@/xr/XRErrorBoundary";
export const metadata: Metadata = { title: "Spatial workspace" };
export default function SpatialHUDPage() {
  return (
    <XRErrorBoundary>
      <SpatialHUDShell />
    </XRErrorBoundary>
  );
}
