import { z } from "zod";

const position = z.tuple([
  z.number().min(-30).max(30),
  z.number().min(-30).max(30),
  z.number().min(-30).max(30),
]);
const rotation = z.tuple([
  z.number().min(-360).max(360),
  z.number().min(-360).max(360),
  z.number().min(-360).max(360),
]);
const scale = z.tuple([
  z.number().min(0.1).max(10),
  z.number().min(0.1).max(10),
  z.number().min(0.1).max(10),
]);

export const sceneEntitySchema = z.strictObject({
  id: z.string().min(1).max(80),
  type: z.literal("panel"),
  transform: z.strictObject({ position, rotation, scale }),
  properties: z.strictObject({
    title: z.string().min(1).max(160),
    body: z.string().max(2400),
    eyebrow: z.string().max(80),
    kind: z.enum(["project", "sample"]),
  }),
});

export const sceneDocumentSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    projectId: z.string().min(1).max(100),
    environment: z.literal("creative-studio"),
    entities: z.array(sceneEntitySchema).min(1).max(100),
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
