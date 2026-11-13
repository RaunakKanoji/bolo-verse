"use client";
import Link from "next/link";
import { useState } from "react";
import { StudioClientDetailSchema } from "@/lib/contracts/workspace";
import { useWorkspaceSession } from "./WorkspaceSession";
import { useWorkspaceData } from "./use-workspace-data";
import { ActivityFeed, DataState, ProjectCards, dateLabel } from "./WorkspaceComponents";
import { ClientDialog } from "./ClientsWorkspace";
import { PageHeader, EmptyState } from "./WorkspaceUI";
import styles from "./platform.module.css";
import own from "./workspace-screens.module.css";
export default function ClientWorkspace({ clientId }: { clientId: string }) {
  const { sessionKey } = useWorkspaceSession();
  return <ClientSession key={`${sessionKey}:${clientId}`} clientId={clientId} />;
}
function ClientSession({ clientId }: { clientId: string }) {
  const source = useWorkspaceData(`clients/${clientId}`, StudioClientDetailSchema);
  const client = source.data?.client;
  const [tab, setTab] = useState("Overview");
  const [edit, setEdit] = useState(false);
  return (
    <div className={styles.page}>
      <Link className={styles.muted} href="/clients">
        Back to clients
      </Link>
      <PageHeader
        title={client?.name ?? "Client workspace"}
        description={
          client?.organization || "Keep requirements, production and feedback in context."
        }
      >
        {client && (
          <button className={styles.button} onClick={() => setEdit(true)}>
            Edit client
          </button>
        )}
      </PageHeader>
      <DataState {...source} />
      <div className={`${styles.tabs} ${own.tabBar}`} aria-label="Client sections">
        {["Overview", "Projects", "Briefs", "Deliverables", "Activity"].map((t) => (
          <button key={t} aria-pressed={t === tab} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      {!client ? (
        <EmptyState
          title={source.denied ? "Client access unavailable" : "A connected client workspace"}
          description="Connect and sign in to load this client’s saved details and related projects."
        />
      ) : (
        <>
          {tab === "Overview" && (
            <div className={styles.split}>
              <section className={styles.card}>
                <h2>Contact information</h2>
                <dl>
                  <dt>Organization</dt>
                  <dd>{client.organization || "Not provided"}</dd>
                  <dt>Email</dt>
                  <dd>{client.email || "Not provided"}</dd>
                  <dt>Phone</dt>
                  <dd>{client.phone || "Not provided"}</dd>
                </dl>
                <h3>Notes</h3>
                <p className={own.detailText}>{client.notes || "No client notes yet."}</p>
                <p className={styles.muted}>
                  Contact details do not grant review or project access. Share individual versions
                  from each project’s Deliverables tab.
                </p>
              </section>
              <section className={styles.card}>
                <h2>Client activity</h2>
                <p>{client.activeProjects} active projects</p>
                <p>{client.pendingReviews} pending reviews</p>
                <p>Last activity: {dateLabel(client.lastActivityAt)}</p>
                <button className={styles.secondary} onClick={() => setTab("Projects")}>
                  View projects
                </button>
              </section>
            </div>
          )}
          {tab === "Projects" &&
            (source.data?.projects.length ? (
              <ProjectCards projects={source.data.projects} />
            ) : (
              <EmptyState
                title="No linked projects"
                description="Choose this client when creating or editing a project."
              >
                <Link href="/projects" className={styles.button}>
                  Open projects
                </Link>
              </EmptyState>
            ))}
          {(tab === "Briefs" || tab === "Deliverables") && (
            <section className={styles.card}>
              <h2>{tab === "Briefs" ? "Project briefs" : "Project deliverables"}</h2>
              <p>
                {tab === "Briefs"
                  ? "Open a linked project's Brief tab to view its versioned requirements."
                  : "Open a linked project's Deliverables tab to view its immutable publication and review history."}
              </p>
              {source.data?.projects.length ? (
                <div className={styles.list}>
                  {source.data.projects.map((p) => (
                    <Link className={styles.secondary} key={p.id} href={`/projects/${p.id}`}>
                      {p.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className={styles.muted}>Link a project to this client to start.</p>
              )}
            </section>
          )}
          {tab === "Activity" && (
            <section className={styles.card}>
              <h2>Client project activity</h2>
              <ActivityFeed activity={source.data?.activity ?? []} />
            </section>
          )}
        </>
      )}
      {client && edit && (
        <ClientDialog
          client={client}
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
