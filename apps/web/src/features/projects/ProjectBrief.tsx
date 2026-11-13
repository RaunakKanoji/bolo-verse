"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import ProjectBrainstorm from "./ProjectBrainstorm";
import { BriefPayloadSchema, type BriefPayload } from "@/lib/contracts/documents";
import {
  ProjectBriefResponseSchema,
  SaveProjectBriefSchema,
  type ProjectBriefResult,
  type SaveProjectBrief,
} from "@/lib/contracts/project-briefs";
import styles from "./projects.module.css";

type Draft = {
  title: string;
  objective: string;
  audience: string;
  product: string;
  format: BriefPayload["format"];
  aspectRatio: BriefPayload["aspectRatio"];
  language: BriefPayload["language"];
  tone: string;
  facts: string;
  prohibitedClaims: string;
  constraints: string;
  brandRequirements: string;
  keyMessage: string;
  channels: string;
  references: string;
  deadline: string;
  notes: string;
};
function fields(brief: BriefPayload | null, objective: string): Draft {
  return {
    title: brief?.title ?? (brief ? `${brief.product} brief` : ""),
    objective: brief?.objective ?? objective.slice(0, 1000),
    audience: brief?.audience ?? "",
    product: brief?.product ?? "",
    format: brief?.format ?? "poster",
    aspectRatio: brief?.aspectRatio ?? "1:1",
    language: brief?.language ?? "en-IN",
    tone: brief?.tone ?? "",
    facts: brief?.facts.map((fact) => fact.text).join("\n") ?? "",
    prohibitedClaims: brief?.prohibitedClaims.join("\n") ?? "",
    constraints: brief?.constraints.join("\n") ?? "",
    brandRequirements: brief?.brandRequirements ?? "",
    keyMessage: brief?.keyMessage ?? "",
    channels: brief?.channels?.join("\n") ?? "",
    references: brief?.references?.join("\n") ?? "",
    deadline: brief?.deadline ?? "",
    notes: brief?.notes ?? "",
  };
}
const lines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
function payload(draft: Draft, saved: ProjectBriefResult): BriefPayload {
  const original = fields(saved.brief, "");
  return {
    ...draft,
    schemaVersion: 1,
    facts:
      saved.brief && draft.facts === original.facts
        ? saved.brief.facts
        : lines(draft.facts).map((text, index) => ({
            id: saved.brief?.facts[index]?.id ?? crypto.randomUUID(),
            text,
          })),
    prohibitedClaims:
      saved.brief && draft.prohibitedClaims === original.prohibitedClaims
        ? saved.brief.prohibitedClaims
        : lines(draft.prohibitedClaims),
    constraints:
      saved.brief && draft.constraints === original.constraints
        ? saved.brief.constraints
        : lines(draft.constraints),
    channels:
      saved.brief && draft.channels === original.channels
        ? saved.brief.channels
        : lines(draft.channels),
    references:
      saved.brief && draft.references === original.references
        ? saved.brief.references
        : lines(draft.references),
    deadline: draft.deadline || undefined,
  };
}

