import { useSyncExternalStore } from "react";
// SDK boundary stub for isolated HTTP fixtures only, never a production alias.
const snapshot = () => (window as Window & { voiceSessionId?: string | null }).voiceSessionId;
const subscribe = (listener: () => void) => {
  window.addEventListener("voice-session-change", listener);
  return () => window.removeEventListener("voice-session-change", listener);
};
export function useAuth() {
  const sessionId = useSyncExternalStore(subscribe, snapshot);
  return {
    isLoaded: true,
    sessionId: sessionId === undefined ? "voice-fixture-session" : sessionId,
  };
}
