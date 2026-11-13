import "server-only";
import { z } from "zod";
import { BoundaryError } from "./errors";
export async function reviewVersionId(params: Promise<{ versionId: string }>) {
  const value = z.strictObject({ versionId: z.uuid() }).safeParse(await params);
  if (!value.success)
    throw new BoundaryError(400, "INVALID_INPUT", "A valid published version ID is required.");
  return value.data.versionId;
}
export async function reviewCreatorIds(
  params: Promise<{ projectId: string; deliverableId: string; grantId?: string }>,
) {
  const value = z
    .strictObject({ projectId: z.uuid(), deliverableId: z.uuid(), grantId: z.uuid().optional() })
    .safeParse(await params);
  if (!value.success)
    throw new BoundaryError(
      400,
      "INVALID_INPUT",
      "Valid project, version and grant IDs are required.",
    );
  return value.data;
}
