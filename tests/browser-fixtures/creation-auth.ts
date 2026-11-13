import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
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
// These exports exist only in esbuild's isolated browser fixture alias.
export function useUser() {
  const { sessionId } = useAuth();
  return { isLoaded: true, user: sessionId ? { id: "fixture-user", firstName: "Fixture" } : null };
}
export function SignInButton({ children }: { children: ReactNode }) {
  return children;
}
export function UserButton() {
  return null;
}
