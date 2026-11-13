"use client";
import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ProjectSubmissionSchema,
  ProjectSubmissionResultSchema,
  type ProjectSubmission as Submission,
} from "@/lib/contracts/project-submissions";
import { CreationAccessError, creationRequest } from "@/features/creation/creation-http";
import { useWorkspaceSession } from "./WorkspaceSession";
import { PageHeader } from "./WorkspaceUI";
import {
  submissionFileAccept,
  submissionFileType,
  uploadSubmissionFile,
} from "./project-submission-upload";
import styles from "./platform.module.css";

type Attachment = { file: File; key: string; phase: string; error: string; done: boolean };
export default function ProjectSubmission() {
  const { sessionKey } = useWorkspaceSession();
  return <SubmissionForm key={sessionKey} />;
}
function SubmissionForm() {
  const { isLoaded, sessionKey, configured } = useWorkspaceSession();
  const [files, setFiles] = useState<Attachment[]>([]);
  const [attempt, setAttempt] = useState<Submission | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const pending = useRef<AbortController | null>(null);
  const active = useRef(false);
  useLayoutEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      pending.current?.abort();
    };
  }, []);
  const clearAccess = () => {
    form.current?.reset();
    setFiles([]);
    setAttempt(null);
    setSaved(null);
    setError("");
    setDenied(true);
  };
  const updateFile = (key: string, change: Partial<Attachment>) => {
    if (active.current && !pending.current?.signal.aborted)
      setFiles((current) =>
        current.map((file) => (file.key === key ? { ...file, ...change } : file)),
      );
  };
  async function upload(projectId: string, choices: Attachment[], signal: AbortSignal) {
    for (const choice of choices.filter((file) => !file.done)) {
      signal.throwIfAborted();
      try {
        await uploadSubmissionFile(projectId, choice.file, choice.key, signal, (phase) =>
          updateFile(choice.key, { phase, error: "" }),
        );
        signal.throwIfAborted();
        updateFile(choice.key, { phase: "Completed", done: true, error: "" });
      } catch (reason) {
        if (reason instanceof CreationAccessError) throw reason;
        if (!signal.aborted)
          updateFile(choice.key, {
            phase: "Needs retry",
            error: reason instanceof Error ? reason.message : "Upload failed.",
          });
      }
    }
  }
  async function run(event?: FormEvent) {
    event?.preventDefault();
    if (pending.current || denied) return;
    setError("");
    let input = attempt;
    if (!saved && !input) {
      const fields = Object.fromEntries(new FormData(form.current!).entries());
      const parsed = ProjectSubmissionSchema.safeParse({
        ...fields,
        idempotencyKey: crypto.randomUUID(),
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Complete the required fields.");
        return;
      }
      input = parsed.data;
      setAttempt(input);
    }
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    try {
      let projectId = saved;
      if (!projectId && input) {
        const result = await creationRequest(
          "/api/projects/submissions",
          ProjectSubmissionResultSchema,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          },
          controller.signal,
        );
        if (
          result.projectId !== input.idempotencyKey ||
          result.href !== `/projects/${result.projectId}`
        )
          throw new Error("The submission response did not match this project.");
        controller.signal.throwIfAborted();
        projectId = result.projectId;
        if (active.current) setSaved(projectId);
      }
      if (projectId) await upload(projectId, files, controller.signal);
    } catch (reason) {
      if (active.current && !controller.signal.aborted) {
        if (reason instanceof CreationAccessError) clearAccess();
        else
          setError(
            reason instanceof Error
              ? reason.message
              : "Submission failed. Retry the same submission.",
          );
      }
    } finally {
      if (active.current && pending.current === controller) {
        pending.current = null;
        setBusy(false);
      }
    }
  }
  if (denied)
    return (
      <div className={styles.page}>
        <p role="alert">
          Your session or project access changed. Reopen this page after signing in. Private form
          data was cleared.
        </p>
        <Link href="/projects">Back to projects</Link>
      </div>
    );
  return (
    <div className={styles.page}>
      <PageHeader
        title="Submit a client project"
        description="Share your requirements and reference files with the designated demo creator."
      />
      {!configured && (
        <p className={styles.notice}>
          Clerk, database and a designated creator must be configured to save. Files also require
          private object storage.
        </p>
      )}
      <form ref={form} className={styles.form} onSubmit={run}>
        <fieldset disabled={busy || !!attempt || !!saved} className={styles.card}>
          <legend>Project requirements</legend>
          {[
            ["name", "Project name", 120],
            ["brand", "Brand or organization", 300],
            ["audience", "Target audience", 1000],
            ["objectives", "Objectives", 1000],
            ["deliverables", "Deliverables", 1000],
            ["channel", "Distribution channel", 120],
          ].map(([name, label, max]) => (
            <label className={styles.field} key={name}>
              {label}
              <input name={String(name)} required maxLength={Number(max)} />
            </label>
          ))}
          <label className={styles.field}>
            Project description
            <textarea name="description" required maxLength={2000} rows={3} />
          </label>
          <label className={styles.field}>
            Content type
            <select name="contentType" defaultValue="poster">
              <option value="poster">Poster / social visual</option>
              <option value="reel">Reel / video</option>
              <option value="script">Script</option>
            </select>
          </label>
          <label className={styles.field}>
            Deadline
            <input name="deadline" type="date" required />
          </label>
          <label className={styles.field}>
            Special instructions
            <textarea name="instructions" maxLength={1500} rows={3} />
          </label>
        </fieldset>
        <section className={styles.card}>
          <h2>Brief and reference files</h2>
          <p>
            Up to 10 files, 20 MiB each: PDF, PNG, JPEG, WebP, MP4, WebM, self-contained GLB/glTF or
            PCM WAV. Original filenames are shown here; the library stores type and identifier.
          </p>
          <label className={styles.field}>
            Choose brief and reference files
            <input
              type="file"
              accept={submissionFileAccept}
              multiple
              disabled={busy || !!attempt || !!saved}
              onChange={(event) => {
                try {
                  const selected = Array.from(event.target.files ?? []);
                  if (selected.length > 10) throw new Error("Choose at most 10 files.");
                  selected.forEach(submissionFileType);
                  setFiles(
                    selected.map((file) => ({
                      file,
                      key: crypto.randomUUID(),
                      phase: "Waiting for project",
                      error: "",
                      done: false,
                    })),
                  );
                  setError("");
                } catch (reason) {
                  event.target.value = "";
                  setFiles([]);
                  setError(reason instanceof Error ? reason.message : "Invalid file selection.");
                }
              }}
            />
          </label>
          <p role="status">
            {files.filter((file) => file.done).length} of {files.length} files completed
            {busy ? " · Working…" : ""}
          </p>
          {files.map((choice) => (
            <div key={choice.key}>
              <p>
                {choice.file.name} · {choice.phase}
              </p>
              {choice.error && (
                <p className={styles.error} role="alert">
                  {choice.error}
                </p>
              )}
            </div>
          ))}
        </section>
        {attempt && !saved && (
          <p>
            Requirements are held for a safe retry of this submission. Start a new submission to
            change them.
          </p>
        )}
        {saved && (
          <p role="status">
            Project saved. <Link href={`/projects/${saved}`}>Open submitted project</Link>
            {files.some((file) => !file.done)
              ? ". Some files still need uploading; retry them below."
              : ". All selected files are complete."}
          </p>
        )}
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button
            className={styles.button}
            disabled={
              busy ||
              !isLoaded ||
              sessionKey === "signed-out" ||
              (!!saved && files.every((file) => file.done))
            }
          >
            {busy
              ? "Submitting…"
              : saved
                ? "Retry incomplete uploads"
                : attempt
                  ? "Retry same submission"
                  : "Submit project"}
          </button>
          <Link href="/projects" className={styles.secondary}>
            Back to projects
          </Link>
        </div>
      </form>
    </div>
  );
}
