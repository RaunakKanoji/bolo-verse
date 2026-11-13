import "server-only";
import { createHash } from "node:crypto";
import { or, sql } from "drizzle-orm";
import type { XRAssistantContext } from "@/lib/contracts/xr-assistant";
import type { XRWorkspaceData } from "@/lib/contracts/xr-workspace";
import { BoundaryError } from "@/server/auth/errors";
import { withDatabase, type Database } from "@/server/db/client";
import { rateLimitBuckets } from "@/server/db/schema";
import { readXRWorkspace } from "@/server/db/xr-workspaces";

export function assistantContext(data: XRWorkspaceData): XRAssistantContext {
  return {
    projectId: data.project.id,
    name: data.project.name,
    objective: data.project.objective,
    panelIds: data.workspace.layout.objects.map(({ id }) => id),
    assetIds: data.content.assets.map(({ id }) => id),
    content: JSON.stringify({
      brief: data.content.brief,
      artifacts: data.content.artifacts,
      reviews: data.content.reviews,
    }).slice(0, 12_000),
  };
}

export async function authorizedAssistantContext(subject: string, projectId: string) {
  const data = await readXRWorkspace(subject, projectId);
  if (!data.canEdit)
    throw new BoundaryError(
      403,
      "FORBIDDEN",
      "Only project creators and editors can use the creative assistant.",
    );
  return assistantContext(data);
}

/** One durable shared text/STT/TTS budget per account, checked before every provider call. */
export async function consumeAssistantBudget(subject: string, database?: Database) {
  const keyHash = createHash("sha256").update(`xr-assistant:${subject}`).digest("hex");
  const consume = async (database: Database) => {
    const [allowed] = await database
      .insert(rateLimitBuckets)
      .values({
        keyHash,
        count: 1,
        windowStart: sql`now()`,
        expiresAt: sql`now() + interval '1 hour'`,
      })
      .onConflictDoUpdate({
        target: rateLimitBuckets.keyHash,
        set: {
          count: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN 1 ELSE ${rateLimitBuckets.count} + 1 END`,
          windowStart: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() ELSE ${rateLimitBuckets.windowStart} END`,
          expiresAt: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() + interval '1 hour' ELSE ${rateLimitBuckets.expiresAt} END`,
        },
        setWhere: or(
          sql`${rateLimitBuckets.expiresAt} <= now()`,
          sql`${rateLimitBuckets.count} < 20`,
        ),
      })
      .returning({ keyHash: rateLimitBuckets.keyHash });
    if (!allowed)
      throw new BoundaryError(
        429,
        "RATE_LIMITED",
        "Assistant text and speech requests are limited to 20 per hour. Try again later.",
      );
  };
  return database ? consume(database) : withDatabase(consume);
}
