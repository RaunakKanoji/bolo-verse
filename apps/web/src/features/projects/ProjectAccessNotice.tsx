import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export type AccessState = "sign-in" | "unconfigured" | "denied" | "unavailable";

export default function ProjectAccessNotice({ state }: { state: AccessState }) {
  if (state === "sign-in")
    return (
      <section className="empty-state">
        <h1>Your workspace starts here.</h1>
        <p>Sign in to open the projects assigned to your account.</p>
        <SignInButton mode="modal">
          <Button>Sign in</Button>
        </SignInButton>
      </section>
    );
  const heading =
    state === "unconfigured"
      ? "Connect your workspace"
      : state === "denied"
        ? "Project unavailable"
        : "Workspace temporarily unavailable";
  return (
    <section className="empty-state">
      <h1>{heading}</h1>
      <p>
        {state === "unconfigured"
          ? "Clerk and Neon setup is needed before private projects can open. The spatial workspace is available without a connected project; private media appears after setup."
          : state === "denied"
            ? "This project is unavailable to your account. Open your project list to select a project you can access."
            : "We could not read your projects. Check the connection and try again."}
      </p>
      {state === "unconfigured" && (
        <div className="setup-panel">
          <h2>Setup for the project owner</h2>
          <p>
            Follow the repository README to configure Clerk and Neon, then apply the checked-in
            migrations. A preview never signs you in as a sample user.
          </p>
        </div>
      )}
      <div className="actions">
        <Button asChild>
          <Link href={state === "denied" ? "/app/projects" : "/xr/hud"}>
            {state === "denied" ? "Open your projects" : "Open spatial workspace"}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/studio/feasibility">Open recording lab</Link>
        </Button>
      </div>
    </section>
  );
}
