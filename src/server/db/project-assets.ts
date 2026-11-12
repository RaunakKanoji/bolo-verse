import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { AssetListSchema, ProjectSummarySchema, type ProjectSummary } from "@/lib/contracts/shape";
import { nativeContentSupported } from "@/lib/contracts/native-assets";
import { previewSupported } from "@/lib/contracts/xr-assets";
import { BoundaryError } from "@/server/auth/errors";
import { withDatabase } from "./client";
import { projectVisibility } from "./projects";
import { assets, projects } from "./schema";

/** Explicit transport projection: never serialize a database project row directly. */
export function projectSummary(project: typeof projects.$inferSelect): ProjectSummary {
  return ProjectSummarySchema.parse({ id: project.id, name: project.name, objective: project.objective, sample: project.sample, createdAt: project.createdAt.toISOString() });
}

export async function listAuthorizedProjectAssets(subject: string, projectId: string) {
  return withDatabase(async (database) => {
    // LEFT JOIN preserves an authorized empty project without a separate unscoped
    // asset read. Read 101 rows so truncation is explicit in the contract.
    const rows = await database.select({
      projectId: projects.id,
      asset: { id: assets.id, projectId: assets.projectId, mimeType: assets.mimeType, byteSize: assets.byteSize, width: assets.width, height: assets.height, durationSeconds: assets.durationSeconds, createdAt: assets.createdAt },
    }).from(projects).leftJoin(assets, and(eq(assets.projectId, projects.id), eq(assets.status, "ready")))
      .where(and(eq(projects.id, projectId), projectVisibility(database, subject)))
      .orderBy(desc(assets.createdAt), assets.id).limit(101);
    if (!rows.length) throw new BoundaryError(403, "FORBIDDEN", "You do not have access to this project.");
    const ready = rows.flatMap(({ asset }) => asset ? [asset] : []);
    return AssetListSchema.parse({
      assets: ready.slice(0, 100).map((asset) => ({
        ...asset, createdAt: asset.createdAt.toISOString(),
        nativeContentUrl: nativeContentSupported(asset.mimeType, asset.byteSize) ? `/api/v1/assets/${asset.id}/native-content` : null,
        contentUrl: previewSupported(asset.mimeType, asset.byteSize) ? `/api/v1/assets/${asset.id}/content` : null,
      })),
      hasMore: ready.length > 100,
    });
  });
}
