import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq, exists, isNull, or, sql } from "drizzle-orm";
import type { z } from "zod";
import {
  BrainstormIdeaSchema,
  BrainstormMessageSchema,
  BrainstormSessionSchema,
  type BrainstormStudioContent,
  type CreateBrainstormSessionSchema,
  type SaveBrainstormIdeaSchema,
  type SendBrainstormMessageSchema,
  type UpdateBrainstormSessionSchema,
} from "@/lib/contracts/brainstorm-studio";
import { BoundaryError } from "@/server/auth/errors";
import { consumeAssistantBudget } from "@/server/xr-assistant/service";
import { withDatabase, type Database } from "./client";
import {
  brainstormIdeas,
  brainstormMessages,
  brainstormMutations,
  brainstormSessions,
} from "./brainstorm-schema";
import { bootstrapPersonalWorkspace, projectEditability } from "./projects";
import { projects, projectMembers, workspaceMembers, workspaces } from "./schema";
const denied = () =>
  new BoundaryError(
    403,
    "FORBIDDEN",
    "This private brainstorm session is unavailable to your account.",
  );
const conflict = () =>
  new BoundaryError(
    409,
    "CONFLICT",
    "This session changed or the request was already used. Reload saved content; your local draft is safe.",
  );
const bounded = () =>
  new BoundaryError(
    429,
    "RATE_LIMITED",
    "This brainstorm has reached its saved-content limit. Start a new session.",
  );
export const brainstormRequestHash = (input: unknown) =>
  createHash("sha256").update(JSON.stringify(input)).digest("hex");
