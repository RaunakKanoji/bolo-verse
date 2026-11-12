import "server-only";
import { createHash } from "node:crypto";
import { ArtifactPayloadSchema, BriefPayloadSchema } from "@/lib/contracts";
import type { Database } from "./client";
import { bootstrapPersonalWorkspace } from "./projects";
import { artifactVersions, briefVersions, projectMembers, projects } from "./schema";

function sampleId(subject: string, resource: string): string {
  const bytes = createHash("sha256").update(`boloverse:m0-sample:${subject}:${resource}`).digest().subarray(0, 16);
  // UUID v8 reserves a version for application-defined deterministic identifiers.
  bytes[6] = (bytes[6] & 0x0f) | 0x80;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Development setup only; the CLI verifies this subject against the configured Clerk instance. */
export async function seedSampleProject(database: Database, subject: string): Promise<string> {
  const workspace = await bootstrapPersonalWorkspace(database, subject);
  const projectId = sampleId(subject, "project");
  const briefId = sampleId(subject, "brief");
  const directionId = sampleId(subject, "direction");
  const scriptId = sampleId(subject, "script");
  const storyboardId = sampleId(subject, "storyboard");
  const brief = BriefPayloadSchema.parse({
    schemaVersion: 1,
    objective: "Introduce a fictional Ilkal saree campaign through a fifteen-second portrait reel.",
    audience: "People exploring sarees from local businesses in India.",
    product: "Ilkal saree · fictional sample",
    format: "reel", aspectRatio: "9:16", tone: "Warm, clear and factual", language: "en-IN",
    facts: [
      { id: sampleId(subject, "fact-blend"), text: "Silk-cotton blend" },
      { id: sampleId(subject, "fact-origin"), text: "Handwoven in Ilkal" },
    ],
    prohibitedClaims: ["pure silk", "machine washable"],
    constraints: ["Sample supplied facts require client review before approval.", "Do not invent certifications, discounts or performance claims."],
  });
  const direction = ArtifactPayloadSchema.parse({
    kind: "direction", schemaVersion: 1, briefVersionId: briefId,
    title: "A closer look at Ilkal",
    hook: "A closer look at a saree handwoven in Ilkal.",
    concept: "Introduce the saree, show its silk-cotton blend and close with an invitation to explore.",
    visualTreatment: "Three steady portrait frames with a simple background and readable product details.",
    rationale: "Uses only the supplied product facts and fits a short reel.",
    constraints: ["Use a supplied product image before production.", "Draft concept, not a client-approved claim."],
  });
  const script = ArtifactPayloadSchema.parse({
    kind: "script", schemaVersion: 1, briefVersionId: briefId, directionVersionId: directionId,
    sections: [
      { id: sampleId(subject, "section-1"), spokenText: "Take a closer look at this Ilkal saree.", onScreenText: "Ilkal saree", durationSeconds: 5 },
      { id: sampleId(subject, "section-2"), spokenText: "A silk-cotton blend, handwoven in Ilkal.", onScreenText: "Silk-cotton blend · Handwoven in Ilkal", durationSeconds: 5 },
      { id: sampleId(subject, "section-3"), spokenText: "Explore the details and find your next look.", onScreenText: "Explore the details", durationSeconds: 5 },
    ],
    callToAction: "Explore the details",
  });
  const storyboard = ArtifactPayloadSchema.parse({
    kind: "storyboard", schemaVersion: 1, scriptVersionId: scriptId,
    shots: [
      { id: sampleId(subject, "shot-1"), durationSeconds: 5, framing: "Full product card in portrait frame", cameraMovement: "Static", description: "Introduce the saree image with clear space around it.", narration: "Take a closer look at this Ilkal saree.", textOverlay: "Ilkal saree", assetIds: [], lighting: "Soft studio", shootingNotes: "Product photo is not seeded as a real uploaded asset." },
      { id: sampleId(subject, "shot-2"), durationSeconds: 5, framing: "Closer crop of the supplied product image", cameraMovement: "Gentle push-in", description: "Show the supplied material and origin facts.", narration: "A silk-cotton blend, handwoven in Ilkal.", textOverlay: "Silk-cotton blend · Handwoven in Ilkal", assetIds: [], lighting: "Soft studio", shootingNotes: "A flat image cannot reveal new product angles." },
      { id: sampleId(subject, "shot-3"), durationSeconds: 5, framing: "Full product with closing text", cameraMovement: "Static", description: "Return to the product view and invitation.", narration: "Explore the details and find your next look.", textOverlay: "Explore the details", assetIds: [], lighting: "Soft studio", shootingNotes: "Keep the text legible within the portrait safe area." },
    ],
  });

  await database.transaction(async (transaction) => {
    await transaction.insert(projects).values({
      id: projectId, workspaceId: workspace.id, name: "Ilkal saree · fictional sample",
      objective: brief.objective, createdByClerkId: subject, sample: true,
    }).onConflictDoNothing();
    await transaction.insert(projectMembers).values({ projectId, clerkUserId: subject, role: "creator" }).onConflictDoNothing();
    await transaction.insert(briefVersions).values({ id: briefId, projectId, version: 1, payload: brief, authorClerkId: subject, status: "proposed" }).onConflictDoNothing();
    // Dependency order also makes the revision links enforceable foreign keys.
    await transaction.insert(artifactVersions).values({ id: directionId, projectId, kind: "direction", version: 1, payload: direction, sourceBriefVersionId: briefId, authorClerkId: subject }).onConflictDoNothing();
    await transaction.insert(artifactVersions).values({ id: scriptId, projectId, kind: "script", version: 1, payload: script, sourceBriefVersionId: briefId, sourceArtifactVersionId: directionId, authorClerkId: subject }).onConflictDoNothing();
    await transaction.insert(artifactVersions).values({ id: storyboardId, projectId, kind: "storyboard", version: 1, payload: storyboard, sourceBriefVersionId: briefId, sourceArtifactVersionId: scriptId, authorClerkId: subject }).onConflictDoNothing();
  });
  return projectId;
}
