import type { Metadata } from "next";
import XRWorkspace from "@/xr/XRWorkspace";

export const metadata: Metadata = { title: "XR foundation preview" };

export default function XRPreviewPage() {
  return <>

    <XRWorkspace preview project={{ id: "00000000-0000-4000-8000-000000000001", name: "Creative studio preview", objective: "Explore a calm workspace for campaign ideas. These are original sample cards, not saved project artifacts." }} />
  </>;
}