function access(db: Database, subject: string) {
  return and(
    eq(brainstormSessions.ownerClerkId, subject),
    or(
      and(
        isNull(brainstormSessions.projectId),
        exists(
          db
            .select({ one: sql`1` })
            .from(workspaces)
            .where(
              and(
                eq(workspaces.id, brainstormSessions.workspaceId),
                eq(workspaces.personalOwnerClerkId, subject),
              ),
            ),
        ),
      ),
      exists(
        db
          .select({ one: sql`1` })
          .from(projects)
          .where(
            and(
              eq(projects.id, brainstormSessions.projectId),
              eq(projects.workspaceId, brainstormSessions.workspaceId),
              projectEditability(db, subject),
            ),
          ),
      ),
    ),
  );
}
const sessionDTO = (row: typeof brainstormSessions.$inferSelect) =>
  BrainstormSessionSchema.parse({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
const messageDTO = (row: typeof brainstormMessages.$inferSelect) =>
  BrainstormMessageSchema.parse({ ...row, createdAt: row.createdAt.toISOString() });
const ideaDTO = (row: typeof brainstormIdeas.$inferSelect) =>
  BrainstormIdeaSchema.parse({ ...row, createdAt: row.createdAt.toISOString() });
// DTO parsers are strict: explicitly select fields so storage hashes/subjects never leave the server.
const session = (r: typeof brainstormSessions.$inferSelect) =>
  sessionDTO({
    id: r.id,
    title: r.title,
    projectId: r.projectId,
    pinned: r.pinned,
    revision: r.revision,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  } as typeof r);
const message = (r: typeof brainstormMessages.$inferSelect) =>
  messageDTO({
    id: r.id,
    sessionId: r.sessionId,
    message: r.message,
    status: r.status,
    content: r.content,
    createdAt: r.createdAt,
  } as typeof r);
const idea = (r: typeof brainstormIdeas.$inferSelect) =>
  ideaDTO({
    id: r.id,
    sessionId: r.sessionId,
    title: r.title,
    description: r.description,
    tags: r.tags,
    category: r.category,
    sourceMessageId: r.sourceMessageId,
    createdAt: r.createdAt,
  } as typeof r);
// Keep the qualifying grants locked through the write; a concurrent revocation wins
// before this check or waits until the authorized transaction has committed.
async function lockProject(db: Database, subject: string, id: string) {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), projectEditability(db, subject)))
    .for("share");
  if (!row) throw denied();
  await db
    .select({ id: projectMembers.projectId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, id), eq(projectMembers.clerkUserId, subject)))
    .for("share");
  await db
    .select({ id: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, row.workspaceId),
        eq(workspaceMembers.clerkUserId, subject),
      ),
    )
    .for("share");
  const [current] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), projectEditability(db, subject)));
  if (!current) throw denied();
  return current;
}
async function locked(db: Database, subject: string, id: string) {
  const [row] = await db
    .select()
    .from(brainstormSessions)
    .where(and(eq(brainstormSessions.id, id), access(db, subject)))
    .for("update");
  if (!row) throw denied();
  if (row.projectId) await lockProject(db, subject, row.projectId);
  return row;
}
async function count(
  db: Database,
  table: typeof brainstormIdeas | typeof brainstormMessages | typeof brainstormMutations,
  id: string,
) {
  const [r] = await db
    .select({ n: sql<number>`count(*)::integer` })
    .from(table)
    .where(eq(table.sessionId, id));
  return r?.n ?? 0;
}
async function advance(
  db: Database,
  subject: string,
  row: typeof brainstormSessions.$inferSelect,
  values: Partial<typeof brainstormSessions.$inferInsert> = {},
) {
  const [saved] = await db
    .update(brainstormSessions)
    .set({ ...values, revision: row.revision + 1, updatedAt: sql`now()` })
    .where(
      and(
        eq(brainstormSessions.id, row.id),
        eq(brainstormSessions.revision, row.revision),
        access(db, subject),
      ),
    )
    .returning();
  if (!saved) throw denied();
  return saved;
}
export async function listBrainstormSessions(subject: string) {
  return withDatabase(async (db) => ({
    sessions: (
      await db
        .select()
        .from(brainstormSessions)
        .where(access(db, subject))
        .orderBy(desc(brainstormSessions.updatedAt))
        .limit(100)
    ).map(session),
  }));
}
export async function createBrainstormSession(
  subject: string,
  input: z.infer<typeof CreateBrainstormSessionSchema>,
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      const requestHash = brainstormRequestHash(input);
      const [retry] = await tx
        .select()
        .from(brainstormSessions)
        .where(eq(brainstormSessions.id, input.idempotencyKey));
      if (retry) {
        if (retry.ownerClerkId !== subject || retry.createHash !== requestHash) throw conflict();
        await locked(tx, subject, retry.id);
        return session(retry);
      }
      const personal = await bootstrapPersonalWorkspace(tx, subject);
      // A single actor lock bounds sessions even across many linked workspaces.
      await tx
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.id, personal.id))
        .for("update");
      const workspaceId = input.projectId
        ? (await lockProject(tx, subject, input.projectId)).workspaceId
        : personal.id;
      const [total] = await tx
        .select({ n: sql<number>`count(*)::integer` })
        .from(brainstormSessions)
        .where(eq(brainstormSessions.ownerClerkId, subject));
      if ((total?.n ?? 0) >= 100) throw bounded();
      const [row] = await tx
        .insert(brainstormSessions)
        .values({
          id: input.idempotencyKey,
          workspaceId,
          ownerClerkId: subject,
          projectId: input.projectId,
          title: input.title,
          createHash: requestHash,
        })
        .onConflictDoNothing()
        .returning();
      if (!row) throw conflict();
      return session(row);
    }),
  );
}
export async function readBrainstormSession(subject: string, id: string) {
  return withDatabase(async (db) => {
    const [row] = await db
      .select()
      .from(brainstormSessions)
      .where(and(eq(brainstormSessions.id, id), access(db, subject)));
    if (!row) throw denied();
    const messages = await db
      .select()
      .from(brainstormMessages)
      .where(eq(brainstormMessages.sessionId, id))
      .orderBy(brainstormMessages.createdAt, brainstormMessages.id)
      .limit(40);
    const ideas = await db
      .select()
      .from(brainstormIdeas)
      .where(eq(brainstormIdeas.sessionId, id))
      .orderBy(brainstormIdeas.createdAt, brainstormIdeas.id)
      .limit(100);
    const [current] = await db
      .select()
      .from(brainstormSessions)
      .where(and(eq(brainstormSessions.id, id), access(db, subject)));
    if (!current) throw denied();
    return { session: session(current), messages: messages.map(message), ideas: ideas.map(idea) };
  });
}
export async function updateBrainstormSession(
  subject: string,
  id: string,
  input: z.infer<typeof UpdateBrainstormSessionSchema>,
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      const row = await locked(tx, subject, id),
        hash = brainstormRequestHash(input);
      const [retry] = await tx
        .select()
        .from(brainstormMutations)
        .where(eq(brainstormMutations.id, input.idempotencyKey));
      if (retry) {
        if (retry.sessionId !== id || retry.requestHash !== hash) throw conflict();
        return session(row);
      }
      if (row.revision !== input.expectedRevision) throw conflict();
      if ((await count(tx, brainstormMutations, id)) >= 1000) throw bounded();
      let workspaceId = row.workspaceId;
      if (input.projectId)
        workspaceId = (await lockProject(tx, subject, input.projectId)).workspaceId;
      else if (input.projectId === null)
        workspaceId = (await bootstrapPersonalWorkspace(tx, subject)).id;
      await tx
        .insert(brainstormMutations)
        .values({ id: input.idempotencyKey, sessionId: id, requestHash: hash })
        .onConflictDoNothing()
        .returning()
        .then((rows) => {
          if (!rows.length) throw conflict();
        });
      // Authorization is evaluated against the old link while the checked new link is installed.
      return session(
        await advance(tx, subject, row, {
          workspaceId,
          ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.pinned !== undefined ? { pinned: input.pinned } : {}),
        }),
      );
    }),
  );
}
export async function saveBrainstormIdea(
  subject: string,
  id: string,
  input: z.infer<typeof SaveBrainstormIdeaSchema>,
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      const row = await locked(tx, subject, id),
        hash = brainstormRequestHash(input);
      const [retry] = await tx
        .select()
        .from(brainstormIdeas)
        .where(eq(brainstormIdeas.id, input.idempotencyKey));
      if (retry) {
        if (retry.sessionId !== id || retry.requestHash !== hash) throw conflict();
        return { session: session(row), idea: idea(retry) };
      }
      if (row.revision !== input.expectedRevision) throw conflict();
      if ((await count(tx, brainstormIdeas, id)) >= 100) throw bounded();
      if (input.sourceMessageId) {
        const [source] = await tx
          .select()
          .from(brainstormMessages)
          .where(
            and(
              eq(brainstormMessages.id, input.sourceMessageId),
              eq(brainstormMessages.sessionId, id),
              eq(brainstormMessages.status, "completed"),
            ),
          );
        if (!source)
          throw new BoundaryError(
            400,
            "INVALID_INPUT",
            "Choose a completed response from this session as the idea source.",
          );
      }
      const [saved] = await tx
        .insert(brainstormIdeas)
        .values({
          id: input.idempotencyKey,
          sessionId: id,
          requestHash: hash,
          title: input.title,
          description: input.description,
          tags: input.tags,
          category: input.category,
          sourceMessageId: input.sourceMessageId,
        })
        .onConflictDoNothing()
        .returning();
      if (!saved) throw conflict();
      return { session: session(await advance(tx, subject, row)), idea: idea(saved) };
    }),
  );
}
export async function reserveBrainstormMessage(
  subject: string,
  id: string,
  input: z.infer<typeof SendBrainstormMessageSchema>,
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      const row = await locked(tx, subject, id),
        hash = brainstormRequestHash(input);
      const [retry] = await tx
        .select()
        .from(brainstormMessages)
        .where(eq(brainstormMessages.id, input.idempotencyKey));
      if (retry) {
        if (retry.sessionId !== id || retry.requestHash !== hash) throw conflict();
        return { session: session(row), message: message(retry), dispatch: false };
      }
      if (row.revision !== input.expectedRevision) throw conflict();
      if ((await count(tx, brainstormMessages, id)) >= 40) throw bounded();
      // Abandoned network/process attempts remain durable and are never dispatched
      // again. An explicit new request can proceed once the original deadline passed.
      await tx
        .update(brainstormMessages)
        .set({ status: "uncertain" })
        .where(
          and(
            eq(brainstormMessages.sessionId, id),
            eq(brainstormMessages.status, "pending"),
            sql`${brainstormMessages.createdAt} < now() - interval '2 minutes'`,
          ),
        );
      const [inFlight] = await tx
        .select({ id: brainstormMessages.id })
        .from(brainstormMessages)
        .where(and(eq(brainstormMessages.sessionId, id), eq(brainstormMessages.status, "pending")));
      if (inFlight)
        throw new BoundaryError(
          409,
          "CONFLICT",
          "A response is already pending. Reload to check its status; it will not be automatically sent again.",
        );
      await consumeAssistantBudget(subject, tx);
      const [saved] = await tx
        .insert(brainstormMessages)
        .values({
          id: input.idempotencyKey,
          sessionId: id,
          requestHash: hash,
          message: input.message,
        })
        .onConflictDoNothing()
        .returning();
      if (!saved) throw conflict();
      return {
        session: session(await advance(tx, subject, row)),
        message: message(saved),
        dispatch: true,
      };
    }),
  );
}
export async function finishBrainstormMessage(
  subject: string,
  id: string,
  messageId: string,
  content: BrainstormStudioContent | null,
  expectedRevision?: number,
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      const row = await locked(tx, subject, id);
      if (content && expectedRevision !== undefined && row.revision !== expectedRevision) throw conflict();
      const [saved] = await tx
        .update(brainstormMessages)
        .set({ status: content ? "completed" : "uncertain", content })
        .where(
          and(
            eq(brainstormMessages.id, messageId),
            eq(brainstormMessages.sessionId, id),
            eq(brainstormMessages.status, "pending"),
          ),
        )
        .returning();
      if (!saved) throw conflict();
      return { session: session(await advance(tx, subject, row)), message: message(saved) };
    }),
  );
}
