import "server-only";
import { ResourceIdSchema } from "@/lib/contracts/api";
import { BoundaryError } from "@/server/auth/errors";
export { readProductionLibrary, saveProductionArtifact } from "@/server/db/production-artifacts";
export type ProductionRoute = { params: Promise<{ id: string }> };
export async function productionProjectId(context: ProductionRoute) {
  const parsed = ResourceIdSchema.safeParse((await context.params).id);
  if (!parsed.success) throw new BoundaryError(400, "INVALID_INPUT", "Choose a valid project.");
  return parsed.data;
}
