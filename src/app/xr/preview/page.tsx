import type { Metadata } from "next";
import Link from "next/link";
import XRWorkspace from "@/xr/XRWorkspace";

export const metadata: Metadata = { title: "XR foundation preview" };

export default function XRPreviewPage() {
  return <>
    <div className="page-heading"><span className="status-pill">Public capability preview</span><h1>XR foundation preview</h1><p>Explore a real A-Frame studio in this browser. This sample is not connected to a project and is not saved. <Link href="/app/projects" className="text-primary underline">Open your projects</Link> to use your authorized workspace.</p></div>
    <XRWorkspace preview project={{ id: "00000000-0000-4000-8000-000000000001", name: "Creative studio preview", objective: "Explore a calm workspace for campaign ideas. These are original sample cards, not saved project artifacts." }} />
  </>;
}
