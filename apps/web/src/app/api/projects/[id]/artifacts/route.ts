import { randomUUID } from "node:crypto";
import { SaveProductionArtifactSchema } from "@/lib/contracts/production-artifacts";
import { errorResponse, successResponse } from "@/server/auth/errors";
import { getCurrentSubject } from "@/server/auth/identity";
import { readMutationJson, requireMutationOrigin } from "@/server/auth/mutations";
import {
  productionProjectId,
  readProductionLibrary,
  saveProductionArtifact,
  type ProductionRoute,
} from "@/server/services/production-artifacts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: ProductionRoute) {
  const requestId = randomUUID();
  try {
    const subject = await getCurrentSubject();
    return successResponse(
      await readProductionLibrary(subject, await productionProjectId(context)),
      requestId,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
export async function POST(request: Request, context: ProductionRoute) {
  const requestId = randomUUID();
  try {
    const subject = await getCurrentSubject();
    requireMutationOrigin(request);
    const id = await productionProjectId(context);
    const input = await readMutationJson(request, SaveProductionArtifactSchema, {
      maxBytes: 32768,
    });
    return successResponse(await saveProductionArtifact(subject, id, input), requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
