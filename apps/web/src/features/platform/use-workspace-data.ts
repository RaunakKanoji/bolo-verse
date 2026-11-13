"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { z } from "zod";
import { apiResultSchema } from "@/lib/contracts/api";
import { useWorkspaceSession } from "./WorkspaceSession";

export class WorkspaceRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
export async function workspaceRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  signal: AbortSignal,
  body?: unknown,
  method = "POST",
): Promise<T> {
  const response = await fetch(path.startsWith("/api/v1/") ? path : `/api/v1/workspace/${path}`, {
    method: body === undefined ? "GET" : method,
    credentials: "same-origin",
    cache: "no-store",
    signal,
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new WorkspaceRequestError(
      [401, 403, 404].includes(response.status)
        ? "Workspace access is unavailable. Refresh to check your access."
        : "The workspace returned an unexpected response. Please retry.",
      response.status,
    );
  }
  const parsed = apiResultSchema(schema).safeParse(json);
  if (!parsed.success)
    throw new WorkspaceRequestError(
      "The workspace returned an unexpected response. Please retry.",
      response.status,
    );
  if (!parsed.data.ok) throw new WorkspaceRequestError(parsed.data.error.message, response.status);
  if (!response.ok)
    throw new WorkspaceRequestError(
      "This workspace request could not be completed.",
      response.status,
    );
  return parsed.data.data;
}
export function useWorkspaceData<T>(path: string, schema: z.ZodType<T>) {
  const { sessionKey, configured, isLoaded } = useWorkspaceSession();
  const [result, setResult] = useState<{ scope: string; path: string; data: T } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const controllers = useRef(new Set<AbortController>());
  const current = useRef(sessionKey);
  useLayoutEffect(() => {
    current.current = sessionKey;
  }, [sessionKey]);
  useEffect(() => {
    const pending = controllers.current;
    return () => {
      pending.forEach((c) => c.abort());
      pending.clear();
    };
  }, [sessionKey]);
  useEffect(() => {
    if (!configured || !isLoaded) return;
    const controller = new AbortController();
    const pending = controllers.current;
    pending.add(controller);
    // A new external request owns this loading state; completion and teardown are scoped below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    setDenied(false);
    void workspaceRequest(path, schema, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted && current.current === sessionKey)
          setResult({ scope: sessionKey, path, data });
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted || current.current !== sessionKey) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Workspace data could not be loaded. Retry when your connection returns.",
        );
        if (reason instanceof WorkspaceRequestError && [401, 403, 404].includes(reason.status)) {
          setResult(null);
          setDenied(true);
        }
      })
      .finally(() => {
        controllers.current.delete(controller);
        if (!controller.signal.aborted && current.current === sessionKey) setLoading(false);
      });
    return () => {
      controller.abort();
      pending.delete(controller);
    };
  }, [path, schema, sessionKey, configured, isLoaded, attempt]);
  const mutate = useCallback(
    async <R>(route: string, responseSchema: z.ZodType<R>, body: unknown, method = "POST") => {
      if (!configured) {
        setError(
          "Sign in to a connected workspace to save. Your unsaved draft remains in this page.",
        );
        return null;
      }
      const controller = new AbortController();
      controllers.current.add(controller);
      setBusy(true);
      setError("");
      try {
        const data = await workspaceRequest(route, responseSchema, controller.signal, body, method);
        if (controller.signal.aborted || current.current !== sessionKey) return null;
        setAttempt((value) => value + 1);
        return data;
      } catch (reason) {
        if (controller.signal.aborted || current.current !== sessionKey) return null;
        setError(
          reason instanceof Error
            ? reason.message
            : "Changes could not be saved. Your draft is retained.",
        );
        if (reason instanceof WorkspaceRequestError && [401, 403, 404].includes(reason.status)) {
          setResult(null);
          setDenied(true);
        }
        return null;
      } finally {
        controllers.current.delete(controller);
        if (!controller.signal.aborted && current.current === sessionKey) setBusy(false);
      }
    },
    [configured, sessionKey],
  );
  const revoke = useCallback(() => {
    controllers.current.forEach((c) => c.abort());
    setResult(null);
    setDenied(true);
    setError("Workspace access changed. Refresh to check your access.");
  }, []);
  return {
    revoke,
    data: result?.scope === sessionKey && result.path === path && !denied ? result.data : null,
    error,
    loading,
    busy,
    denied,
    configured,
    mutate,
    refresh: () => setAttempt((value) => value + 1),
  };
}
