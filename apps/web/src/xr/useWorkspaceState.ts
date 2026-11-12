"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { apiResultSchema } from "@/lib/contracts/api";
import { XRWorkspaceDataSchema, XRWorkspaceSnapshotSchema } from "@/lib/contracts/xr-workspace";
import {
  createProjectDocument,
  createStudioDocument,
  documentToLayout,
  type SceneDocument,
} from "./serializers/scene-document";
import type { XRWorkspaceProps } from "./XRWorkspace";

const savedResponse = apiResultSchema(z.strictObject({ workspace: XRWorkspaceSnapshotSchema }));
const loadedResponse = apiResultSchema(XRWorkspaceDataSchema);

export function useWorkspaceState({ project, preview = false, initialData }: XRWorkspaceProps) {
  const [data, setData] = useState(initialData);
  const [document, setDocument] = useState<SceneDocument>(() => {
    if (preview) return createStudioDocument(project);
    if (!initialData) throw new Error("Authorized project data is required.");
    return createProjectDocument(project, initialData.content, initialData.workspace.layout);
  });
  const [baseline, setBaseline] = useState(() => JSON.stringify(documentToLayout(document)));
  const [version, setVersion] = useState(initialData?.workspace.version ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [notice, setNotice] = useState("");
  const pending = useRef<AbortController | null>(null);
  const canEdit = preview || Boolean(data?.canEdit);
  const dirty = JSON.stringify(documentToLayout(document)) !== baseline;
  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const linkClick = (event: MouseEvent) => {
      const link =
        event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (
        !link ||
        link.target === "_blank" ||
        link.download ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        (new URL(link.href).hash && new URL(link.href).pathname === location.pathname)
      )
        return;
      if (
        new URL(link.href).origin === location.origin &&
        !window.confirm("Leave this workspace and discard unsaved layout changes?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    documentGlobal().addEventListener("click", linkClick, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      documentGlobal().removeEventListener("click", linkClick, true);
    };
  }, [dirty]);

  async function request(path: string, options: RequestInit = {}) {
    const controller = new AbortController();
    pending.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      return (await (
        await fetch(path, { ...options, signal: controller.signal, cache: "no-store" })
      ).json()) as unknown;
    } finally {
      clearTimeout(timeout);
      if (pending.current === controller) pending.current = null;
    }
  }
  async function save() {
    if (preview || !canEdit || busy || !dirty) return;
    setBusy(true);
    setError("");
    setNotice("");
    setConflict(false);
    const layout = documentToLayout(document);
    try {
      const result = savedResponse.parse(
        await request(`/api/xr/workspaces/${project.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expectedVersion: version, layout }),
        }),
      );
      if (!result.ok) {
        setConflict(result.error.code === "CONFLICT");
        throw new Error(result.error.message);
      }
      setVersion(result.data.workspace.version);
      setBaseline(JSON.stringify(result.data.workspace.layout));
      setNotice(`Workspace saved · version ${result.data.workspace.version}`);
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  }
  async function reload() {
    if (
      preview ||
      busy ||
      (dirty && !window.confirm("Reload the saved layout and discard your unsaved changes?"))
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = loadedResponse.parse(await request(`/api/xr/workspaces/${project.id}`));
      if (!result.ok) throw new Error(result.error.message);
      const next = createProjectDocument(
        result.data.project,
        result.data.content,
        result.data.workspace.layout,
      );
      setData(result.data);
      setDocument(next);
      setVersion(result.data.workspace.version);
      setBaseline(JSON.stringify(documentToLayout(next)));
      setConflict(false);
      setNotice("Saved workspace loaded.");
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  }
  async function reset(confirmed = false) {
    if (
      !canEdit ||
      busy ||
      (!confirmed &&
        !window.confirm(
          preview
            ? "Reset this sample layout?"
            : "Reset and save the default workspace layout? This replaces the saved positions.",
        ))
    )
      return;
    if (preview) {
      const next = createStudioDocument(project);
      setDocument(next);
      setBaseline(JSON.stringify(documentToLayout(next)));
      setNotice("Sample layout reset. Nothing is saved.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    setConflict(false);
    try {
      const result = savedResponse.parse(
        await request(`/api/xr/workspaces/${project.id}/reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expectedVersion: version }),
        }),
      );
      if (!result.ok) {
        setConflict(result.error.code === "CONFLICT");
        throw new Error(result.error.message);
      }
      // Reset selects the latest content versions; reload their authorized catalog.
      const loaded = loadedResponse.parse(await request(`/api/xr/workspaces/${project.id}`));
      if (!loaded.ok) throw new Error(loaded.error.message);
      const next = createProjectDocument(
        loaded.data.project,
        loaded.data.content,
        loaded.data.workspace.layout,
      );
      setData(loaded.data);
      setDocument(next);
      setVersion(loaded.data.workspace.version);
      setBaseline(JSON.stringify(documentToLayout(next)));
      setNotice("Default layout saved.");
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  }
  return {
    data,
    document,
    setDocument,
    canEdit,
    dirty,
    busy,
    error,
    conflict,
    notice,
    version,
    save,
    reload,
    reset,
  };
}

function documentGlobal() {
  return window.document;
}
function message(reason: unknown) {
  if (reason instanceof DOMException && reason.name === "AbortError")
    return "The request timed out. Your local layout is still here. Reload the saved version before retrying; the server may have saved it.";
  return reason instanceof Error && !(reason instanceof z.ZodError)
    ? reason.message
    : "The workspace response could not be read. Your local layout is unchanged; try again.";
}
