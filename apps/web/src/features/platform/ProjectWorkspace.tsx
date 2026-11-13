"use client";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import {
  CreateStudioTaskSchema,
  StudioProjectDetailSchema,
  StudioTaskSchema,
  type StudioTask,
} from "@/lib/contracts/workspace";
import ProjectIdeas from "./ProjectIdeas";
import ProjectProduction from "@/features/projects/ProjectProduction";
import ProjectBrief from "@/features/projects/ProjectBrief";
import ProjectImageLibrary from "@/features/projects/ProjectImageLibrary";
import ProjectDeliverables from "@/features/projects/ProjectDeliverables";
import { useWorkspaceSession } from "./WorkspaceSession";
import { useWorkspaceData } from "./use-workspace-data";
import { ActivityFeed, DataState, ProjectDialog, dateLabel } from "./WorkspaceComponents";
import { PageHeader, EmptyState, StatusBadge } from "./WorkspaceUI";
import styles from "./platform.module.css";
import own from "./workspace-screens.module.css";
const tabs = [
  "Overview",
  "Brief",
  "Brainstorm",
  "Production",
  "Storyboard",
  "Assets",
  "Tasks",
  "Deliverables",
  "Activity",
];
export default function ProjectWorkspace({
  projectId,
  initialTab,
}: {
  projectId: string;
  initialTab?: string;
}) {
  const { sessionKey } = useWorkspaceSession();
  return (
    <ProjectSession
      key={`${sessionKey}:${projectId}:${initialTab ?? ""}`}
      projectId={projectId}
      initialTab={initialTab}
    />
  );
}
function ProjectSession({ projectId, initialTab }: { projectId: string; initialTab?: string }) {
  const source = useWorkspaceData(`projects/${projectId}`, StudioProjectDetailSchema);
  const [tab, setTab] = useState(
    () =>
      tabs.find((candidate) => candidate.toLowerCase() === initialTab?.toLowerCase()) ?? "Overview",
  );
  const [productionDirty, setProductionDirty] = useState(false);
  function selectTab(next: string) {
    if (next === tab) return;
    if (productionDirty && !window.confirm("Discard unsaved production edits and switch sections?"))
      return;
    setProductionDirty(false);
    setTab(next);
  }
  const [edit, setEdit] = useState(false);
  const [error, setError] = useState("");
  const [taskKey, setTaskKey] = useState(() => crypto.randomUUID());
  const project = source.data?.project;
  const canEdit = source.data?.canEdit ?? false;
  const updateTask = (task: StudioTask, fields: Record<string, unknown>) =>
    source.mutate(
      `projects/${projectId}/tasks/${task.id}`,
      z.object({ task: StudioTaskSchema }),
      { expectedRevision: task.revision, ...fields },
      "PATCH",
    );
  return (
    <div className={styles.page}>
      <Link href="/projects" className={styles.muted}>
        Back to projects
      </Link>
      <PageHeader
        title={project?.name ?? "Project workspace"}
        description={
          project
            ? `${project.clientName || "No client linked"} · ${project.dueDate ? `Due ${dateLabel(project.dueDate)}` : "No deadline set"}`
            : "Bring your brief, ideas, assets and delivery into one place."
        }
      >
        {canEdit && (
          <button className={styles.secondary} onClick={() => setEdit(true)}>
            Edit Project
          </button>
        )}
        {project && (
          <>
            <Link className={styles.button} href={`/studio/create?projectId=${projectId}`}>
              Open Studio
            </Link>
            <button className={styles.secondary} onClick={() => selectTab("Deliverables")}>
              Share
            </button>
            <button className={styles.secondary} onClick={() => selectTab("Deliverables")}>
              Submit for Review
            </button>
          </>
        )}
      </PageHeader>
      <DataState {...source} />
      {project && (
        <div className={own.meta}>
          <StatusBadge status={project.status} />
          <span>{project.type}</span>
          <span>{project.priority} priority</span>
          <span>{canEdit ? "Project editor" : "Read-only project access"}</span>
        </div>
      )}
      <div className={`${styles.tabs} ${own.tabBar}`} aria-label="Project sections">
        {tabs
          .filter((t) => canEdit || (t !== "Production" && t !== "Storyboard"))
          .map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => selectTab(t)}>
              {t}
            </button>
          ))}
      </div>
      {!project ? (
        <EmptyState
          title={source.denied ? "Project access unavailable" : "Your project workspace"}
          description={
            source.denied
              ? "This project is unavailable or your access has changed. Return to projects to choose another."
              : "Connect and sign in to load this project's saved brief, assets, tasks and activity."
          }
        >
          <Link href="/projects" className={styles.secondary}>
            Browse projects
          </Link>
        </EmptyState>
      ) : (
        <>
          {tab === "Overview" && (
            <>
              <div className={styles.split}>
                <section className={styles.card}>
                  <h2>Project overview</h2>
                  <p className={own.detailText}>{project.objective}</p>
                  <div className={own.meta}>
                    <span>Started {dateLabel(project.startDate)}</span>
                    <span>Due {dateLabel(project.dueDate)}</span>
                  </div>
                  <h3>Progress</h3>
                  {project.progress === null ? (
                    <p>Add project tasks to track progress.</p>
                  ) : (
                    <>
                      <progress
                        className={own.progress}
                        max={100}
                        value={project.progress}
                        aria-label="Project progress"
                      />
                      <p>{project.progress}% of tasks complete</p>
                    </>
                  )}
                  <h3>Brief summary</h3>
                  <p>
                    Keep objectives, audience, requirements and references together in the versioned
                    creative brief.
                  </p>
                  <button className={styles.secondary} onClick={() => selectTab("Brief")}>
                    Open brief
                  </button>
                </section>
                <section className={styles.card}>
                  <h2>Production plan</h2>
                  <p>
                    {source.data?.tasks.filter((task) => task.status !== "done").length ?? 0} open
                    tasks
                  </p>
                  <button className={styles.secondary} onClick={() => selectTab("Tasks")}>
                    Manage tasks
                  </button>
                  <h3>Project access</h3>
                  <p>
                    Only authorized project members can access this workspace. Share published
                    deliverables with an exact reviewer identity in Deliverables.
                  </p>
                  <a className={styles.secondary} href={`/workspace/${projectId}`}>
                    Open 3D editor
                  </a>
                </section>
              </div>
              <section className={styles.card}>
                <h2>Recent activity</h2>
                <ActivityFeed activity={source.data?.activity ?? []} />
              </section>
            </>
          )}
          {tab === "Brief" && (
            <ProjectBrief
              key={`brief:${project.id}`}
              projectId={project.id}
              objective={project.objective}
            />
          )}
          {tab === "Brainstorm" && <ProjectIdeas projectId={projectId} />}
          {(tab === "Production" || tab === "Storyboard") &&
            (canEdit ? (
              <ProjectProduction
                key={tab}
                projectId={projectId}
                initialKind={tab === "Storyboard" ? "storyboard" : "direction"}
                onDirtyChange={setProductionDirty}
              />
            ) : (
              <p className={styles.muted}>
                Internal production drafts require creator or editor access.
              </p>
            ))}
          {tab === "Assets" && (
            <>
              <p className={styles.muted}>
                Upload verified private images below. Browse other ready project formats in the
                central library.
              </p>
              <Link className={styles.secondary} href={`/assets?projectId=${projectId}`}>
                Open project asset library
              </Link>
              <ProjectImageLibrary projectId={projectId} canEdit={canEdit} />
            </>
          )}
          {tab === "Tasks" && (
            <section className={styles.card}>
              <h2>Project tasks</h2>
              {canEdit && (
                <form
                  className={own.dialogForm}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const f = new FormData(form);
                    const parsed = CreateStudioTaskSchema.safeParse({
                      idempotencyKey: taskKey,
                      title: String(f.get("title")),
                      ownerLabel: String(f.get("ownerLabel")),
                      priority: String(f.get("priority")),
                      dueDate: String(f.get("dueDate")) || null,
                    });
                    if (!parsed.success) {
                      setError(parsed.error.issues.map((i) => i.message).join(" "));
                      return;
                    }
                    const result = await source.mutate(
                      `projects/${projectId}/tasks`,
                      z.object({ task: StudioTaskSchema }),
                      parsed.data,
                    );
                    if (result) {
                      form.reset();
                      setTaskKey(crypto.randomUUID());
                      setError("");
                    }
                  }}
                >
                  <div className={own.twoColumns}>
                    <label className={styles.field}>
                      Task title
                      <input name="title" required maxLength={240} />
                    </label>
                    <label className={styles.field}>
                      Owner label
                      <input
                        name="ownerLabel"
                        maxLength={160}
                        placeholder="Optional display label"
                      />
                    </label>
                    <label className={styles.field}>
                      Task due date
                      <input type="date" name="dueDate" />
                    </label>
                    <label className={styles.field}>
                      Task priority
                      <select name="priority" defaultValue="normal">
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                      </select>
                    </label>
                  </div>
                  <p className={styles.muted}>
                    Owner is a planning label; it does not assign access or send notifications.
                  </p>
                  {error && (
                    <p className={styles.error} role="alert">
                      {error}
                    </p>
                  )}
                  <button className={styles.button} disabled={source.busy}>
                    Add task
                  </button>
                </form>
              )}
              {source.data?.tasks.length ? (
                source.data.tasks.map((task) => (
                  <article className={own.task} key={task.id}>
                    <div className={own.taskTitle}>
                      <strong>{task.title}</strong>
                      <p className={own.meta}>
                        {task.ownerLabel || "Unassigned"} · {dateLabel(task.dueDate)} ·{" "}
                        {task.priority} priority
                      </p>
                    </div>
                    {canEdit ? (
                      <label className={styles.field}>
                        Status for {task.title}
                        <select
                          value={task.status}
                          disabled={source.busy}
                          onChange={(e) => {
                            void updateTask(task, { status: e.target.value });
                          }}
                        >
                          <option value="todo">To do</option>
                          <option value="in_progress">In progress</option>
                          <option value="done">Done</option>
                        </select>
                      </label>
                    ) : (
                      <StatusBadge status={task.status} />
                    )}
                  </article>
                ))
              ) : (
                <p className={styles.muted}>No tasks yet. Define the next production step above.</p>
              )}
            </section>
          )}
          {tab === "Deliverables" && (
            <>
              <section className={styles.card}>
                <h2>Deliverables & review</h2>
                <p>
                  Published images keep immutable version history and explicit reviewer grants. To
                  publish a ready image, select it in Assets. Share a published version with a
                  reviewer to submit it for review.
                </p>
                <button className={styles.button} onClick={() => selectTab("Assets")}>
                  Select an image to publish
                </button>
              </section>
              {canEdit ? (
                <ProjectDeliverables
                  projectId={projectId}
                  selectedAsset={null}
                  selectionBusy={false}
                  onAccessLost={source.revoke}
                />
              ) : (
                <p className={styles.muted}>
                  Your assigned published versions appear in{" "}
                  <Link href="/review">Review & Approvals</Link>.
                </p>
              )}
            </>
          )}
          {tab === "Activity" && (
            <section className={styles.card}>
              <h2>Project activity</h2>
              <ActivityFeed activity={source.data?.activity ?? []} />
            </section>
          )}
        </>
      )}
      {edit && project && (
        <ProjectDialog
          project={project}
          onClose={() => setEdit(false)}
          onSaved={() => {
            setEdit(false);
            source.refresh();
          }}
        />
      )}
    </div>
  );
}
