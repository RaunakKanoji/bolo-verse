import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq, exists, or, sql } from "drizzle-orm";
import {
  DeliverableSchema,
  UploadedImageProvenanceSchema,
  type PublishDeliverable,
} from "@/lib/contracts/deliverables";
import { BoundaryError } from "@/server/auth/errors";
import { imageAssetSummary } from "./asset-ingestions";
import { withDatabase, type Database } from "./client";
import { assetUploadSessions } from "./creation-schema";
import { projectEditability } from "./projects";
import {
  accessGrants,
  assets,
  briefVersions,
  contentVersions,
  projects,
  rateLimitBuckets,
  reviewDecisions,
  spatialScenes,
} from "./schema";

const forbidden = () =>
  new BoundaryError(
    403,
    "FORBIDDEN",
    "This publication is unavailable or you do not have editor access.",
  );
const conflict = () =>
  new BoundaryError(
    409,
    "CONFLICT",
    "This publication request was already used with different details. Keep your form and review the version history.",
  );
const sourceUnavailable = () =>
  new BoundaryError(
    400,
    "INVALID_INPUT",
    "Choose a verified ready uploaded image from this project.",
  );
async function authorize(db: Database, subject: string, projectId: string, lock = false) {
  const query = db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), projectEditability(db, subject)));
  const [project] = lock ? await query.for("update") : await query.limit(1);
  if (!project) throw forbidden();
}
function projection(row: typeof contentVersions.$inferSelect, asset: typeof assets.$inferSelect) {
  const source = UploadedImageProvenanceSchema.parse(row.sourceSnapshot);
  if (
    row.status !== "ready" ||
    row.assetId !== source.assetId ||
    row.projectId !== source.projectId ||
    asset.id !== source.assetId ||
    asset.projectId !== row.projectId ||
    asset.checksumSha256 !== source.checksumSha256
  )
    throw new BoundaryError(
      503,
      "SERVICE_UNAVAILABLE",
      "This published version could not be verified.",
    );
  const { title, caption } = source;
  const publicSource = {
    schemaVersion: source.schemaVersion,
    sourceType: source.sourceType,
    projectId: source.projectId,
    assetId: source.assetId,
    checksumSha256: source.checksumSha256,
    ...(source.briefVersion === undefined ? {} : { briefVersion: source.briefVersion }),
    ...(source.sceneRevision === undefined
      ? {}
      : { sceneRevision: source.sceneRevision, sceneRelation: source.sceneRelation }),
    ...(source.revision ? { revision: source.revision } : {}),
  };
  return DeliverableSchema.parse({
    deliverableId: row.id,
    projectId: row.projectId,
    version: row.version,
    title,
    caption,
    status: "published",
    publishedAt: row.createdAt.toISOString(),
    source: publicSource,
    asset: imageAssetSummary(asset),
  });
}
async function retry(db: Database, subject: string, projectId: string, input: PublishDeliverable) {
  const [row] = await db
    .select()
    .from(contentVersions)
    .where(eq(contentVersions.id, input.idempotencyKey))
    .limit(1);
  if (!row) return null;
  const parsed = UploadedImageProvenanceSchema.safeParse(row.sourceSnapshot);
  if (
    !parsed.success ||
    row.projectId !== projectId ||
    row.authorClerkId !== subject ||
    row.status !== "ready"
  )
    throw conflict();
  const source = parsed.data;
  if (
    source.assetId !== input.assetId ||
    source.title !== input.title ||
    source.caption !== (input.caption ?? "") ||
    source.briefVersion !== input.briefVersion ||
    source.sceneRevision !== input.sceneRevision
  )
    throw conflict();
  if (
    source.revision?.supersedesVersionId !== input.revision?.supersedesVersionId ||
    source.revision?.expectedVersion !== input.revision?.expectedVersion ||
    source.revision?.expectedDecisionId !== input.revision?.expectedDecisionId
  )
    throw conflict();
  const [asset] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, input.assetId), eq(assets.projectId, projectId)))
    .limit(1);
  if (!asset) throw sourceUnavailable();
  return projection(row, asset);
}
async function candidate(db: Database, projectId: string, assetId: string) {
  const [asset] = await db
    .select({ asset: assets })
    .from(assets)
    .innerJoin(
      assetUploadSessions,
      and(
        eq(assetUploadSessions.assetId, assets.id),
        eq(assetUploadSessions.projectId, assets.projectId),
        eq(assetUploadSessions.status, "ready"),
        eq(assetUploadSessions.finalObjectKey, assets.objectKey),
        eq(assetUploadSessions.checksumSha256, assets.checksumSha256),
        eq(assetUploadSessions.mimeType, assets.mimeType),
        eq(assetUploadSessions.byteSize, assets.byteSize),
      ),
    )
    .where(and(eq(assets.id, assetId), eq(assets.projectId, projectId), eq(assets.status, "ready")))
    .limit(1);
  if (
    !asset ||
    asset.asset.objectKey !== `private/images/${projectId}/${assetId}` ||
    !/^[a-f0-9]{64}$/.test(asset.asset.checksumSha256 ?? "") ||
    !["image/png", "image/jpeg", "image/webp"].includes(asset.asset.mimeType) ||
    asset.asset.byteSize < 1 ||
    asset.asset.byteSize > 20 * 1024 * 1024 ||
    !asset.asset.width ||
    !asset.asset.height ||
    asset.asset.width > 8192 ||
    asset.asset.height > 8192 ||
    asset.asset.width * asset.asset.height > 4096 * 4096
  )
    throw sourceUnavailable();
  return asset.asset;
}
async function sourceLinks(
  db: Database,
  projectId: string,
  input: PublishDeliverable,
  lock = false,
) {
  let briefId: string | null = null;
  if (input.briefVersion !== undefined) {
    const [brief] = await db
      .select({ id: briefVersions.id })
      .from(briefVersions)
      .where(
        and(eq(briefVersions.projectId, projectId), eq(briefVersions.version, input.briefVersion)),
      )
      .limit(1);
    if (!brief)
      throw new BoundaryError(
        409,
        "CONFLICT",
        "The selected source brief is unavailable. Check the saved brief version.",
      );
    briefId = brief.id;
  }
  if (input.sceneRevision !== undefined) {
    const query = db
      .select({ revision: spatialScenes.revision })
      .from(spatialScenes)
      .where(
        and(
          eq(spatialScenes.projectId, projectId),
          eq(spatialScenes.revision, input.sceneRevision),
        ),
      )
      .limit(1);
    const [scene] = lock ? await query.for("share") : await query;
    if (!scene)
      throw new BoundaryError(
        409,
        "CONFLICT",
        "The selected canonical scene revision is no longer current. Check the saved scene before linking it as context.",
      );
  }
  return briefId;
}
async function revisionParent(
  db: Database,
  projectId: string,
  input: PublishDeliverable,
  asset: typeof assets.$inferSelect,
  lock = false,
) {
  const revision = input.revision;
  if (!revision) return;
  const stale = () =>
    new BoundaryError(
      409,
      "CONFLICT",
      "This reviewed version changed or already has a revision. Refresh its feedback and version history before resubmitting.",
    );
  const [parent] = await db
    .select()
    .from(contentVersions)
    .where(
      and(
        eq(contentVersions.id, revision.supersedesVersionId),
        eq(contentVersions.projectId, projectId),
        eq(contentVersions.status, "ready"),
      ),
    )
    .limit(1);
  const parsed = UploadedImageProvenanceSchema.safeParse(parent?.sourceSnapshot);
  if (
    !parent ||
    !parsed.success ||
    parent.version !== revision.expectedVersion ||
    parsed.data.projectId !== projectId ||
    parent.assetId !== parsed.data.assetId
  )
    throw stale();
  if (parent.assetId === asset.id || parsed.data.checksumSha256 === asset.checksumSha256)
    throw new BoundaryError(
      409,
      "CONFLICT",
      "Choose a different verified uploaded image with changed bytes before resubmitting.",
    );
  // Reviewer decisions lock their grant. Hold those same rows through publication so
  // a new terminal decision cannot invalidate the selected review context at commit.
  if (lock)
    await db
      .select({ id: accessGrants.id })
      .from(accessGrants)
      .where(eq(accessGrants.contentVersionId, parent.id))
      .for("update");
  const [decision] = await db
    .select()
    .from(reviewDecisions)
    .where(
      and(
        eq(reviewDecisions.contentVersionId, parent.id),
        eq(reviewDecisions.projectId, projectId),
      ),
    )
    .orderBy(desc(reviewDecisions.createdAt), desc(reviewDecisions.id))
    .limit(1);
  if (
    !decision ||
    decision.id !== revision.expectedDecisionId ||
    !["approved", "changes_requested"].includes(decision.decision)
  )
    throw stale();
  const [child] = await db
    .select({ id: contentVersions.id })
    .from(contentVersions)
    .where(
      and(
        eq(contentVersions.projectId, projectId),
        sql`${contentVersions.sourceSnapshot}->'revision'->>'supersedesVersionId' = ${parent.id}`,
      ),
    )
    .limit(1);
  if (child) throw stale();
}
async function budget(db: Database, subject: string) {
  const keyHash = createHash("sha256").update(`deliverable-publish:${subject}`).digest("hex");
  const [allowed] = await db
    .insert(rateLimitBuckets)
    .values({
      keyHash,
      count: 1,
      windowStart: sql`now()`,
      expiresAt: sql`now() + interval '1 minute'`,
    })
    .onConflictDoUpdate({
      target: rateLimitBuckets.keyHash,
      set: {
        count: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN 1 ELSE ${rateLimitBuckets.count} + 1 END`,
        windowStart: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() ELSE ${rateLimitBuckets.windowStart} END`,
        expiresAt: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() + interval '1 minute' ELSE ${rateLimitBuckets.expiresAt} END`,
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
      "Try up to 20 new publication attempts per minute. Exact successful retries remain available.",
    );
}
export function prepareDeliverable(subject: string, projectId: string, input: PublishDeliverable) {
  return withDatabase(async (db) => {
    await authorize(db, subject, projectId);
    const existing = await retry(db, subject, projectId, input);
    if (existing) return { existing, asset: null };
    const asset = await candidate(db, projectId, input.assetId);
    await revisionParent(db, projectId, input, asset);
    await sourceLinks(db, projectId, input);
    await budget(db, subject);
    return { existing: null, asset };
  });
}
export function commitDeliverable(
  subject: string,
  projectId: string,
  input: PublishDeliverable,
  verified: typeof assets.$inferSelect,
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      await authorize(tx, subject, projectId, true);
      const existing = await retry(tx, subject, projectId, input);
      if (existing) return existing;
      const asset = await candidate(tx, projectId, input.assetId);
      if (
        asset.objectKey !== verified.objectKey ||
        asset.checksumSha256 !== verified.checksumSha256 ||
        asset.byteSize !== verified.byteSize ||
        asset.mimeType !== verified.mimeType ||
        asset.width !== verified.width ||
        asset.height !== verified.height
      )
        throw sourceUnavailable();
      await revisionParent(tx, projectId, input, asset, true);
      const briefVersionId = await sourceLinks(tx, projectId, input, true);
      const [latest] = await tx
        .select({ version: contentVersions.version })
        .from(contentVersions)
        .where(eq(contentVersions.projectId, projectId))
        .orderBy(desc(contentVersions.version))
        .limit(1);
      const version = (latest?.version ?? 0) + 1;
      const source = UploadedImageProvenanceSchema.parse({
        schemaVersion: 2,
        sourceType: "uploaded_image",
        projectId,
        assetId: asset.id,
        checksumSha256: asset.checksumSha256,
        creatorId: subject,
        title: input.title,
        caption: input.caption ?? "",
        ...(input.briefVersion === undefined ? {} : { briefVersion: input.briefVersion }),
        ...(input.sceneRevision === undefined
          ? {}
          : { sceneRevision: input.sceneRevision, sceneRelation: "context_only" }),
        ...(input.revision ? { revision: input.revision } : {}),
      });
      const metadata = {
        format: "poster" as const,
        mimeType: asset.mimeType,
        bytes: asset.byteSize,
        width: asset.width!,
        height: asset.height!,
      };
      const [saved] = await tx
        .insert(contentVersions)
        .select(
          tx
            .select({
              id: sql<string>`${input.idempotencyKey}::uuid`.as("id"),
              projectId: projects.id,
              version: sql<number>`${version}::integer`.as("version"),
              sourceSnapshot: sql<typeof source>`${JSON.stringify(source)}::jsonb`.as(
                "source_snapshot",
              ),
              sourceSessionId: sql<null>`NULL::uuid`.as("source_session_id"),
              sourceSceneRevision: sql<number | null>`${input.sceneRevision ?? null}::integer`.as(
                "source_scene_revision",
              ),
              sourceArtifactVersionId: sql<null>`NULL::uuid`.as("source_artifact_version_id"),
              briefVersionId: sql<string | null>`${briefVersionId}::uuid`.as("brief_version_id"),
              assetId: sql<string>`${asset.id}::uuid`.as("asset_id"),
              mediaMetadata: sql<typeof metadata>`${JSON.stringify(metadata)}::jsonb`.as(
                "media_metadata",
              ),
              status: sql<"ready">`'ready'::output_status`.as("status"),
              authorClerkId: sql<string>`${subject}`.as("author_clerk_id"),
              createdAt: sql<Date>`now()`.as("created_at"),
            })
            .from(projects)
            .where(
              and(
                eq(projects.id, projectId),
                projectEditability(tx, subject),
                exists(
                  tx
                    .select({ id: assets.id })
                    .from(assets)
                    .where(
                      and(
                        eq(assets.id, asset.id),
                        eq(assets.projectId, projectId),
                        eq(assets.status, "ready"),
                      ),
                    ),
                ),
              ),
            ),
        )
        .onConflictDoNothing()
        .returning();
      if (!saved) throw conflict();
      return projection(saved, asset);
    }),
  );
}
export function readDeliverables(subject: string, projectId: string, deliverableId?: string) {
  return withDatabase(async (db) => {
    await authorize(db, subject, projectId);
    const rows = await db
      .select({ row: contentVersions, asset: assets })
      .from(contentVersions)
      .innerJoin(projects, eq(projects.id, contentVersions.projectId))
      .innerJoin(
        assets,
        and(eq(assets.id, contentVersions.assetId), eq(assets.projectId, projects.id)),
      )
      .where(
        and(
          eq(projects.id, projectId),
          projectEditability(db, subject),
          eq(contentVersions.status, "ready"),
          sql`${contentVersions.sourceSnapshot}->>'sourceType' = 'uploaded_image'`,
          sql`${contentVersions.sourceSnapshot}->>'schemaVersion' = '2'`,
          ...(deliverableId ? [eq(contentVersions.id, deliverableId)] : []),
        ),
      )
      .orderBy(desc(contentVersions.version))
      .limit(deliverableId ? 1 : 51);
    if (deliverableId && !rows.length) throw forbidden();
    return {
      deliverables: rows.slice(0, 50).map(({ row, asset }) => projection(row, asset)),
      hasMore: rows.length > 50,
      canPublish: true,
    };
  });
}
