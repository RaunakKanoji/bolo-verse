import { createHash } from "node:crypto";
import { buildDemoDataset, demoId } from "@/lib/demo/dataset";
import type { DemoConfig } from "./config";
import { findDemoFixture } from "./fixtures";
import * as s from "@/server/db/schema";
import * as b from "@/server/db/brainstorm-schema";
import * as w from "@/server/db/workspace-schema";
import { ArtifactPayloadSchema } from "@/lib/contracts/documents";
import { UploadedImageProvenanceSchema } from "@/lib/contracts/deliverables";

export function buildDemoRows(config: DemoConfig) {
  const dataset = buildDemoDataset(config),
    id = (key: string) => demoId(config.slug, key),
    owner = config.owner;
  const created = new Date(`${config.referenceDate}T10:00:00Z`);
  const workspaceId = id("workspace");
  const clients: (typeof w.workspaceClients.$inferInsert)[] = dataset.clients.map((c) => ({
    id: c.id,
    workspaceId,
    name: c.name,
    organization: c.industry,
    email: c.email,
    phone: c.phone,
    notes: `Fictional demo client. ${c.description}\nBrand palette: ${c.colors.join(", ")}\n${c.personality}; ${c.language}\nContact: ${c.contact}\nAssigned creator: ${dataset.profiles.find((p) => p.id === c.creator)!.name}`,
    createdByClerkId: owner,
    creationFingerprint: config.marker,
    createdAt: new Date(c.submittedAt),
    updatedAt: new Date(c.submittedAt),
  }));
  const projects: (typeof s.projects.$inferInsert)[] = dataset.projects.map((p) => ({
    id: p.id,
    workspaceId,
    name: p.title,
    objective: p.brief.objective,
    createdByClerkId: owner,
    sample: true,
    studioMetadata: {
      clientId: p.clientId,
      type: p.format,
      status: p.status,
      priority: p.priority,
      startDate: p.createdAt.slice(0, 10),
      dueDate: p.dueDate,
      creationFingerprint: config.marker,
    },
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  }));
  const briefs: (typeof s.briefVersions.$inferInsert)[] = dataset.projects.map((p) => ({
    id: p.briefId,
    projectId: p.id,
    version: 1,
    payload: p.brief,
    authorClerkId: owner,
    status: "proposed",
    createdAt: new Date(p.createdAt),
  }));
  const directions: (typeof s.artifactVersions.$inferInsert)[] = [],
    scripts: (typeof s.artifactVersions.$inferInsert)[] = [],
    storyboards: (typeof s.artifactVersions.$inferInsert)[] = [],
    notes: (typeof s.artifactVersions.$inferInsert)[] = [];
  const assets: (typeof s.assets.$inferInsert)[] = [];
  const addAsset = (assetId: string, projectId: string, preview: string, at: string) => {
    const objectKey = `demo-fixtures/v1/${preview.split("/").at(-1)}`,
      fixture = findDemoFixture(objectKey);
    if (!fixture) throw new Error("Missing demo fixture.");
    assets.push({
      id: assetId,
      projectId,
      ownerClerkId: owner,
      objectKey: `${objectKey}#${assetId}`,
      mimeType: fixture.mimeType,
      byteSize: fixture.byteSize,
      width: fixture.width,
      height: fixture.height,
      checksumSha256: fixture.checksumSha256,
      status: "ready",
      createdAt: new Date(at),
    });
  };
  for (const [i, p] of dataset.projects.entries()) {
    const c = dataset.clients.find((c) => c.id === p.clientId)!;
    const base = {
      projectId: p.id,
      authorClerkId: owner,
      sourceBriefVersionId: p.briefId,
      createdAt: new Date(Date.parse(p.createdAt) + 2 * 3600000),
    };
    for (const d of p.directions)
      directions.push({
        ...base,
        id: d.id,
        kind: "direction",
        version: d.version,
        payload: d.payload,
      });
    for (const script of p.scripts)
      scripts.push({
        ...base,
        id: script.id,
        kind: "script",
        version: script.version,
        payload: script.payload,
        sourceArtifactVersionId: script.payload.directionVersionId,
      });
    if (p.storyboard) {
      storyboards.push({
        ...base,
        id: p.storyboard.id,
        kind: "storyboard",
        version: 1,
        payload: p.storyboard.payload,
        sourceArtifactVersionId: p.storyboard.payload.scriptVersionId,
      });
      p.storyboard.payload.shots.forEach((shot, n) =>
        addAsset(shot.assetIds[0], p.id, `/demo-assets/${c.key}-frame-${n}.png`, p.createdAt),
      );
    }
    addAsset(id(`asset:${i}:brand`), p.id, c.logo, p.createdAt);
    const metadata = `Historical synthetic production history. Stage: ${p.stage}. Assigned: ${dataset.profiles.find((c) => c.id === p.creatorId)!.name}.\nSelected concept: ${p.directions.find((d) => d.selected)!.payload.title}.\n${p.brief.notes}\nAudio: voiceover preparation only, no recorded command audio. Review and generation states are simulated; no provider was called.`;
    notes.push({
      ...base,
      id: id(`note:${i}`),
      kind: "note",
      version: 1,
      payload: ArtifactPayloadSchema.parse({ kind: "note", schemaVersion: 1, text: metadata }),
    });
  }
  const content: (typeof s.contentVersions.$inferInsert)[] = dataset.content.map((c) => {
    const p = dataset.projects.find((p) => p.id === c.projectId)!;
    if (c.assetId && c.preview) addAsset(c.assetId, p.id, c.preview, c.createdAt);
    const asset = assets.find((a) => a.id === c.assetId);
    // Existing browser publication schema; caption explicitly identifies the local fixture import.
    // No upload-session row or real provider/generation request is fabricated.
    const source =
      c.assetId && asset
        ? UploadedImageProvenanceSchema.parse({
            schemaVersion: 2,
            sourceType: "uploaded_image",
            projectId: p.id,
            assetId: c.assetId,
            checksumSha256: asset.checksumSha256,
            creatorId: owner,
            title: c.title,
            caption: `Synthetic demo fixture import; no external upload or generation. ${c.source}`,
            briefVersion: 1,
          })
        : {
            schemaVersion: 1 as const,
            sourceKind: "scene" as const,
            briefVersionId: p.briefId,
            briefApprovalStatus: "proposed" as const,
            assetIds: [],
            sessionId: id(`studio:${p.id}`),
            sceneRevision: 0,
            scene: {
              schemaVersion: 1 as const,
              background: "studio" as const,
              lighting: { preset: "soft" as const, brightness: 1 },
              products: [],
              camera: {
                preset: "static" as const,
                position: { x: 0, y: 1.6, z: 4 },
                target: { x: 0, y: 1, z: 0 },
                fieldOfView: 45,
                aspectRatio: "9:16" as const,
              },
            },
          };
    return {
      id: c.id,
      projectId: p.id,
      version: c.version,
      sourceSnapshot: source,
      briefVersionId: p.briefId,
      assetId: c.assetId,
      status: c.status === "complete" ? "ready" : c.status === "failed" ? "failed" : "capturing",
      mediaMetadata: asset
        ? {
            format: "poster",
            mimeType: asset.mimeType,
            bytes: asset.byteSize,
            width: asset.width!,
            height: asset.height!,
          }
        : null,
      authorClerkId: owner,
      createdAt: new Date(c.createdAt),
    };
  });
  const sessions: (typeof s.studioSessions.$inferInsert)[] = dataset.projects.map((p) => ({
    id: id(`studio:${p.id}`),
    projectId: p.id,
    creatorClerkId: owner,
    locale: p.brief.language,
    status: "ended",
    createdAt: new Date(p.createdAt),
  }));
  const conversations: (typeof b.brainstormSessions.$inferInsert)[] = dataset.conversations.map(
    (c) => ({
      id: c.id,
      workspaceId,
      ownerClerkId: owner,
      projectId: c.projectId,
      title: `Demo · ${c.title}`.slice(0, 120),
      revision: 2,
      createHash: config.marker,
      pinned: c.projectId === dataset.projects[0].id,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(Date.parse(c.createdAt) + 600000),
    }),
  );
  const messages: (typeof b.brainstormMessages.$inferInsert)[] = dataset.conversations.flatMap(
    (c) =>
      c.messages.map((m, n) => ({
        id: m.id,
        sessionId: c.id,
        requestHash: config.marker,
        message: m.prompt,
        status: "completed" as const,
        content: m.content,
        createdAt: new Date(Date.parse(c.createdAt) + n * 600000),
      })),
  );
  const ideas: (typeof b.brainstormIdeas.$inferInsert)[] = dataset.conversations.map((c) => {
    const p = dataset.projects.find((p) => p.id === c.projectId)!;
    const d = p.directions.find((d) => d.selected)!;
    return {
      id: id(`idea:${c.id}`),
      sessionId: c.id,
      requestHash: config.marker,
      title: d.payload.title,
      description: `Selected synthetic demo concept. ${d.payload.concept}`,
      tags: ["synthetic-demo", "selected"],
      category: "direction",
      sourceMessageId: c.messages[0].id,
      createdAt: new Date(c.createdAt),
    };
  });
  const comments: (typeof s.reviewComments.$inferInsert)[] = dataset.comments.map((c) => ({
    id: c.id,
    projectId: c.projectId,
    contentVersionId: c.contentId,
    reviewerClerkId: `demo-profile:${c.author}`,
    comment: `[Historical synthetic feedback] ${c.author}: ${c.body}`,
    createdAt: new Date(c.createdAt),
  }));
  const decisions: (typeof s.reviewDecisions.$inferInsert)[] = dataset.decisions.map((d) => ({
    id: d.id,
    projectId: d.projectId,
    contentVersionId: d.contentId,
    reviewerClerkId: "demo-profile:client",
    decision: d.decision,
    reason: d.reason,
    createdAt: new Date(d.createdAt),
  }));
  const voice: (typeof s.commandLogs.$inferInsert)[] = dataset.voice.map((v) => ({
    id: v.id,
    projectId: v.projectId,
    sessionId: id(`studio:${v.projectId}`),
    requestId: `synthetic:${v.id}`,
    actorClerkId: owner,
    transcript: v.transcript,
    action: `DEMO_SIMULATION:${v.intent}`,
    result: { status: "rejected", errorCode: "SYNTHETIC_NOT_EXECUTED" },
    timings: {},
    fallback: true,
    createdAt: new Date(v.createdAt),
  }));
  for (const [n, v] of dataset.voice.entries())
    notes.push({
      id: id(`voice-note:${n}`),
      projectId: v.projectId,
      kind: "note",
      version: 2 + n,
      payload: {
        kind: "note",
        schemaVersion: 1,
        text: `Synthetic voice history, never executed.\n${JSON.stringify(v)}`,
      },
      authorClerkId: owner,
      createdAt: new Date(v.createdAt),
    });
  for (const c of dataset.content.filter((c) => c.status !== "complete"))
    notes.push({
      id: id(`content-note:${c.id}`),
      projectId: c.projectId,
      kind: "note",
      version: 30 + c.version,
      payload: {
        kind: "note",
        schemaVersion: 1,
        text: `Synthetic generation history; not an executable job.\n${JSON.stringify(c)}`,
      },
      authorClerkId: owner,
      createdAt: new Date(c.createdAt),
    });
  const tasks: (typeof w.projectTasks.$inferInsert)[] = dataset.projects.flatMap((p) =>
    p.tasks.map((t) => ({
      ...t,
      projectId: p.id,
      priority: p.priority,
      createdByClerkId: owner,
      creationFingerprint: config.marker,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    })),
  );
  const layouts: (typeof s.xrWorkspaces.$inferInsert)[] = dataset.layouts.map((l) => ({
    id: l.id,
    projectId: l.projectId,
    version: 1,
    layout: l.layout,
    createdAt: new Date(l.savedAt),
    updatedAt: new Date(l.savedAt),
  }));
  const library: (typeof w.assetLibraryMetadata.$inferInsert)[] = assets.map((a) => ({
    assetId: a.id!,
    projectId: a.projectId,
    collection: "Synthetic demo fixtures",
    updatedAt: created,
  }));
  const hash = createHash("sha256").update(JSON.stringify(dataset)).digest("hex");
  return {
    dataset,
    workspaceId,
    created,
    hash,
    clients,
    projects,
    briefs,
    directions,
    scripts,
    storyboards,
    notes,
    assets,
    content,
    sessions,
    conversations,
    messages,
    ideas,
    comments,
    decisions,
    voice,
    tasks,
    layouts,
    library,
  };
}
