"use client";
import Link from "next/link";
import { useState } from "react";
import {
  BrainstormSessionListSchema,
  BrainstormSessionDetailSchema,
} from "@/lib/contracts/brainstorm-studio";
import { useWorkspaceData } from "./use-workspace-data";
import { DataState, dateLabel } from "./WorkspaceComponents";
import { EmptyState } from "./WorkspaceUI";
import styles from "./platform.module.css";
export default function ProjectIdeas({ projectId }: { projectId: string }) {
  const source = useWorkspaceData("/api/v1/brainstorm/sessions", BrainstormSessionListSchema);
  const [selected, setSelected] = useState<string | null>(null);
  const sessions = source.data?.sessions.filter((session) => session.projectId === projectId) ?? [];
  return (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>
        <h2>Ideas for this project</h2>
        <Link className={styles.button} href={`/brainstorm?projectId=${projectId}`}>
          New project session
        </Link>
      </div>
      <p>
        Sessions and saved ideas here are private to your signed-in creator account. Link an
        existing session from Brainstorm Studio.
      </p>
      <DataState {...source} />
      {sessions.length ? (
        <div className={styles.split}>
          <div className={styles.list}>
            {sessions.map((session) => (
              <div key={session.id}>
                <button
                  className={styles.secondary}
                  aria-pressed={selected === session.id}
                  onClick={() => setSelected(session.id)}
                >
                  {session.title}
                </button>
                <p className={styles.muted}>
                  Updated {dateLabel(session.updatedAt)}
                  {session.pinned ? " · Pinned" : ""}
                </p>
              </div>
            ))}
          </div>
          {selected && sessions.some((session) => session.id === selected) ? (
            <SessionIdeas key={selected} sessionId={selected} projectId={projectId} />
          ) : (
            <p className={styles.muted}>Choose a session to view its saved ideas.</p>
          )}
        </div>
      ) : (
        <EmptyState
          title="No linked sessions yet"
          description="Start a project session to explore your brief and save creative directions."
        />
      )}
    </section>
  );
}
function SessionIdeas({ sessionId, projectId }: { sessionId: string; projectId: string }) {
  const source = useWorkspaceData(
    `/api/v1/brainstorm/sessions/${sessionId}`,
    BrainstormSessionDetailSchema,
  );
  const detail = source.data?.session.projectId === projectId ? source.data : null;
  return (
    <div>
      <DataState {...source} />
      {detail && (
        <>
          <h3>Saved ideas</h3>
          {detail.ideas.length ? (
            detail.ideas.map((idea) => (
              <article className={styles.card} key={idea.id}>
                <h4>{idea.title}</h4>
                <p>{idea.description}</p>
                <p className={styles.muted}>{idea.tags.join(", ")}</p>
              </article>
            ))
          ) : (
            <p className={styles.muted}>No saved ideas in this session yet.</p>
          )}
          <Link
            className={styles.secondary}
            href={`/brainstorm?projectId=${projectId}&sessionId=${sessionId}`}
          >
            Continue session
          </Link>
          <p className={styles.muted}>
            Refine ideas, link sessions and convert saved actions in Brainstorm Studio.
          </p>
        </>
      )}
      {source.data && !detail && (
        <p role="status">
          This session is no longer linked to this project. Refresh the session list.
        </p>
      )}
    </div>
  );
}
