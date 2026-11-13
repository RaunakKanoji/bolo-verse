"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Folder, CalendarDays } from "lucide-react";
import { z } from "zod";
import type {
  StudioActivity,
  StudioClient,
  StudioProject,
  StudioTask,
} from "@/lib/contracts/workspace";
import {
  CreateStudioProjectSchema,
  StudioClientListSchema,
  StudioProjectSchema,
  UpdateStudioProjectSchema,
} from "@/lib/contracts/workspace";
import { EmptyState, StatusBadge, ServiceNotice } from "./WorkspaceUI";
import { useWorkspaceData } from "./use-workspace-data";
import styles from "./platform.module.css";
import own from "./workspace-screens.module.css";
export const projectTypes = [
  "Social Media Campaign",
  "Video Production",
  "Brand Identity",
  "Product Marketing",
  "Photography",
  "XR Experience",
  "Custom",
];
export const dateLabel = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(value))
    : "No date set";
export function DataState({
  error,
  loading,
  configured,
  refresh,
}: {
  error: string;
  loading: boolean;
  configured: boolean;
  refresh: () => void;
}) {
  return (
    <>
      {!configured && (
        <ServiceNotice message="Your workspace is ready for ideas. Sign in to a connected workspace to load and save your work." />
      )}
      {loading && (
        <p role="status" className={own.loading}>
          Loading your workspace…
        </p>
      )}
      {error && (
        <div role="alert" className={styles.error}>
          {error}{" "}
          <button type="button" className={styles.secondary} onClick={refresh}>
            Retry
          </button>
        </div>
      )}
    </>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} className={styles.dialog} aria-label={title} onCancel={onClose}>
      <div className={own.dialogHeader}>
        <h2>{title}</h2>
        <button
          type="button"
          className={styles.secondary}
          aria-label={`Close ${title}`}
          onClick={onClose}
        >
          Close
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ActivityFeed({ activity }: { activity: StudioActivity[] }) {
  return activity.length ? (
    <ol className={own.timeline}>
      {activity.map((event) => (
        <li key={event.id}>
          <strong>{event.title}</strong>
          <span className={own.meta}>
            <Link href={`/projects/${event.projectId}`}>{event.projectName}</Link>
            <time dateTime={event.createdAt}>{dateLabel(event.createdAt)}</time>
          </span>
        </li>
      ))}
    </ol>
  ) : (
    <p className={styles.muted}>
      Project updates, uploads and review decisions will appear here as work happens.
    </p>
  );
}
export function ProjectCard({
  project,
  onAction,
}: {
  project: StudioProject;
  onAction?: (action: "rename" | "duplicate" | "archive", project: StudioProject) => void;
}) {
  return (
    <article className={styles.card}>
      <div className={own.cover}>
        <Folder aria-hidden="true" />
      </div>
      <div className={own.cardBody}>
        <div className={own.summary}>
          <StatusBadge status={project.status} />
          <span className={styles.muted}>{project.type}</span>
        </div>
        <h3>
          <Link href={`/projects/${project.id}`}>{project.name}</Link>
        </h3>
        <p className={styles.muted}>
          {project.objective.slice(0, 160)}
          {project.objective.length > 160 ? "…" : ""}
        </p>
        <div className={own.meta}>
          <span>{project.clientName || "No client linked"}</span>
          <span>
            <CalendarDays size={14} aria-hidden="true" />{" "}
            {project.dueDate ? `Due ${dateLabel(project.dueDate)}` : "No deadline"}
          </span>
        </div>
        {project.progress !== null ? (
          <>
            <progress
              className={own.progress}
              max={100}
              value={project.progress}
              aria-label={`${project.name} task progress`}
            />
            <span className={styles.muted}>{project.progress}% of tasks complete</span>
          </>
        ) : (
          <span className={styles.muted}>No tasks yet</span>
        )}
        <span className={styles.muted}>Updated {dateLabel(project.updatedAt)}</span>
        <div className={own.cardActions}>
          <Link className={styles.secondary} href={`/projects/${project.id}`}>
            Open project
          </Link>
          {project.canEdit && onAction && (
            <>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => onAction("rename", project)}
              >
                Rename
              </button>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => onAction("duplicate", project)}
              >
                Duplicate
              </button>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => onAction("archive", project)}
              >
                {project.status === "archived" ? "Restore" : "Archive"}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
export function ProjectCards({
  projects,
  list = false,
}: {
  projects: StudioProject[];
  list?: boolean;
}) {
  return (
    <div className={list ? own.listGrid : own.projectGrid}>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
export function TaskList({
  tasks,
  onToggle,
  busy = false,
}: {
  tasks: StudioTask[];
  onToggle?: (task: StudioTask) => void;
  busy?: boolean;
}) {
  return tasks.length ? (
    <div>
      {tasks.map((task) => (
        <div className={own.task} key={task.id}>
          <label>
            {onToggle && (
              <input
                type="checkbox"
                checked={task.status === "done"}
                disabled={busy}
                onChange={() => onToggle(task)}
                aria-label={`Complete ${task.title}`}
              />
            )}
            <span>
              <strong>{task.title}</strong>
              <span className={own.meta}>
                <Link href={`/projects/${task.projectId}`}>{task.projectName}</Link>
                <span>{task.ownerLabel || "Unassigned"}</span>
              </span>
            </span>
          </label>
          <StatusBadge status={task.status} />
          <span className={own.meta}>
            {task.priority} priority · {dateLabel(task.dueDate)}
          </span>
        </div>
      ))}
    </div>
  ) : (
    <p className={styles.muted}>No tasks yet. Add a task inside a project to plan the next step.</p>
  );
}
export function ProjectDialog({
  project,
  onClose,
  onSaved,
}: {
  project?: StudioProject;
  onClose: () => void;
  onSaved: (project: StudioProject) => void;
}) {
  const source = useWorkspaceData("clients?limit=100", StudioClientListSchema);
  const [error, setError] = useState("");
  const [key] = useState(() => crypto.randomUUID());
  return (
    <Modal title={project ? "Edit project" : "New project"} onClose={onClose}>
      <form
        className={own.dialogForm}
        onSubmit={async (event) => {
          event.preventDefault();
          const f = new FormData(event.currentTarget);
          const notes = String(f.get("brief") || "").trim();
          const fields = {
            name: String(f.get("name")),
            objective: `${String(f.get("objective"))}${notes ? `\n\nCreative brief notes:\n${notes}` : ""}`,
            clientId: String(f.get("clientId")) || null,
            type: String(f.get("type")),
            priority: String(f.get("priority")),
            startDate: String(f.get("startDate")) || null,
            dueDate: String(f.get("dueDate")) || null,
            ...(project ? { status: String(f.get("status")) } : {}),
          };
          const parsed = project
            ? UpdateStudioProjectSchema.safeParse({
                ...fields,
                clientId: fields.clientId === project.clientId ? undefined : fields.clientId,
                expectedRevision: project.revision,
              })
            : CreateStudioProjectSchema.safeParse({ ...fields, idempotencyKey: key });
          if (!parsed.success) {
            setError(parsed.error.issues.map((issue) => issue.message).join(" "));
            return;
          }
          setError("");
          const result = await source.mutate(
            project ? `projects/${project.id}` : "projects",
            z.object({ project: StudioProjectSchema }),
            parsed.data,
            project ? "PATCH" : "POST",
          );
          if (result) onSaved(result.project);
        }}
      >
        <p className={styles.muted}>
          Unsaved draft · stays in this page until saved.{" "}
          {project
            ? "Update project details here; versioned creative briefs stay in the Brief tab."
            : "Creative brief notes are saved with the project description; use the Brief tab for a versioned brief."}
        </p>
        <label className={styles.field}>
          Project name
          <input name="name" maxLength={120} defaultValue={project?.name} required autoFocus />
        </label>
        <label className={styles.field}>
          Description
          <textarea
            aria-label="Description"
            name="objective"
            required
            maxLength={2000}
            rows={3}
            defaultValue={project?.objective}
          />
        </label>
        <div className={own.twoColumns}>
          <label className={styles.field}>
            Client
            <select aria-label="Client" name="clientId" defaultValue={project?.clientId ?? ""}>
              <option value="">No client linked</option>
              {project?.clientId &&
                !source.data?.clients.some((client) => client.id === project.clientId) && (
                  <option value={project.clientId}>
                    {project.clientName || "Current project client"}
                  </option>
                )}
              {source.data?.clients.map((c: StudioClient) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            Project type
            <select aria-label="Project type" name="type" defaultValue={project?.type ?? "Custom"}>
              {[...new Set([...projectTypes, ...(project ? [project.type] : [])])].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            Start date
            <input type="date" name="startDate" defaultValue={project?.startDate ?? ""} />
          </label>
          <label className={styles.field}>
            Due date
            <input type="date" name="dueDate" defaultValue={project?.dueDate ?? ""} />
          </label>
        </div>
        {project && (
          <label className={styles.field}>
            Project status
            <select aria-label="Project status" name="status" defaultValue={project.status}>
              <option value="active">Active</option>
              <option value="in_review">In review</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        )}
        <label className={styles.field}>
          Priority
          <select
            aria-label="Priority"
            name="priority"
            defaultValue={project?.priority ?? "normal"}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </label>
        {!project && (
          <label className={styles.field}>
            Creative brief notes
            <textarea aria-label="Creative brief notes" name="brief" maxLength={2000} rows={3} />
          </label>
        )}
        {(error || source.error) && (
          <p className={styles.error} role="alert">
            {error || source.error}
          </p>
        )}
        {!source.configured && (
          <ServiceNotice message="You can draft project details here. Connect and sign in to save them." />
        )}
        <div className={styles.actions}>
          <button type="submit" className={styles.button} disabled={source.busy}>
            {source.busy ? "Saving…" : project ? "Save project" : "Create project"}
          </button>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function NoProjects({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      title="No projects yet"
      description="Create a project to bring your ideas, assets, and client feedback together."
    >
      <button className={styles.button} onClick={onCreate}>
        Create project
      </button>
    </EmptyState>
  );
}
