import "server-only";
import { and, eq } from "drizzle-orm";
import { BoundaryError } from "@/server/auth/errors";
import { withDatabase } from "./client";
import { assets, projects } from "./schema";
import { projectVisibility } from "./projects";

/** The object key never leaves the server; only ready, authorized assets can be read. */
export async function readXRAsset(subject: string, assetId: string) {
  return withDatabase(async database => {
    const [result] = await database.select({ asset: assets }).from(assets).innerJoin(projects, eq(assets.projectId, projects.id)).where(and(eq(assets.id, assetId), eq(assets.status, "ready"), projectVisibility(database, subject))).limit(1);
    if (!result) throw new BoundaryError(403, "FORBIDDEN", "This asset is unavailable or you do not have access.");
    return result.asset;
  });
}