function Summary({ brief }: { brief: BriefPayload }) {
  const values = fields(brief, "");
  return (
    <dl className={styles.briefSummary}>
      {Object.entries(values).map(
        ([key, value]) =>
          value && (
            <div key={key}>
              <dt>{labels[key as keyof Draft]}</dt>
              <dd>{value}</dd>
            </div>
          ),
      )}
    </dl>
  );
}
const labels: Record<keyof Draft, string> = {
  title: "Brief title",
  objective: "Goal / objectives",
  audience: "Audience",
  product: "Brand / product",
  format: "Deliverable type",
  aspectRatio: "Aspect ratio",
  language: "Language",
  tone: "Tone",
  facts: "Verified facts",
  prohibitedClaims: "Prohibited claims",
  constraints: "Constraints",
  brandRequirements: "Brand requirements",
  keyMessage: "Key message",
  channels: "Channels",
  references: "Reference URLs",
  deadline: "Due date",
  notes: "Notes",
};
const textFields: {
  name: keyof Draft;
  max: number;
  required?: boolean;
  rows?: number;
  hint?: string;
}[] = [
  { name: "title", max: 120, required: true },
  { name: "objective", max: 1000, required: true, rows: 3 },
  { name: "audience", max: 1000, required: true, rows: 3 },
  { name: "product", max: 300, required: true },
  { name: "tone", max: 300, required: true },
  { name: "brandRequirements", max: 2000, rows: 3 },
  { name: "keyMessage", max: 1000, rows: 3 },
  {
    name: "facts",
    max: 6019,
    rows: 3,
    hint: "One verified fact per line; up to 20, 300 characters each.",
  },
  {
    name: "prohibitedClaims",
    max: 6019,
    rows: 3,
    hint: "One claim per line; up to 20, 300 characters each.",
  },
  {
    name: "constraints",
    max: 6019,
    rows: 3,
    hint: "One constraint per line; up to 20, 300 characters each.",
  },
  {
    name: "channels",
    max: 2419,
    rows: 2,
    hint: "One channel per line; up to 20, 120 characters each.",
  },
  {
    name: "references",
    max: 20009,
    rows: 2,
    hint: "One HTTPS URL per line; up to 10. Do not include credentials or private signed links.",
  },
  { name: "notes", max: 5000, rows: 4 },
];

