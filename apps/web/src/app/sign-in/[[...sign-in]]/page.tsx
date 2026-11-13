import { Suspense } from "react";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { clerkWebConfigured } from "@/lib/auth/configured";
export default function SignInPage() {
  return (
    <section className="auth-page">
      <h1>Sign in to Shape Studio</h1>
      <p>Access your private creative workspace.</p>
      {clerkWebConfigured(process.env) ? (
        <Suspense fallback={<p role="status">Loading secure sign-in…</p>}>
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/workspace"
          />
        </Suspense>
      ) : (
        <p role="status">
          Clerk is not configured. Add the selected application keys to enable sign-in.
        </p>
      )}
      <Link href="/demo">Explore the fictional demo</Link>
    </section>
  );
}
