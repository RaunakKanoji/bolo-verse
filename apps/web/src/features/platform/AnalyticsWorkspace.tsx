"use client";
import { StudioOverviewSchema } from "@/lib/contracts/workspace";
import { useWorkspaceSession } from "./WorkspaceSession";
import { useWorkspaceData } from "./use-workspace-data";
import { DataState } from "./WorkspaceComponents";
import { EmptyState, PageHeader } from "./WorkspaceUI";
import styles from "./platform.module.css";
export default function AnalyticsWorkspace() {
  const { sessionKey } = useWorkspaceSession();
  return <AnalyticsSession key={sessionKey} />;
}
function AnalyticsSession() {
  const source = useWorkspaceData("overview", StudioOverviewSchema);
  return (
    <div className={styles.page}>
      <PageHeader
        title="Workspace Analytics"
        description="A clear view of your saved creative workload."
      />
      <DataState {...source} />
      <section className={styles.metrics} aria-label="Saved workload totals">
        {[
          ["Active projects", source.data?.metrics.activeProjects],
          ["Pending reviews", source.data?.metrics.pendingReviews],
          ["Approved deliverables", source.data?.metrics.completedDeliverables],
          ["Deadlines in seven days", source.data?.metrics.upcomingDeadlines],
        ].map(([label, value]) => (
          <article className={styles.metric} key={String(label)}>
            <span>{label}</span>
            <strong>{value ?? "—"}</strong>
          </article>
        ))}
      </section>
      <EmptyState
        title="Build a history of creative work"
        description="These totals reflect saved projects, published versions and review decisions. Period comparisons and audience performance reports are not available yet."
      />
    </div>
  );
}