export default function ProjectBrief({
  projectId,
  objective,
}: {
  projectId: string;
  objective: string;
}) {
  const [saved, setSaved] = useState<ProjectBriefResult | null>(null);
  const [draft, setDraft] = useState<Draft>(() => fields(null, objective));
  const [baseline, setBaseline] = useState("");
  const [busy, setBusy] = useState<"load" | "save" | null>("load");
  const [error, setError] = useState("");
  const [validation, setValidation] = useState<Partial<Record<keyof Draft, string>>>({});
  const [conflict, setConflict] = useState(false);
  const [comparison, setComparison] = useState<ProjectBriefResult | null>(null);
  const [denied, setDenied] = useState(false);
  const pending = useRef<AbortController | null>(null);
  const retry = useRef<{ signature: string; input: SaveProjectBrief } | null>(null);
  const dirty = !!saved?.canEdit && !denied && JSON.stringify(draft) !== baseline;
  const endpoint = `/api/v1/projects/${projectId}/brief`;
  function adopt(value: ProjectBriefResult) {
    const next = fields(value.brief, objective);
    setSaved(value);
    setDraft(next);
    setBaseline(JSON.stringify(next));
    setConflict(false);
    setComparison(null);
    setValidation({});
    retry.current = null;
  }

  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const navigate = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a[href]");
      if (
        !link ||
        link.getAttribute("target") === "_blank" ||
        link.hasAttribute("download") ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      if (!window.confirm("You have unsaved brief changes. Leave this page?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty]);

  async function transport(input?: SaveProjectBrief) {
    const controller = new AbortController();
    pending.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint, {
        cache: "no-store",
        signal: controller.signal,
        ...(input
          ? {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(input),
            }
          : {}),
      });
      if (response.status === 401 || response.status === 403) {
        setDenied(true);
        setSaved(null);
        setDraft(fields(null, ""));
        retry.current = null;
        setComparison(null);
        throw new Error(
          "Brief access is unavailable. Sign in with an authorized account and reopen this project.",
        );
      }
      if (response.status === 409) {
        setConflict(true);
        throw new Error(
          "Another version was saved. Your edits are kept here. Refresh the saved brief to compare before saving again.",
        );
      }
      const parsed = ProjectBriefResponseSchema.safeParse(await response.json());
      if (!parsed.success)
        throw new Error("Unexpected response. Your edits are kept here. Try again when connected.");
      if (!parsed.data.ok) throw new Error(parsed.data.error.message);
      if (!response.ok)
        throw new Error("The brief could not be saved. Your edits are kept here. Try again.");
      return parsed.data.data;
    } finally {
      clearTimeout(timeout);
      if (pending.current === controller) pending.current = null;
    }
  }

  // The page keys this component by validated account and project. Abort stale work on unmount.
  useEffect(() => {
    let active = true;
    transport()
      .then((value) => {
        if (active) adopt(value);
      })
      .catch(() => {
        if (active)
          setError(
            "Could not load this brief. Check your connection and project access, then retry.",
          );
      })
      .finally(() => {
        if (active) setBusy(null);
      });
    return () => {
      active = false;
      pending.current?.abort();
    };
    // Loading is scoped to the account/project component instance, never draft edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  async function refresh() {
    if (busy) return;
    setBusy("load");
    setError("");
    try {
      const value = await transport();
      if (!value.canEdit) adopt(value);
      else if (dirty) setComparison(value);
      else adopt(value);
    } catch (cause) {
      setError(
        cause instanceof Error && !(cause instanceof TypeError) && cause.name !== "AbortError"
          ? cause.message
          : "Could not load the saved brief. Check your connection and try again.",
      );
    } finally {
      setBusy(null);
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !saved?.canEdit || conflict || denied) return;
    const signature = JSON.stringify({ draft, version: saved.version });
    const candidate =
      retry.current?.signature === signature
        ? retry.current.input
        : {
            expectedVersion: saved.version,
            idempotencyKey: crypto.randomUUID(),
            brief: payload(draft, saved),
          };
    const parsed = BriefPayloadSchema.safeParse(candidate.brief);
    if (!parsed.success) {
      const issues: Partial<Record<keyof Draft, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]) as keyof Draft;
        if (!issues[key]) issues[key] = issue.message;
      }
      setValidation(issues);
      setError("Check the highlighted brief fields.");
      document.getElementById(`brief-${Object.keys(issues)[0]}`)?.focus();
      return;
    }
    const bounded = SaveProjectBriefSchema.safeParse({ ...candidate, brief: parsed.data });
    if (!bounded.success) {
      setError(bounded.error.issues[0]?.message ?? "Shorten the brief before saving.");
      return;
    }
    retry.current = { signature, input: bounded.data };
    setBusy("save");
    setError("");
    setValidation({});
    try {
      adopt(await transport(retry.current.input));
    } catch (cause) {
      setError(
        cause instanceof Error && !(cause instanceof TypeError) && cause.name !== "AbortError"
          ? cause.message
          : "Could not confirm the save. Your edits are kept here. Retry to safely check the same request.",
      );
    } finally {
      setBusy(null);
    }
  }
  function edit(name: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [name]: value }));
    setValidation((current) => ({ ...current, [name]: undefined }));
  }

  return (
    <section id="brainstorm" className={styles.brief} aria-labelledby="project-brief-heading">
      <h2 id="project-brief-heading">Client brief</h2>
      <p className="muted">
        {saved?.canEdit
          ? "Save a new version for each change. Client access is limited to approved versions."
          : "Approved brief summary for this project."}
      </p>
      <p role="status" aria-live="polite">
        {busy === "load"
          ? "Loading brief…"
          : busy === "save"
            ? "Saving brief…"
            : saved
              ? `Latest saved version: ${saved.version}${dirty ? " · Unsaved changes" : ""}`
              : "Brief unavailable"}
      </p>
      {saved?.savedAt && (
        <p className="muted">
          Saved <time dateTime={saved.savedAt}>{new Date(saved.savedAt).toLocaleString()}</time>
        </p>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {!denied && (
        <Button type="button" variant="outline" disabled={!!busy} onClick={refresh}>
          {saved ? "Refresh saved brief" : "Retry loading brief"}
        </Button>
      )}
      {comparison && (
        <aside className={styles.comparison} aria-label="Saved brief comparison">
          <h3>Saved version {comparison.version}</h3>
          {comparison.brief ? <Summary brief={comparison.brief} /> : <p>No saved brief.</p>}
          <div className={styles.formActions}>
            <Button
              type="button"
              disabled={!!busy}
              onClick={() => {
                if (window.confirm("Replace your unsaved edits with the saved brief?"))
                  adopt(comparison);
              }}
            >
              Replace edits with saved brief
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!!busy || !comparison.canEdit}
              onClick={() => {
                setSaved(comparison);
                setBaseline(JSON.stringify(fields(comparison.brief, objective)));
                setComparison(null);
                setConflict(false);
                setError("");
                retry.current = null;
              }}
            >
              Keep my edits on version {comparison.version}
            </Button>
          </div>
          <p className="muted">
            Compare and merge changes into your fields before saving. Keeping your edits allows them
            to become the next version.
          </p>
        </aside>
      )}
      {saved &&
        !denied &&
        (saved.canEdit ? (
          <form onSubmit={submit} noValidate className={styles.form} aria-label="Edit client brief">
            <fieldset disabled={!!busy} className={styles.briefFields}>
              {textFields.map(({ name, max, required, rows, hint }) => (
                <div key={name} className={styles.field}>
                  <label htmlFor={`brief-${name}`}>
                    {labels[name]}
                    {required ? " *" : ""}
                  </label>
                  {rows ? (
                    <textarea
                      id={`brief-${name}`}
                      value={draft[name]}
                      maxLength={max}
                      required={required}
                      rows={rows}
                      onChange={(event) => edit(name, event.target.value)}
                      aria-invalid={!!validation[name]}
                      aria-describedby={hint || validation[name] ? `brief-${name}-help` : undefined}
                    />
                  ) : (
                    <input
                      id={`brief-${name}`}
                      value={draft[name]}
                      maxLength={max}
                      required={required}
                      onChange={(event) => edit(name, event.target.value)}
                      aria-invalid={!!validation[name]}
                      aria-describedby={validation[name] ? `brief-${name}-help` : undefined}
                    />
                  )}
                  {(hint || validation[name]) && (
                    <p id={`brief-${name}-help`}>{validation[name] ?? hint}</p>
                  )}
                </div>
              ))}
              {(
                [
                  ["format", ["poster", "reel", "script"]],
                  ["aspectRatio", ["1:1", "9:16", "16:9"]],
                  ["language", ["en-IN", "hi-IN", "kn-IN"]],
                ] as const
              ).map(([name, options]) => (
                <div key={name} className={styles.field}>
                  <label htmlFor={`brief-${name}`}>{labels[name]}</label>
                  <select
                    id={`brief-${name}`}
                    value={draft[name]}
                    onChange={(event) => edit(name, event.target.value)}
                  >
                    {options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
              ))}
              <div className={styles.field}>
                <label htmlFor="brief-deadline">Due date (optional)</label>
                <input
                  type="date"
                  id="brief-deadline"
                  value={draft.deadline}
                  onChange={(event) => edit("deadline", event.target.value)}
                />
              </div>
            </fieldset>
            <div className={styles.formActions}>
              <Button type="submit" disabled={!!busy || !dirty || conflict}>
                {busy === "save" ? "Saving brief…" : "Save brief"}
              </Button>
              <span>{dirty ? "Unsaved brief changes" : ""}</span>
            </div>
          </form>
        ) : saved.brief ? (
          <Summary brief={saved.brief} />
        ) : (
          <p>No approved brief is available yet.</p>
        ))}
      {saved?.canEdit && !denied && (
        <ProjectBrainstorm
          projectId={projectId}
          sourceBriefVersion={saved.version}
          disabled={!!busy}
          onAddToBrief={(text) => {
            const notes = [draft.notes.trim(), text].filter(Boolean).join("\n\n");
            if (notes.length > 5000) return false;
            edit("notes", notes);
            return true;
          }}
          onAccessLost={() => {
            setDenied(true);
            setSaved(null);
            setDraft(fields(null, ""));
            setComparison(null);
            retry.current = null;
            setError(
              "Brief access is unavailable. Sign in with an authorized account and reopen this project.",
            );
          }}
        />
      )}
    </section>
  );
}
