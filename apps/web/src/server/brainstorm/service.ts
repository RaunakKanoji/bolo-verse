import "server-only";
import { createHash } from "node:crypto";
import { and, eq, or, sql } from "drizzle-orm";
import { redactBrainstormText, type BrainstormRequest } from "@/lib/contracts/brainstorm";
import { serializeBriefForAI } from "@/lib/contracts/project-briefs";
import { BoundaryError } from "@/server/auth/errors";
import { getServerEnv } from "@/server/config/env";
import { withDatabase } from "@/server/db/client";
import { readProjectBrief } from "@/server/db/project-briefs";
import { projectEditability } from "@/server/db/projects";
import { projects, rateLimitBuckets } from "@/server/db/schema";
import { hasGemini } from "@/server/providers/xr-assistant";
import { createGeminiBrainstormProvider } from "@/server/providers/gemini-brainstorm";
import { consumeAssistantBudget } from "@/server/xr-assistant/service";

const denied = () => new BoundaryError(403, "FORBIDDEN", "Only project creators and editors can brainstorm from a brief.");
const changed = () => new BoundaryError(409, "CONFLICT", "The saved brief changed. Refresh the brief and try again; your message has been kept.");

/** Both durable quotas commit together; denied requests do not spend the other bucket. */
export async function consumeBrainstormBudget(subject: string, projectId: string) {
  return withDatabase((database) => database.transaction(async (transaction) => {
    const [access] = await transaction.select({ id: projects.id }).from(projects)
      .where(and(eq(projects.id, projectId), projectEditability(transaction, subject))).limit(1);
    if (!access) throw denied();
    await consumeAssistantBudget(subject, transaction);
    const keyHash = createHash("sha256").update(`creative-brainstorm:${subject}:${projectId}`).digest("hex");
    const [allowed] = await transaction.insert(rateLimitBuckets).values({
      keyHash, count: 1, windowStart: sql`now()`, expiresAt: sql`now() + interval '1 hour'`,
    }).onConflictDoUpdate({ target: rateLimitBuckets.keyHash, set: {
      count: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN 1 ELSE ${rateLimitBuckets.count} + 1 END`,
      windowStart: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() ELSE ${rateLimitBuckets.windowStart} END`,
      expiresAt: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() + interval '1 hour' ELSE ${rateLimitBuckets.expiresAt} END`,
    }, setWhere: or(sql`${rateLimitBuckets.expiresAt} <= now()`, sql`${rateLimitBuckets.count} < 10`) }).returning({ keyHash: rateLimitBuckets.keyHash });
    if (!allowed) throw new BoundaryError(429, "RATE_LIMITED", "Brainstorming is limited to 10 requests per project per hour for your account. Try again later.");
  }));
}

export async function brainstormFromBrief(subject: string, projectId: string, input: BrainstormRequest, signal?: AbortSignal) {
  const saved = await readProjectBrief(subject, projectId);
  if (!saved.canEdit) throw denied();
  if (!saved.brief) throw new BoundaryError(409, "CONFLICT", "Save a client brief before asking Gemini for directions.");
  if (input.briefVersion !== undefined && input.briefVersion !== saved.version) throw changed();
  const env = getServerEnv();
  if (!hasGemini(env)) throw new BoundaryError(503, "PROVIDER_UNCONFIGURED", "Gemini brainstorming is not configured. Ask your workspace administrator to connect Gemini.");
  signal?.throwIfAborted();
  const brief = saved.brief;
  // Do not transmit notes, reference URLs, identities, asset/storage IDs or unrelated project content.
  // Preserve every constraint/prohibited claim; limit optional supporting facts/context.
  const selected = JSON.parse(serializeBriefForAI({ ...brief, notes: undefined, references: undefined,
    facts: brief.facts.slice(0, 5),
    brandRequirements: brief.brandRequirements?.slice(0, 1000), keyMessage: brief.keyMessage?.slice(0, 500), channels: brief.channels?.slice(0, 5),
  }));
  selected.facts = brief.facts.slice(0, 5).map((fact) => fact.text);
  const context = JSON.stringify(selected);
  const bounded = redactBrainstormText(context);
  // Never truncate away a prohibition or constraint to fit the context window.
  if (bounded.length > 24000) throw new BoundaryError(400, "INVALID_INPUT", "The saved brief is too large for brainstorming. Shorten its facts or constraints before trying again.");
  await consumeBrainstormBudget(subject, projectId);
  const result = await createGeminiBrainstormProvider(env).respond({ message: input.message, briefContext: bounded, sourceBriefVersion: saved.version, signal });
  // A slow provider must never expose private content after access is revoked.
  const current = await readProjectBrief(subject, projectId);
  if (!current.canEdit) throw denied();
  if (current.version !== saved.version) throw changed();
  signal?.throwIfAborted();
  return result;
}
