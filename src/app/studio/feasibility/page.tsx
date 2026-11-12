import type { Metadata } from "next";
import StudioClient from "@/features/studio/StudioClient";

export const metadata: Metadata = { title: "Recording lab" };
export default function RecordingLabPage() {
  return <><div className="page-heading"><span className="status-pill"><span /> Local experiment</span><h1>Find your frame.</h1><p>Test a portrait scene and microphone recording. This preserved recording lab uses a fixed mono view; the separate XR studio provides immersive capability checks.</p></div><StudioClient /></>;
}
