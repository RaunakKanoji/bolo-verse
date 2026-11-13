/** Presence only; Clerk verifies keys and sessions. Database setup is independent. */
export function clerkWebConfigured(source: Record<string, string | undefined>) {
  return Boolean(
    source.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() && source.CLERK_SECRET_KEY?.trim(),
  );
}
