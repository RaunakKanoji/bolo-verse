import { Suspense } from "react";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { clerkWebConfigured } from "@/lib/auth/configured";
export default function SignUpPage() {
  return (
    <section className="auth-page">
      <h1>Create your Shape Studio account</h1>
      <p>Keep your projects and creative work in your own workspace.</p>
      {clerkWebConfigured(process.env) ? (
        <Suspense fallback={<p role="status">Loading secure sign-up…</p>}>
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/workspace"
          />
        </Suspense>
      ) : (
        <p role="status">
          Clerk is not configured. Add the selected application keys to enable sign-up.
        </p>
      )}
      <Link href="/sign-in">Already have an account? Sign in</Link>
    </section>
  );
}
