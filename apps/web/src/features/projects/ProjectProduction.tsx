"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ProductionLibraryResponseSchema,
  ProductionSaveResponseSchema,
  SaveProductionArtifactSchema,
  type ProductionLibrary,
  type ProductionPayload,
  type SaveProductionArtifact,
} from "@/lib/contracts/production-artifacts";
import styles from "@/features/platform/platform.module.css";
import own from "./production.module.css";
type Kind = ProductionPayload["kind"];
const names: Record<Kind, string> = {
  direction: "Creative direction",
  script: "Script",
  storyboard: "Text storyboard",
  note: "Production note",
};
const initial = (kind: Kind): ProductionPayload => {
  if (kind === "direction")
    return {
      kind,
      schemaVersion: 1,
      briefVersionId: "",
      title: "",
      hook: "",
      concept: "",
      visualTreatment: "",
      rationale: "",
      constraints: [],
    };
  if (kind === "script")
    return {
      kind,
      schemaVersion: 1,
      briefVersionId: "",
      directionVersionId: "",
      sections: [{ id: crypto.randomUUID(), spokenText: "", onScreenText: "", durationSeconds: 5 }],
      callToAction: "",
    };
  if (kind === "storyboard")
    return { kind, schemaVersion: 1, scriptVersionId: "", shots: [shot()] };
  return { kind, schemaVersion: 1, text: "" };
};
const shot = () => ({
  id: crypto.randomUUID(),
  durationSeconds: 5,
  framing: "",
  cameraMovement: "Static",
  description: "",
  narration: "",
  textOverlay: "",
  assetIds: [] as string[],
  lighting: "",
  shootingNotes: "",
});
function Text({
  label,
  value,
  max,
  change,
  multiline = true,
}: {
  label: string;
  value: string;
  max: number;
  change: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className={styles.field}>
      {label}
      {multiline ? (
        <textarea rows={3} maxLength={max} value={value} onChange={(e) => change(e.target.value)} />
      ) : (
        <input maxLength={max} value={value} onChange={(e) => change(e.target.value)} />
      )}
    </label>
  );
}
function Select({
  label,
  value,
  change,
  children,
}: {
  label: string;
  value: string;
  change: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <label className={styles.field}>
      {label}
      <select value={value} onChange={(e) => change(e.target.value)}>
        <option value="">Choose a saved source</option>
        {children}
      </select>
    </label>
  );
}
export default function ProjectProduction({
  projectId,
  initialKind = "direction",
  onDirtyChange,
}: {
  projectId: string;
  initialKind?: Kind;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const endpoint = `/api/projects/${projectId}/artifacts`;
  const [library, setLibrary] = useState<ProductionLibrary | null>(null);
  const [draft, setDraft] = useState<ProductionPayload>(() => initial(initialKind));
  const [baseline, setBaseline] = useState(() => JSON.stringify(draft));
  const [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [denied, setDenied] = useState(false),
    [conflict, setConflict] = useState(false);
  const pending = useRef<AbortController | null>(null),
    live = useRef(true);
  const retry = useRef<{ signature: string; input: SaveProductionArtifact } | null>(null);
  const dirty = JSON.stringify(draft) !== baseline;
  const latest = library?.versions.find((row) => row.kind === draft.kind)?.version ?? 0;
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    const leave = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (
        dirty &&
        anchor &&
        !window.confirm("Leave this editor and discard unsaved production edits?")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", leave, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", leave, true);
    };
  }, [dirty]);
  useEffect(() => {
    live.current = true;
    const controller = new AbortController();
    pending.current = controller;
    const timer = setTimeout(() => controller.abort(), 15000);
    fetch(endpoint, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!live.current || controller.signal.aborted) return;
        if (response.status === 401 || response.status === 403) {
          setDenied(true);
          setLibrary(null);
          throw new Error(
            "Sign in with creator or editor access to load this project's internal production drafts.",
          );
        }
        const parsed = ProductionLibraryResponseSchema.safeParse(await response.json());
        if (!parsed.success)
          throw new Error("The production library returned an unexpected response.");
        if (!parsed.data.ok) throw new Error(parsed.data.error.message);
        if (!live.current || controller.signal.aborted) return;
        setLibrary(parsed.data.data);
        const saved = parsed.data.data.versions.find((v) => v.kind === initialKind);
        if (saved) {
          setDraft(saved.artifact);
          setBaseline(JSON.stringify(saved.artifact));
        }
      })
      .catch((cause) => {
        if (live.current && pending.current === controller)
          setError(
            controller.signal.aborted
              ? "Loading production timed out. Retry when connected."
              : cause instanceof Error && !(cause instanceof TypeError)
                ? cause.message
                : "Could not load saved production. Retry when connected.",
          );
      })
      .finally(() => {
        clearTimeout(timer);
        if (live.current && pending.current === controller) setBusy(false);
      });
    return () => {
      live.current = false;
      clearTimeout(timer);
      pending.current?.abort();
    };
  }, [endpoint, initialKind]);
  function adopt(artifact: ProductionPayload) {
    setDraft(artifact);
    setBaseline(JSON.stringify(artifact));
    retry.current = null;
    setNotice("");
    setError("");
  }
  function replace(artifact: ProductionPayload) {
    if (!dirty || window.confirm("Replace your unsaved edits with this saved version?"))
      adopt(artifact);
  }
  function switchKind(kind: Kind) {
    if (kind === draft.kind) return;
    if (dirty && !window.confirm("Discard unsaved edits and open another artifact?")) return;
    adopt(library?.versions.find((row) => row.kind === kind)?.artifact ?? initial(kind));
  }
  async function request(input?: SaveProductionArtifact) {
    const controller = new AbortController();
    pending.current = controller;
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint, {
        cache: "no-store",
        signal: controller.signal,
        ...(input
          ? {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(input),
            }
          : {}),
      });
      if (!live.current || controller.signal.aborted) return null;
      if (response.status === 401 || response.status === 403) {
        setDenied(true);
        setLibrary(null);
        const empty = initial(draft.kind);
        setDraft(empty);
        setBaseline(JSON.stringify(empty));
        retry.current = null;
        throw new Error(
          "Project production access has changed. Reopen the project with an authorized creator account.",
        );
      }
      if (response.status === 409) {
        setConflict(true);
        throw new Error(
          "Another version was saved. Your edits are kept. Refresh history (keep edits) before saving a new version.",
        );
      }
      const json: unknown = await response.json();
      const parsed = input
        ? ProductionSaveResponseSchema.safeParse(json)
        : ProductionLibraryResponseSchema.safeParse(json);
      if (!parsed.success)
        throw new Error("Unexpected production response. Your local edits are kept.");
      if (!parsed.data.ok) throw new Error(parsed.data.error.message);
      return parsed.data.data;
    } finally {
      clearTimeout(timer);
    }
  }
  async function refresh() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const value = await request();
      if (value && "versions" in value) {
        setLibrary(value);
        setConflict(false);
        retry.current = null;
        setNotice(
          "Saved history refreshed. Your local edits are kept; the next save uses the latest version.",
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error && !(cause instanceof TypeError) && cause.name !== "AbortError"
          ? cause.message
          : "Could not refresh history. Your local edits are kept.",
      );
    } finally {
      if (live.current) setBusy(false);
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !library || denied || conflict) return;
    const signature = JSON.stringify({ artifact: draft, expectedVersion: latest });
    const candidate =
      retry.current?.signature === signature
        ? retry.current.input
        : { artifact: draft, expectedVersion: latest, idempotencyKey: crypto.randomUUID() };
    const parsed = SaveProductionArtifactSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(
        `Check source selections and fields: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" ")}`,
      );
      return;
    }
    retry.current = { signature, input: parsed.data };
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const saved = await request(parsed.data);
      if (saved && "artifact" in saved && live.current) {
        setLibrary((current) =>
          current
            ? {
                ...current,
                versions: [saved, ...current.versions.filter((v) => v.id !== saved.id)].sort(
                  (a, b) => b.version - a.version,
                ),
              }
            : current,
        );
        adopt(saved.artifact);
        setNotice(`${names[saved.kind]} version ${saved.version} saved.`);
      }
    } catch (cause) {
      setError(
        cause instanceof Error && !(cause instanceof TypeError) && cause.name !== "AbortError"
          ? cause.message
          : "Could not confirm the save. Your edits are kept; retry safely with the same request.",
      );
    } finally {
      if (live.current) setBusy(false);
    }
  }
  const update = (fields: Partial<ProductionPayload>) =>
    setDraft((current) => ({ ...current, ...fields }) as ProductionPayload);
  function copyIdea(id: string) {
    const idea = library?.ideas.find((i) => i.id === id);
    if (!idea) return;
    if (dirty && !window.confirm("Replace the current text with this saved idea?")) return;
    if (draft.kind === "direction")
      setDraft({ ...draft, title: idea.title, concept: idea.description.slice(0, 2000) });
    else if (draft.kind === "script")
      setDraft({
        ...draft,
        sections: [
          {
            id: crypto.randomUUID(),
            spokenText: idea.description.slice(0, 2000),
            onScreenText: idea.title.slice(0, 500),
            durationSeconds: 5,
          },
        ],
      });
    else if (draft.kind === "note")
      setDraft({ ...draft, text: `${idea.title}\n\n${idea.description}`.slice(0, 5000) });
    else
      setDraft({
        ...draft,
        shots: [
          { ...shot(), description: idea.description.slice(0, 1000), shootingNotes: idea.title },
        ],
      });
    setNotice(
      "Saved idea copied into editable fields. Review shortened text, choose source versions and save explicitly. No new AI request was made.",
    );
  }
  return (
    <section className={`${styles.card} ${own.root}`} aria-label="Creative production">
      <h2>{names[draft.kind]}</h2>
      <p className={styles.muted}>
        Versioned text production for creators and editors. Storyboard scene cards contain text
        only; they are not generated image frames.
      </p>
      <p className={styles.muted}>
        Direct artifact generation is unavailable in this editor. Generate and save ideas in
        Brainstorm, then copy them here or write your own text. Saving requires a real authorized
        account.
      </p>
      <p role="status">
        {busy
          ? "Loading or saving production…"
          : `Latest saved ${draft.kind} version: ${latest}${dirty ? " · Unsaved changes" : ""}`}
        {notice && ` ${notice}`}
      </p>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {!denied && (
        <button className={styles.secondary} disabled={busy} onClick={refresh}>
          Refresh history (keep edits)
        </button>
      )}
      {!denied && (
        <>
          <label className={styles.field}>
            Artifact type
            <select
              value={draft.kind}
              disabled={busy}
              onChange={(e) => switchKind(e.target.value as Kind)}
            >
              {Object.entries(names).map(([kind, name]) => (
                <option key={kind} value={kind}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          {!!library?.ideas.length && (
            <label className={styles.field}>
              Copy my saved brainstorm idea
              <select value="" disabled={busy} onChange={(e) => copyIdea(e.target.value)}>
                <option value="">Choose an idea to copy</option>
                {library.ideas.map((idea) => (
                  <option key={idea.id} value={idea.id}>
                    {idea.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <form onSubmit={save} aria-label={`Edit ${draft.kind}`}>
            <fieldset disabled={busy} className={own.fields}>
              {(draft.kind === "direction" || draft.kind === "script") && (
                <Select
                  label="Saved brief version"
                  value={draft.briefVersionId}
                  change={(id) => update({ briefVersionId: id })}
                >
                  {library?.briefs.map((b) => (
                    <option key={b.id} value={b.id}>
                      Brief v{b.version} · {b.brief.title ?? b.brief.product}
                    </option>
                  ))}
                </Select>
              )}
              {draft.kind === "direction" && (
                <>
                  <Text
                    label="Direction title"
                    value={draft.title}
                    max={120}
                    multiline={false}
                    change={(title) => update({ title })}
                  />
                  <Text
                    label="Hook"
                    value={draft.hook}
                    max={500}
                    change={(hook) => update({ hook })}
                  />
                  <Text
                    label="Concept"
                    value={draft.concept}
                    max={2000}
                    change={(concept) => update({ concept })}
                  />
                  <Text
                    label="Visual treatment"
                    value={draft.visualTreatment}
                    max={1000}
                    change={(visualTreatment) => update({ visualTreatment })}
                  />
                  <Text
                    label="Rationale"
                    value={draft.rationale}
                    max={1000}
                    change={(rationale) => update({ rationale })}
                  />
                  <Text
                    label="Direction constraints (one per line)"
                    value={draft.constraints.join("\n")}
                    max={6000}
                    change={(value) => update({ constraints: value.split("\n") })}
                  />
                </>
              )}
              {draft.kind === "script" && (
                <>
                  <Select
                    label="Saved direction version"
                    value={draft.directionVersionId}
                    change={(id) => {
                      const d = library?.versions.find((v) => v.id === id);
                      if (d?.artifact.kind === "direction")
                        update({
                          directionVersionId: id,
                          briefVersionId: d.artifact.briefVersionId,
                        });
                    }}
                  >
                    {library?.versions
                      .filter((v) => v.kind === "direction")
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          Direction v{v.version}
                        </option>
                      ))}
                  </Select>
                  {draft.sections.map((section, index) => (
                    <article className={own.scene} key={section.id}>
                      <h3>Script section {index + 1}</h3>
                      <Text
                        label={`Section ${index + 1} dialogue / voiceover`}
                        value={section.spokenText}
                        max={2000}
                        change={(spokenText) =>
                          update({
                            sections: draft.sections.map((s) =>
                              s.id === section.id ? { ...s, spokenText } : s,
                            ),
                          })
                        }
                      />
                      <Text
                        label={`Section ${index + 1} on-screen text`}
                        value={section.onScreenText}
                        max={500}
                        change={(onScreenText) =>
                          update({
                            sections: draft.sections.map((s) =>
                              s.id === section.id ? { ...s, onScreenText } : s,
                            ),
                          })
                        }
                      />
                      <label className={styles.field}>
                        Section {index + 1} duration (seconds)
                        <input
                          type="number"
                          min="0.1"
                          max="600"
                          step="0.1"
                          value={section.durationSeconds}
                          onChange={(e) =>
                            update({
                              sections: draft.sections.map((s) =>
                                s.id === section.id
                                  ? { ...s, durationSeconds: Number(e.target.value) }
                                  : s,
                              ),
                            })
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className={styles.secondary}
                        disabled={draft.sections.length === 1}
                        onClick={() =>
                          update({ sections: draft.sections.filter((s) => s.id !== section.id) })
                        }
                      >
                        Remove section {index + 1}
                      </button>
                    </article>
                  ))}
                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={draft.sections.length >= 50}
                    onClick={() =>
                      update({
                        sections: [
                          ...draft.sections,
                          {
                            id: crypto.randomUUID(),
                            spokenText: "",
                            onScreenText: "",
                            durationSeconds: 5,
                          },
                        ],
                      })
                    }
                  >
                    Add script section
                  </button>
                  <Text
                    label="Call to action"
                    value={draft.callToAction}
                    max={500}
                    change={(callToAction) => update({ callToAction })}
                  />
                </>
              )}
              {draft.kind === "storyboard" && (
                <>
                  <Select
                    label="Saved script version"
                    value={draft.scriptVersionId}
                    change={(scriptVersionId) => update({ scriptVersionId })}
                  >
                    {library?.versions
                      .filter((v) => v.kind === "script")
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          Script v{v.version}
                        </option>
                      ))}
                  </Select>
                  <div className={own.scenes}>
                    {draft.shots.map((s, index) => (
                      <article className={own.scene} key={s.id}>
                        <h3>Scene {index + 1} · Text plan</h3>
                        {(
                          [
                            ["description", "description", 1000],
                            ["framing", "camera framing", 300],
                            ["cameraMovement", "camera movement", 300],
                            ["lighting", "visual direction / lighting", 300],
                            ["narration", "dialogue / voiceover", 2000],
                            ["textOverlay", "on-screen text", 500],
                            ["shootingNotes", "notes", 1000],
                          ] as const
                        ).map(([key, label, max]) => (
                          <Text
                            key={key}
                            label={`Scene ${index + 1} ${label}`}
                            value={s[key]}
                            max={max}
                            change={(value) =>
                              update({
                                shots: draft.shots.map((current) =>
                                  current.id === s.id ? { ...current, [key]: value } : current,
                                ),
                              })
                            }
                          />
                        ))}
                        <label className={styles.field}>
                          Scene {index + 1} estimated duration (seconds)
                          <input
                            type="number"
                            min="0.1"
                            max="600"
                            step="0.1"
                            value={s.durationSeconds}
                            onChange={(e) =>
                              update({
                                shots: draft.shots.map((current) =>
                                  current.id === s.id
                                    ? { ...current, durationSeconds: Number(e.target.value) }
                                    : current,
                                ),
                              })
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className={styles.secondary}
                          disabled={draft.shots.length === 1}
                          onClick={() =>
                            update({ shots: draft.shots.filter((current) => current.id !== s.id) })
                          }
                        >
                          Remove scene {index + 1}
                        </button>
                      </article>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={draft.shots.length >= 50}
                    onClick={() => update({ shots: [...draft.shots, shot()] })}
                  >
                    Add scene
                  </button>
                </>
              )}
              {draft.kind === "note" && (
                <>
                  <Select
                    label="Linked artifact version (optional)"
                    value={draft.linkedArtifactVersionId ?? ""}
                    change={(value) => {
                      const {
                        linkedArtifactVersionId: _linked,
                        shotId: _shot,
                        timecodeSeconds: _time,
                        ...rest
                      } = draft;
                      void _linked;
                      void _shot;
                      void _time;
                      setDraft(value ? { ...rest, linkedArtifactVersionId: value } : rest);
                    }}
                  >
                    {library?.versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {names[v.kind]} v{v.version}
                      </option>
                    ))}
                  </Select>
                  <Text
                    label="Note text"
                    value={draft.text}
                    max={5000}
                    change={(text) => update({ text })}
                  />
                </>
              )}
            </fieldset>
            <button
              className={styles.button}
              type="submit"
              disabled={busy || !library || conflict || !dirty}
            >
              Save {draft.kind} as new version
            </button>
            {!library && (
              <p className={styles.muted}>
                Local draft only. Connect and load the project to choose saved source versions and
                save.
              </p>
            )}
          </form>
          <aside className={own.history} aria-label="Saved artifact versions">
            <h3>Saved versions</h3>
            <p>
              Opening an older version copies it into the editor. Saving always creates a new
              version.
            </p>
            {library?.versions
              .filter((v) => v.kind === draft.kind)
              .map((v) => (
                <button
                  type="button"
                  disabled={busy}
                  key={v.id}
                  className={styles.secondary}
                  onClick={() => replace(v.artifact)}
                >
                  {names[v.kind]} v{v.version} · {new Date(v.savedAt).toLocaleString()}
                </button>
              ))}
            {!library?.versions.some((v) => v.kind === draft.kind) && (
              <p>No saved {draft.kind} versions yet.</p>
            )}
          </aside>
        </>
      )}
    </section>
  );
}
