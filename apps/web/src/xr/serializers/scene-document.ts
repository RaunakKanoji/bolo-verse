import { z } from "zod";

import {
  createDefaultXRLayout,
  XRLayoutSchema,
  XRProjectContentSchema,
  XRTransformSchema,
  type XRLayout,
  type XRProjectContent,
} from "@/lib/contracts/xr-workspace";

export const sceneEntitySchema = z
  .strictObject({
    id: z.string().min(1).max(80),
    type: z.enum(["panel", "asset", "model"]),
    assetId: z.uuid().optional(),
    transform: XRTransformSchema,
    properties: z.strictObject({
      title: z.string().min(1).max(160),
      body: z.string().max(2400),
      eyebrow: z.string().max(80),
      kind: z.enum(["project", "sample", "brief", "artifact", "asset", "review", "tool"]),
      mimeType: z.string().max(150).optional(),
    }),
  })
  .refine(
    (entity) =>
      entity.type === "panel" ? entity.assetId === undefined : entity.assetId !== undefined,
    "Asset and model entities require an asset ID; panels cannot contain one.",
  );

export const sceneDocumentSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    projectId: z.string().min(1).max(100),
    environment: z.literal("creative-studio"),
    entities: z.array(sceneEntitySchema).min(1).max(50),
  })
  .refine(
    (document) =>
      new Set(document.entities.map((entity) => entity.id)).size === document.entities.length,
    "Entity IDs must be unique",
  );

export type SceneDocument = z.infer<typeof sceneDocumentSchema>;
export type SceneEntity = z.infer<typeof sceneEntitySchema>;
export type WorkspaceProject = { id: string; name: string; objective: string };

export function createStudioDocument(project: WorkspaceProject): SceneDocument {
  return sceneDocumentSchema.parse({
    schemaVersion: 1,
    projectId: project.id,
    environment: "creative-studio",
    entities: [
      {
        id: "project-overview",
        type: "panel",
        transform: { position: [0, 2.45, -3.7], rotation: [0, 0, 0], scale: [1.3, 1.3, 1.3] },
        properties: {
          title: project.name,
          body: project.objective,
          eyebrow: "PROJECT OVERVIEW",
          kind: "project",
        },
      },
      {
        id: "sample-concept",
        type: "panel",
        transform: {
          position: [-2.3, 1.65, -3.15],
          rotation: [0, 16, 0],
          scale: [0.85, 0.85, 0.85],
        },
        properties: {
          title: "Concept card",
          body: "A place for a creative direction. Select this sample to inspect the spatial card.",
          eyebrow: "01 / SPATIAL SAMPLE",
          kind: "sample",
        },
      },
      {
        id: "sample-storyboard",
        type: "panel",
        transform: { position: [0, 1.15, -3.1], rotation: [0, 0, 0], scale: [0.85, 0.85, 0.85] },
        properties: {
          title: "Storyboard frame",
          body: "A place for a scene and shot description. This sample is not a saved storyboard.",
          eyebrow: "02 / SPATIAL SAMPLE",
          kind: "sample",
        },
      },
      {
        id: "sample-reference",
        type: "panel",
        transform: {
          position: [2.3, 1.65, -3.15],
          rotation: [0, -16, 0],
          scale: [0.85, 0.85, 0.85],
        },
        properties: {
          title: "Reference panel",
          body: "A place for a visual reference. No private asset or external media is loaded here.",
          eyebrow: "03 / SPATIAL SAMPLE",
          kind: "sample",
        },
      },
    ],
  });
}

export function serializeSceneDocument(document: SceneDocument): SceneDocument {
  return sceneDocumentSchema.parse(document);
}

/** Project scenes contain only authorized catalog items. Sample content is never substituted. */
export function createProjectDocument(
  project: WorkspaceProject,
  input: XRProjectContent,
  savedLayout?: XRLayout,
): SceneDocument {
  const content = XRProjectContentSchema.parse(input);
  const defaults = createDefaultXRLayout(content);
  const layout = savedLayout ? XRLayoutSchema.parse(savedLayout) : defaults;
  const saved = new Map(layout.objects.map((object) => [object.id, object]));
  const properties = new Map<string, SceneEntity["properties"]>();
  properties.set("project-overview", {
    title: project.name,
    body: project.objective,
    eyebrow: "Project overview",
    kind: "project",
  });
  if (content.brief)
    properties.set(`brief-${content.brief.id}`, {
      title: content.brief.title.slice(0, 160) || "Creative brief",
      body: content.brief.body.slice(0, 2400),
      eyebrow: `Brief · ${content.brief.status}`,
      kind: "brief",
    });
  for (const artifact of content.artifacts)
    properties.set(`artifact-${artifact.id}`, {
      title: artifact.title || artifact.kind,
      body: artifact.body.slice(0, 2400),
      eyebrow: artifact.kind.replaceAll("_", " "),
      kind: "artifact",
    });
  for (const asset of content.assets)
    properties.set(`asset-${asset.id}`, {
      title: `${asset.mimeType.split("/")[0]} · ${asset.id.slice(0, 8)}`,
      body: `${asset.mimeType} · ${Math.ceil(asset.byteSize / 1024)} KB${asset.width && asset.height ? ` · ${asset.width} × ${asset.height}` : ""}. Select Open asset in the companion panel to load this protected preview.`,
      eyebrow: "Project asset",
      kind: "asset",
      mimeType: asset.mimeType,
    });
  if (content.reviews.length)
    properties.set("client-review", {
      title: "Client feedback",
      body: content.reviews
        .map(
          (review) =>
            `${review.decision ? `${review.decision.replaceAll("_", " ")}: ` : ""}${review.body}`,
        )
        .join("\n\n")
        .slice(0, 2400),
      eyebrow: "Recorded project feedback",
      kind: "review",
    });
  return sceneDocumentSchema.parse({
    schemaVersion: 1,
    projectId: project.id,
    environment: "creative-studio",
    entities: defaults.objects.map((object) => {
      const previous = saved.get(object.id);
      // A stale or foreign catalog reference can never change an object's identity.
      const transform =
        previous?.type === object.type && previous.assetId === object.assetId
          ? previous.transform
          : object.transform;
      return { ...object, transform, properties: properties.get(object.id)! };
    }),
  });
}

/** Persistence stores identities and transforms, never display text or media URLs. */
export function documentToLayout(input: SceneDocument): XRLayout {
  const document = serializeSceneDocument(input);
  return XRLayoutSchema.parse({
    schemaVersion: 1,
    environment: document.environment,
    objects: document.entities.map(({ id, type, assetId, transform }) => ({
      id,
      type,
      ...(assetId ? { assetId } : {}),
      transform,
    })),
  });
}
