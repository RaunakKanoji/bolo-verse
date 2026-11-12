"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { apiResultSchema } from "@/lib/contracts/api";
import { CreateProjectSchema } from "@/lib/contracts/projects";
import styles from "./projects.module.css";

const responseSchema = apiResultSchema(z.object({ project: z.object({ id: z.uuid() }) }));

export default function ProjectForm({
  project,
}: {
  project?: { id: string; name: string; objective: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const parsed = CreateProjectSchema.safeParse({
      name: fields.get("name"),
      objective: fields.get("objective"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the project fields.");
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(false);
    const controller = new AbortController();
    pending.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(project ? `/api/projects/${project.id}` : "/api/projects", {
        method: project ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: controller.signal,
      });
      const result = responseSchema.safeParse(await response.json());
      if (controller.signal.aborted) return;
      if (!result.success)
        throw new Error(
          "The server returned an unexpected response. Reload your projects before retrying.",
        );
      if (!result.data.ok) throw new Error(result.data.error.message);
      if (!response.ok)
        throw new Error("The project could not be saved. Reload your projects before retrying.");
      setSaved(true);
      if (!project) router.push(`/app/projects/${result.data.data.project.id}`);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof DOMException && cause.name === "AbortError"
          ? "The request timed out. Check your project list before retrying; the server may have saved it."
          : cause instanceof Error
            ? cause.message
            : "Could not reach the workspace. Try again when connected.",
      );
    } finally {
      clearTimeout(timeout);
      if (pending.current === controller) pending.current = null;
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className={styles.form}
      aria-label={project ? "Edit project" : "Create project"}
    >
      <div className={styles.field}>
        <label htmlFor="project-name">Project name</label>
        <input
          id="project-name"
          name="name"
          required
          maxLength={120}
          defaultValue={project?.name ?? ""}
          placeholder="A new campaign"
          disabled={busy}
          onChange={() => setSaved(false)}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="project-objective">Creative objective</label>
        <textarea
          id="project-objective"
          name="objective"
          required
          maxLength={2000}
          rows={4}
          defaultValue={project?.objective ?? ""}
          placeholder="What should this project help your audience understand or do?"
          disabled={busy}
          onChange={() => setSaved(false)}
        />
        <p>
          Keep the goal clear. Detailed briefs, assets and scene editing follow in later phases.
        </p>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.formActions}>
        <Button disabled={busy} type="submit">
          {busy ? "Saving project…" : project ? "Save project details" : "Create project"}
        </Button>
        <span role="status">{saved ? "Project saved." : ""}</span>
      </div>
    </form>
  );
}
