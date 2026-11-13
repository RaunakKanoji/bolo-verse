"use client";
import Link from "next/link";
import { useState } from "react";
import { Folder, MessageSquare, CheckCircle2, CalendarDays } from "lucide-react";
import { StudioOverviewSchema, StudioTaskSchema } from "@/lib/contracts/workspace";
import { z } from "zod";
import { useWorkspaceSession } from "./WorkspaceSession";
import { useWorkspaceData } from "./use-workspace-data";
import {
  ActivityFeed,
  DataState,
  ProjectCards,
  ProjectDialog,
  TaskList,
} from "./WorkspaceComponents";
import { PageHeader, EmptyState } from "./WorkspaceUI";
import styles from "./platform.module.css";
import own from "./workspace-screens.module.css";
export default function Dashboard() {
  const { sessionKey } = useWorkspaceSession();
  return <DashboardSession key={sessionKey} />;
}
function DashboardSession() {
  const session = useWorkspaceSession();
  const source = useWorkspaceData("overview", StudioOverviewSchema);
  const [create, setCreate] = useState(false);
  const [list, setList] = useState(false);
  const metrics = [
    {
      key: "activeProjects",
      label: "Active Projects",
      detail: "Projects moving through production",
      icon: Folder,
    },
    {
      key: "pendingReviews",
      label: "Pending Reviews",
      detail: "Published versions awaiting a decision",
      icon: MessageSquare,
    },
    {
      key: "completedDeliverables",
      label: "Completed Deliverables",
      detail: "Approved published versions",
      icon: CheckCircle2,
    },
    {
      key: "upcomingDeadlines",
      label: "Upcoming Deadlines",
      detail: "Project deadlines in the next seven days",
      icon: CalendarDays,
    },
  ] as const;
  return (
    <div className={styles.page}>
      <PageHeader
        title={`Good morning${session.firstName ? `, ${session.firstName}` : ""}`}
        description="Here's what's happening in your creative workspace."
      >
        <button className={styles.button} onClick={() => setCreate(true)}>
          New Project
        </button>
        <Link className={styles.secondary} href="/brainstorm">
          Start Brainstorm
        </Link>
        <Link className={styles.secondary} href="/spatial-studio">
          Open Spatial Studio
        </Link>
      </PageHeader>
      <Link className={styles.button} href="/demo">
        Explore the populated demo workspace
      </Link>
      <DataState {...source} />
      <section className={styles.metrics} aria-label="Workspace overview">
        {metrics.map(({ key, label, detail, icon: Icon }) => (
          <article className={styles.metric} key={key}>
            <Icon aria-hidden="true" className={own.metricsIcon} />
            <span>{label}</span>
            <strong>{source.data ? source.data.metrics[key] : "—"}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </section>
      <section>
        <div className={styles.sectionHeader}>
          <h2>Recent projects</h2>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              aria-pressed={!list}
              onClick={() => setList(false)}
            >
              Grid
            </button>
            <button
              type="button"
              className={styles.secondary}
              aria-pressed={list}
              onClick={() => setList(true)}
            >
              List
            </button>
            <Link href="/projects">View all</Link>
          </div>
        </div>
        {source.data?.projects.length ? (
          <ProjectCards projects={source.data.projects.slice(0, 6)} list={list} />
        ) : (
          <EmptyState
            title="Your creative workspace starts here."
            description="Create your first project to organize ideas, assets, and deliverables."
          >
            <button className={styles.button} onClick={() => setCreate(true)}>
              Create your first project
            </button>
          </EmptyState>
        )}
      </section>
      <section className={styles.card}>
        <h2>Quick actions</h2>
        <div className={styles.actions}>
          <button className={styles.secondary} onClick={() => setCreate(true)}>
            Create New Project
          </button>
          <Link className={styles.secondary} href="/assets?upload=true">
            Upload Assets
          </Link>
          <Link className={styles.secondary} href="/brainstorm">
            Generate Ideas
          </Link>
          <Link className={styles.secondary} href="/recording-lab">
            Record Content
          </Link>
          <Link className={styles.secondary} href="/spatial-studio">
            Enter Spatial Studio
          </Link>
        </div>
      </section>
      <div className={styles.split}>
        <section className={styles.card}>
          <h2>Recent activity</h2>
          <ActivityFeed activity={source.data?.activity ?? []} />
        </section>
        <section className={styles.card}>
          <h2>Upcoming tasks</h2>
          <TaskList
            tasks={source.data?.tasks ?? []}
            busy={source.busy}
            onToggle={(task) => {
              void source.mutate(
                `projects/${task.projectId}/tasks/${task.id}`,
                z.object({ task: StudioTaskSchema }),
                {
                  expectedRevision: task.revision,
                  status: task.status === "done" ? "todo" : "done",
                },
                "PATCH",
              );
            }}
          />
        </section>
      </div>
      {create && (
        <ProjectDialog
          onClose={() => setCreate(false)}
          onSaved={() => {
            setCreate(false);
            source.refresh();
          }}
        />
      )}
    </div>
  );
}
