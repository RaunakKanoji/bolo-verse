import type { Metadata } from "next";
import StudioClient from "@/features/studio/StudioClient";

export const metadata: Metadata = { title: "Recording lab" };
export default function RecordingLabPage() {
  return <><div className="page-heading"><span className="status-pill"><span /> Local experiment</span><h1>Find your frame.</h1><p>Test a portrait scene and microphone recording before the studio grows. This is a fixed mono view; headset mode comes in the next milestone.</p></div><StudioClient /></>;
}
