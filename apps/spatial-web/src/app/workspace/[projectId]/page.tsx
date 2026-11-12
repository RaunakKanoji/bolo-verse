import { AuthorizedSpatialWorkspace } from "../../../auth/AuthorizedSpatialWorkspace";
import { loadWorkspace } from "../../../lib/bootstrap";
import { ShapeApiError } from "../../../lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  let bootstrap;
  let signIn = false;
  try {
    bootstrap = await loadWorkspace(projectId);
  } catch (error) {
    signIn = error instanceof ShapeApiError && error.status === 401;
  }
  if (bootstrap) return <AuthorizedSpatialWorkspace projectId={projectId} />;
  return (
    <main className="access-notice">
      <a className="shape-wordmark" href="/">
        shape
        <span className="brand-dot" />
      </a>
      <section>
        <div className="access-mark" aria-hidden="true">
          ◇
        </div>
        <h1>{signIn ? "Sign in to open this workspace" : "This workspace is unavailable"}</h1>
        <p>
          {signIn
            ? "Your project scene is private. Sign in through Shape Studio, then open your project again."
            : "Open the project from Shape Studio to check your access. If access is available, try opening the workspace again."}
        </p>
        <a className="primary button-link" href="/app/projects">
          Go to your projects
        </a>
        <Link href="/workspace">About spatial workspaces</Link>
      </section>
    </main>
  );
}
