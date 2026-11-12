"use client";

import { useSession } from "@clerk/nextjs";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SpatialEditor } from "../editor/SpatialEditor";
import { createSpatialApi, type WorkspaceBootstrap } from "../lib/api";
import { createSessionFetch, type SpatialSession } from "../lib/session-transport";
import { useSpatialAuthConfigured } from "./SpatialAuthProvider";

export function AuthorizedSpatialWorkspace({ projectId }: { projectId: string }) {
  const configured = useSpatialAuthConfigured();
  return configured ? (
    <ClerkSessionWorkspace projectId={projectId} />
  ) : (
    <SessionNotice message="Project sign-in is not configured. Open your project through Shape Studio." />
  );
}
function ClerkSessionWorkspace({ projectId }: { projectId: string }) {
  const { isLoaded, session } = useSession();
  return <SessionWorkspace projectId={projectId} lifecycle={{ isLoaded, session }} />;
}

/** Separates SDK lifecycle from the boundary; every mount still reauthorizes through web. */
export function SessionWorkspace({
  projectId,
  lifecycle,
}: {
  projectId: string;
  lifecycle: { isLoaded: boolean; session: SpatialSession | null | undefined };
}) {
  if (!lifecycle.isLoaded) return <SessionNotice message="Checking your project session…" />;
  if (!lifecycle.session)
    return <SessionNotice message="Sign in through Shape Studio to open this private project." />;
  return (
    <SessionProject
      key={`${lifecycle.session.id}:${projectId}`}
      projectId={projectId}
      session={lifecycle.session}
    />
  );
}

function SessionProject({ projectId, session }: { projectId: string; session: SpatialSession }) {
  const [activeSession] = useState(() => session);
  const requestRef = useRef<AbortController | null>(null);
  const [load, setLoad] = useState<
    | { kind: "loading" }
    | { kind: "ready"; data: WorkspaceBootstrap; fetcher: typeof fetch }
    | { kind: "error" }
  >({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  // Abort at unmount commit, before an old token promise or HTTP response can dispatch/apply.
  useLayoutEffect(
    () => () => {
      requestRef.current?.abort();
    },
    [],
  );
  useEffect(() => {
    const request = new AbortController();
    requestRef.current = request;
    const fetcher = createSessionFetch(activeSession, request.signal);
    void createSpatialApi(fetcher)
      .bootstrap(projectId, request.signal)
      .then((data) => {
        if (!request.signal.aborted) setLoad({ kind: "ready", data, fetcher });
      })
      .catch(() => {
        if (!request.signal.aborted) setLoad({ kind: "error" });
      });
    return () => request.abort();
  }, [projectId, activeSession, attempt]);
  if (load.kind === "loading")
    return <SessionNotice message="Opening your authorized project scene…" />;
  if (load.kind === "error")
    return (
      <SessionNotice
        message="This project could not be opened for your current session. Check your access in Shape Studio."
        retry={() => {
          setLoad({ kind: "loading" });
          setAttempt((current) => current + 1);
        }}
      />
    );
  return <SpatialEditor {...load.data} fetcher={load.fetcher} />;
}

function SessionNotice({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <main className="access-notice">
      <a className="shape-wordmark" href="/app/projects">
        shape
        <span className="brand-dot" />
      </a>
      <section>
        <h1>Spatial workspace</h1>
        <p role="status">{message}</p>
        {retry && (
          <button type="button" onClick={retry}>
            Try again
          </button>
        )}
        <a className="button-link" href="/app/projects">
          Go to your projects
        </a>
      </section>
    </main>
  );
}
