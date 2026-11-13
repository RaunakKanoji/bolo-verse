"use client";
import { createContext, Fragment, useContext } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

type Session = {
  sessionKey: string;
  firstName: string | null;
  configured: boolean;
  isLoaded: boolean;
};
const offline: Session = {
  sessionKey: "unconfigured",
  firstName: null,
  configured: false,
  isLoaded: true,
};
const SessionContext = createContext<Session>(offline);
export const useWorkspaceSession = () => useContext(SessionContext);

export function WorkspaceSessionProvider({
  configured,
  children,
}: {
  configured: boolean;
  children: React.ReactNode;
}) {
  return configured ? (
    <AuthenticatedSession>{children}</AuthenticatedSession>
  ) : (
    <SessionContext.Provider value={offline}>{children}</SessionContext.Provider>
  );
}
function AuthenticatedSession({ children }: { children: React.ReactNode }) {
  const { sessionId, isLoaded } = useAuth();
  const { user } = useUser();
  const sessionKey = isLoaded ? (sessionId ?? "signed-out") : "checking-session";
  return (
    <SessionContext.Provider
      value={{ sessionKey, firstName: user?.firstName ?? null, configured: true, isLoaded }}
    >
      <Fragment key={sessionKey}>{children}</Fragment>
    </SessionContext.Provider>
  );
}
