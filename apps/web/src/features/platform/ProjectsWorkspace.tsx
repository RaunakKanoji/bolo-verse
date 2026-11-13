"use client";
import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import {
  StudioProjectListSchema,
  StudioProjectSchema,
  StudioClientListSchema,
  type StudioProject,
} from "@/lib/contracts/workspace";
import { useWorkspaceSession } from "./WorkspaceSession";
import { useWorkspaceData } from "./use-workspace-data";
import {
  DataState,
  Modal,
  NoProjects,
  ProjectCard,
  ProjectDialog,
  projectTypes,
} from "./WorkspaceComponents";
import { PageHeader, EmptyState } from "./WorkspaceUI";
import { filterProjects } from "./workspace-view-model";
import styles from "./platform.module.css";
import own from "./workspace-screens.module.css";
const statuses = [
  ["all", "All Projects"],
  ["active", "Active"],
  ["in_review", "In Review"],
  ["completed", "Completed"],
  ["archived", "Archived"],
] as const;
export default function ProjectsWorkspace() {
  const { sessionKey } = useWorkspaceSession();
  return <ProjectsSession key={sessionKey} />;
}
function ProjectsSession() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [clientId, setClientId] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("updated");
  const [list, setList] = useState(false);
  const [create, setCreate] = useState(false);
  const [action, setAction] = useState<{
    kind: "rename" | "duplicate" | "archive";
    project: StudioProject;
    key: string;
  } | null>(null);
  const query = new URLSearchParams({
    limit: "100",
    sort,
    ...(search ? { search } : {}),
    ...(status !== "all" ? { status } : {}),
    ...(clientId ? { clientId } : {}),
    ...(type ? { type } : {}),
  });
  const source = useWorkspaceData(`projects?${query}`, StudioProjectListSchema);
  const clients = useWorkspaceData("clients?limit=100", StudioClientListSchema);
  const projects = filterProjects(source.data?.projects ?? [], {
    search,
    status,
    clientId,
    type,
    sort,
  });
  return (
    <div className={styles.page}>
      <PageHeader
        title="Your Projects"
        description="Manage everything you're creating in one place."
      >
        <button className={styles.button} onClick={() => setCreate(true)}>
          New Project
        </button>
        <Link className={styles.secondary} href="/projects/new">
          Submit client project
        </Link>
      </PageHeader>
      <DataState {...source} />
      <div className={styles.toolbar}>
        <label className={styles.field}>
          Search projects
          <input
            type="search"
            value={search}
            maxLength={160}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or description"
          />
        </label>
        <label className={styles.field}>
          Status
          <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Client
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">All clients</option>
            {clients.data?.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Content type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            {projectTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="updated">Recently updated</option>
            <option value="name">Name</option>
            <option value="due">Due date</option>
          </select>
        </label>
        <div className={styles.actions}>
          <button className={styles.secondary} aria-pressed={!list} onClick={() => setList(false)}>
            Grid
          </button>
          <button className={styles.secondary} aria-pressed={list} onClick={() => setList(true)}>
            List
          </button>
        </div>
      </div>
      <div className={`${styles.tabs} ${own.tabBar}`} aria-label="Project categories">
        {statuses.map(([value, label]) => (
          <button
            className={styles.secondary}
            aria-pressed={status === value}
            key={value}
            onClick={() => setStatus(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {projects.length ? (
        <>
          <p className={styles.muted}>
            {projects.length} shown{source.data ? ` of ${source.data.total}` : ""}
            {source.data && source.data.total > 100
              ? " · Refine your filters to find more projects."
              : ""}
          </p>
          <div className={list ? own.listGrid : own.projectGrid}>
            {projects.map((project) => (
              <ProjectCard
                project={project}
                key={project.id}
                onAction={(kind, p) => setAction({ kind, project: p, key: crypto.randomUUID() })}
              />
            ))}
          </div>
        </>
      ) : search || status !== "all" || clientId || type ? (
        <EmptyState
          title="No matching projects"
          description="Try another search or clear your filters."
        >
          <button
            className={styles.secondary}
            onClick={() => {
              setSearch("");
              setStatus("all");
              setClientId("");
              setType("");
            }}
          >
            Clear filters
          </button>
        </EmptyState>
      ) : (
        <NoProjects onCreate={() => setCreate(true)} />
      )}
      <p className={styles.muted}>
        Need to start with client requirements? Paste them into Creative brief notes when creating a
        project, then refine them in its <Link href="/projects">Brief tab</Link>.
      </p>
      {create && (
        <ProjectDialog
          onClose={() => setCreate(false)}
          onSaved={() => {
            setCreate(false);
            source.refresh();
          }}
        />
      )}
      {action && !source.denied && (
        <Modal
          title={
            action.kind === "rename"
              ? "Rename project"
              : action.kind === "duplicate"
                ? "Duplicate project"
                : action.project.status === "archived"
                  ? "Restore project"
                  : "Archive project"
          }
          onClose={() => setAction(null)}
        >
          <form
            className={own.dialogForm}
            onSubmit={async (e) => {
              e.preventDefault();
              const name = String(
                new FormData(e.currentTarget).get("name") ?? action.project.name,
              ).trim();
              if (!name) return;
              const result = await source.mutate(
                action.kind === "duplicate"
                  ? `projects/${action.project.id}/duplicate`
                  : `projects/${action.project.id}`,
                z.object({ project: StudioProjectSchema }),
                action.kind === "duplicate"
                  ? { idempotencyKey: action.key, name }
                  : {
                      expectedRevision: action.project.revision,
                      ...(action.kind === "rename"
                        ? { name }
                        : { status: action.project.status === "archived" ? "active" : "archived" }),
                    },
                action.kind === "duplicate" ? "POST" : "PATCH",
              );
              if (result) setAction(null);
            }}
          >
            {action.kind === "archive" ? (
              <p>
                Move “{action.project.name}”{" "}
                {action.project.status === "archived"
                  ? "back to active projects"
                  : "to the archive"}
                ? Assets, published versions and feedback are retained.
              </p>
            ) : (
              <label className={styles.field}>
                Project name
                <input
                  name="name"
                  required
                  maxLength={120}
                  defaultValue={
                    action.kind === "duplicate"
                      ? `${action.project.name.slice(0, 110)} copy`
                      : action.project.name
                  }
                />
              </label>
            )}
            {action.kind === "duplicate" && (
              <p className={styles.muted}>
                Copies project details. Existing assets, briefs, tasks and published versions remain
                with the original project.
              </p>
            )}
            {source.error && (
              <p role="alert" className={styles.error}>
                {source.error}
              </p>
            )}
            <button className={styles.button} disabled={source.busy}>
              {source.busy
                ? "Saving…"
                : action.kind === "rename"
                  ? "Save name"
                  : action.kind === "duplicate"
                    ? "Create duplicate"
                    : action.project.status === "archived"
                      ? "Restore project"
                      : "Confirm archive"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
