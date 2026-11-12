"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiResultSchema } from "@/lib/contracts/api";
import {
  CreativeCapabilitiesSchema,
  CreativeDraftResultSchema,
  type CreativeDraftDocument,
  type CreativeDraftSnapshot,
} from "@/lib/contracts/shape";
import type { PlaygroundStore } from "./playground-state";

const catalogEnvelope = apiResultSchema(CreativeCapabilitiesSchema);
const draftEnvelope = apiResultSchema(CreativeDraftResultSchema);
class DraftError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}
async function request(url: string, options: RequestInit = {}, upstream?: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  upstream?.addEventListener("abort", abort, { once: true });
  if (upstream?.aborted) abort();
  const timer = setTimeout(abort, 15_000);
  try {
    return (await (
      await fetch(url, {
        ...options,
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      })
    ).json()) as unknown;
  } finally {
    clearTimeout(timer);
    upstream?.removeEventListener("abort", abort);
  }
}
function friendly(error: unknown) {
  if (error instanceof DraftError) return error.message;
  if (error instanceof Error && error.name === "AbortError")
    return "The request was interrupted. Your prompt text is still here. Reload the saved draft before retrying a save.";
  return "The workspace service could not respond. Your local prompt text is unchanged.";
}
export function useCreativeCapabilities() {
  return useQuery({
    queryKey: ["creative-capabilities"],
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const result = catalogEnvelope.parse(await request("/api/v1/capabilities", {}, signal));
      if (!result.ok) throw new DraftError(result.error.message, result.error.code);
      return result.data;
    },
  });
}

export function useCreativeDraft(
  projectId: string | undefined,
  store: PlaygroundStore,
  serialized: string,
) {
  const client = useQueryClient();
  const [baseline, setBaseline] = useState(() => JSON.stringify(store.getState().document));
  const [revision, setRevision] = useState(0);
  const [canEdit, setCanEdit] = useState(!projectId);
  const [busy, setBusy] = useState(Boolean(projectId));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [conflict, setConflict] = useState(false);
  const active = useRef(false);
  const pending = useRef<AbortController | null>(null);
  const dirty = canEdit && serialized !== baseline;
  const apply = (draft: CreativeDraftSnapshot) => {
    store.getState().loadDocument(draft.document);
    setBaseline(JSON.stringify(draft.document));
    setRevision(draft.revision);
    setCanEdit(draft.canEdit);
  };
  async function read(signal: AbortSignal) {
    const result = draftEnvelope.parse(
      await request(`/api/v1/projects/${projectId}/creative-draft`, {}, signal),
    );
    if (!result.ok) throw new DraftError(result.error.message, result.error.code);
    return result.data.draft;
  }
  useEffect(() => {
    let live = true;
    active.current = true;
    if (projectId) {
      void client
        .fetchQuery({
          queryKey: ["creative-draft", projectId],
          gcTime: 0,
          staleTime: 0,
          queryFn: ({ signal }) => read(signal),
        })
        .then((draft) => {
          if (live) apply(draft);
        })
        .catch((reason) => {
          if (live) setError(friendly(reason));
        })
        .finally(() => {
          if (live) setBusy(false);
        });
    }
    return () => {
      live = false;
      active.current = false;
      pending.current?.abort();
      void client.cancelQueries({ queryKey: ["creative-draft", projectId] });
      client.removeQueries({ queryKey: ["creative-draft", projectId] });
    };
    // This component is keyed by project. Its store and initial load never cross project boundaries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, client, store]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const confirmLeave = () =>
      window.confirm("Leave this workspace and discard unsaved prompt changes?");
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      )
        return;
      const next = new URL(anchor.href, window.location.href);
      if (
        next.origin !== window.location.origin ||
        (next.pathname === window.location.pathname && next.search === window.location.search)
      )
        return;
      if (!confirmLeave()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const navigate = (event: Event) => {
      if (!confirmLeave()) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", click, true);
    window.addEventListener("shape-before-navigate", navigate);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", click, true);
      window.removeEventListener("shape-before-navigate", navigate);
    };
  }, [dirty]);
  const mutation = useMutation({
    mutationFn: async ({
      document,
      expectedRevision,
      signal,
    }: {
      document: CreativeDraftDocument;
      expectedRevision: number;
      signal: AbortSignal;
    }) => {
      const result = draftEnvelope.parse(
        await request(
          `/api/v1/projects/${projectId}/creative-draft`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expectedRevision, document }),
          },
          signal,
        ),
      );
      if (!result.ok) throw new DraftError(result.error.message, result.error.code);
      return result.data.draft;
    },
  });
  async function save() {
    if (!projectId || !canEdit || busy || pending.current || !dirty) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError("");
    setNotice("");
    setConflict(false);
    try {
      const result = await mutation.mutateAsync({
        expectedRevision: revision,
        document: structuredClone(store.getState().document),
        signal: controller.signal,
      });
      if (active.current) {
        setBaseline(JSON.stringify(result.document));
        setRevision(result.revision);
        setNotice(`Prompt draft saved · revision ${result.revision}`);
      }
    } catch (reason) {
      if (active.current) {
        setError(friendly(reason));
        setConflict(reason instanceof DraftError && reason.code === "CONFLICT");
      }
    } finally {
      pending.current = null;
      if (active.current) setBusy(false);
    }
  }
  async function reload() {
    if (
      !projectId ||
      busy ||
      pending.current ||
      (dirty && !window.confirm("Reload the saved prompt draft and discard local prompt changes?"))
    )
      return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await read(controller.signal);
      if (active.current) {
        apply(result);
        setConflict(false);
        setNotice("Saved prompt draft loaded.");
      }
    } catch (reason) {
      if (active.current) setError(friendly(reason));
    } finally {
      pending.current = null;
      if (active.current) setBusy(false);
    }
  }
  return { canEdit, busy, dirty, error, notice, conflict, save, reload, revision };
}
