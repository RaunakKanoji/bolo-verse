import StudioShell from "@/features/workspace/StudioShell";
import DeviceRecorder from "@/features/platform/DeviceRecorder";
export default function RecordingPage() {
  return (
    <StudioShell title="Recording Lab">
      <DeviceRecorder />
    </StudioShell>
  );
}
