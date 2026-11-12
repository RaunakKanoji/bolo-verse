import { useSyncExternalStore } from "react";
let sessionId: string | null = "fixture-session-1";
const listeners = new Set<() => void>();
export function setFixtureSession(value: string | null) {
  sessionId = value;
  listeners.forEach((listener) => listener());
}
export function useAuth() {
  return {
    isLoaded: true,
    sessionId: useSyncExternalStore(
      (listener) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      () => sessionId,
    ),
  };
}
