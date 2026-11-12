import { getCurrentSubject } from "@/server/auth/identity";
import { listAuthorizedProjects } from "@/server/db/projects";
import { projectAccessState } from "@/features/projects/access-state";
import type { AccessState } from "@/features/projects/ProjectAccessNotice";
import StudioDashboard, { type DashboardProject } from "./StudioDashboard";

export default async function DashboardPage() {
  let projects: DashboardProject[] = [];
  let access: AccessState | null = null;
  try {
    projects = (await listAuthorizedProjects(await getCurrentSubject()))
      .map(({ id, name, objective, sample }) => ({ id, name, objective, sample }))
      .reverse();
  } catch (error) {
    access = projectAccessState(error);
  }
  return <StudioDashboard projects={projects} access={access} />;
}
