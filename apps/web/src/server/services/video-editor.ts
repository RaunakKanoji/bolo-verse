import "server-only";
import type { CreateVideoRender } from "@/lib/contracts/video-editor";
import { BoundaryError } from "@/server/auth/errors";
import { getServerEnv } from "@/server/config/env";
import {
  createVideoRender,
  findVideoRenderRequest,
  claimVideoRender,
  readVideoRenderClaim,
  markVideoRenderDispatch,
  recordVideoProviderJob,
  releaseVideoRenderLease,
  completeVideoRender,
  failVideoRender,
  readVideoRender,
  type VideoRenderClaim,
} from "@/server/db/video-editor";
import { createShotstackProvider, getVideoEditorCapabilities } from "@/server/providers/shotstack";
import {
  readAuthorizedShotstackSource,
  readShotstackOutput,
  writeShotstackOutput,
} from "@/server/providers/shotstack-media";

function configuredEnvironment() {
  const capabilities = getVideoEditorCapabilities();
  if (capabilities.availability !== "configured" || !capabilities.environment)
    throw new BoundaryError(
      503,
      "PROVIDER_UNCONFIGURED",
      capabilities.reason ?? "Private video rendering is not configured.",
    );
  return capabilities.environment;
}
function providerFor(claim: VideoRenderClaim) {
  // Existing jobs retain the environment selected at explicit consent, even if
  // the deployment's current default changes before a safe status refresh.
  return createShotstackProvider({
    env: { ...getServerEnv(), SHOTSTACK_ENV: claim.request.environment },
  });
}
async function authorized(claim: VideoRenderClaim) {
  if (await readVideoRenderClaim(claim)) return true;
  await failVideoRender(
    claim,
    "ACCESS_CHANGED",
    "Project access or a verified source changed. No output was published.",
  );
  return false;
}
export async function submitVideoRender(
  subject: string,
  projectId: string,
  input: CreateVideoRender,
) {
  const existing = await findVideoRenderRequest(subject, projectId, input);
  if (existing) return existing;
  const environment = configuredEnvironment();
  const job = await createVideoRender(subject, projectId, input, environment);
  const claim = await claimVideoRender(subject, projectId, job.id, "submit");
  if (!claim) return readVideoRender(subject, projectId, job.id);
  let dispatchIntent = false;
  try {
    const sources = [];
    for (const asset of claim.request.sourceSnapshot) {
      if (!(await authorized(claim))) return readVideoRender(subject, projectId, job.id);
      sources.push(await readAuthorizedShotstackSource({ asset }));
      if (!(await authorized(claim))) return readVideoRender(subject, projectId, job.id);
    }
    if (!(await authorized(claim))) return readVideoRender(subject, projectId, job.id);
    if (!(await markVideoRenderDispatch(claim))) return readVideoRender(subject, projectId, job.id);
    dispatchIntent = true;
    const submitted = await providerFor(claim).submit({ edit: claim.request.document, sources });
    if (!(await authorized(claim))) return readVideoRender(subject, projectId, job.id);
    if (!(await recordVideoProviderJob(claim, submitted.providerJobId)))
      throw new Error("Render lease changed.");
    await releaseVideoRenderLease(claim);
  } catch {
    // A durable marker precedes the network request. Any exception after it is
    // conservatively uncertain; no retry can cause a second billed dispatch.
    await failVideoRender(
      claim,
      dispatchIntent ? "SHOTSTACK_DISPATCH_UNCERTAIN" : "SOURCE_UNAVAILABLE",
      dispatchIntent
        ? "The submission outcome is uncertain. It will not be sent again automatically. A new render may incur another charge."
        : "A private source could not be verified. No render was submitted.",
    );
  }
  return readVideoRender(subject, projectId, job.id);
}
export async function refreshVideoRender(subject: string, projectId: string, jobId: string) {
  const current = await readVideoRender(subject, projectId, jobId);
  if (["ready", "failed", "cancelled"].includes(current.status)) return current;
  const claim = await claimVideoRender(subject, projectId, jobId, "refresh");
  if (!claim) return readVideoRender(subject, projectId, jobId);
  try {
    if (!(await authorized(claim))) return readVideoRender(subject, projectId, jobId);
    const status = await providerFor(claim).poll(claim.job.providerJobId!);
    if (!(await authorized(claim))) return readVideoRender(subject, projectId, jobId);
    if (status.status === "failed")
      await failVideoRender(
        claim,
        "RENDER_FAILED",
        "Shotstack could not render this edit. It will not retry automatically.",
      );
    else if (status.status === "ready") {
      if (!status.outputUrl) throw new Error("Missing verified output reference.");
      const output = await readShotstackOutput(status.outputUrl);
      if (!(await authorized(claim))) return readVideoRender(subject, projectId, jobId);
      const objectKey = `private/recordings/${projectId}/${jobId}/${output.checksumSha256}.mp4`;
      await writeShotstackOutput({
        objectKey,
        bytes: output.bytes,
        checksumSha256: output.checksumSha256,
      });
      if (!(await authorized(claim))) return readVideoRender(subject, projectId, jobId);
      if (
        !(await completeVideoRender(claim, {
          objectKey,
          byteSize: output.bytes.byteLength,
          checksumSha256: output.checksumSha256,
          mimeType: "video/mp4",
        }))
      )
        await failVideoRender(
          claim,
          "ACCESS_CHANGED",
          "Project access changed. No output was published.",
        );
    } else await releaseVideoRenderLease(claim);
  } catch {
    // Poll/import may be repeated for the stored provider job. They never submit
    // another render, and output bytes are written conditionally and immutably.
    await releaseVideoRenderLease(claim);
    throw new BoundaryError(
      503,
      "SERVICE_UNAVAILABLE",
      "The render status or private output could not be verified. You can safely refresh this existing render again.",
    );
  }
  return readVideoRender(subject, projectId, jobId);
}
