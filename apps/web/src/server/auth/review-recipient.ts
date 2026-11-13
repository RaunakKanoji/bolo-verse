import "server-only";
import { createClerkClient } from "@clerk/backend";
import { getServerEnv } from "@/server/config/env";
import { BoundaryError } from "./errors";
/** Authorization must precede this real, read-only Clerk account lookup. */
export async function verifyReviewRecipient(subject: string): Promise<string> {
  const env = getServerEnv();
  if (!env.CLERK_SECRET_KEY)
    throw new BoundaryError(
      503,
      "PROVIDER_UNCONFIGURED",
      "Configure project authentication before assigning reviewers.",
    );
  try {
    const user = await createClerkClient({ secretKey: env.CLERK_SECRET_KEY }).users.getUser(
      subject,
    );
    if (user.id !== subject || user.banned) throw new Error();
    return user.id;
  } catch {
    throw new BoundaryError(
      400,
      "INVALID_INPUT",
      "That reviewer is unavailable in the configured authentication instance. Use an existing active Clerk user ID.",
    );
  }
}
