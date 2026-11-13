import { FinalizedImageUploadResultSchema } from "@/lib/contracts/creation";
import { MAX_PREVIEW_BYTES } from "@/lib/contracts/xr-assets";
import { validateWorkspaceUpload } from "@/lib/contracts/workspace-uploads";
import { creationRequest } from "@/features/creation/creation-http";
import { uploadProjectImage } from "@/features/creation/upload-reference-image";
const types: Readonly<Record<string, string>> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  glb: "model/gltf-binary",
  gltf: "model/gltf+json",
  wav: "audio/wav",
};
export const submissionFileAccept = Object.keys(types)
  .map((extension) => `.${extension}`)
  .join(",");
export function submissionFileType(file: Pick<File, "name" | "type" | "size">) {
  const type = types[file.name.split(".").at(-1)?.toLowerCase() ?? ""];
  if (
    !type ||
    (file.type && file.type.split(";", 1)[0].toLowerCase() !== type) ||
    file.size < 1 ||
    file.size > MAX_PREVIEW_BYTES
  )
    throw new Error(
      "Choose a supported file with matching extension and type, between 1 byte and 20 MiB.",
    );
  return type;
}
export async function uploadSubmissionFile(
  projectId: string,
  file: File,
  key: string,
  signal: AbortSignal,
  onPhase: (phase: string) => void,
) {
  const type = submissionFileType(file);
  if (type.startsWith("image/"))
    return uploadProjectImage(
      projectId,
      file.type ? file : new File([file], file.name, { type }),
      signal,
      { idempotencyKey: key, onPhase },
    );
  onPhase("preparing");
  const bytes = new Uint8Array(await file.arrayBuffer());
  signal.throwIfAborted();
  validateWorkspaceUpload(bytes, type);
  onPhase("uploading and verifying");
  const query = new URLSearchParams({ projectId, idempotencyKey: key });
  const result = await creationRequest(
    `/api/v1/workspace/uploads?${query}`,
    FinalizedImageUploadResultSchema,
    {
      method: "POST",
      headers: { "Content-Type": type },
      body: file,
      redirect: "error",
    },
    signal,
  );
  if (
    result.asset.projectId !== projectId ||
    result.asset.id !== key ||
    result.asset.mimeType !== type ||
    result.asset.byteSize !== file.size
  )
    throw new Error("The uploaded asset could not be verified for this project.");
  return result.asset;
}
