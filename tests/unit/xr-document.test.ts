import { describe, expect, it } from "vitest";
import {
  createStudioDocument,
  sceneDocumentSchema,
  serializeSceneDocument,
} from "@/xr/serializers/scene-document";

const project = { id: "preview-studio", name: "A project", objective: "A clear objective" };

describe("renderer-independent scene documents", () => {
  it("keeps actual project context separate from explicitly labelled sample content", () => {
    const document = createStudioDocument(project);
    expect(document.projectId).toBe(project.id);
    expect(document.entities[0].properties).toMatchObject({
      title: project.name,
      body: project.objective,
      kind: "project",
    });
    expect(document.entities.slice(1).every((entity) => entity.properties.kind === "sample")).toBe(
      true,
    );
    expect(JSON.stringify(document)).not.toMatch(/a-entity|object3D|renderer|<script/);
  });

  it("serializes a validated detached snapshot", () => {
    const document = createStudioDocument(project);
    const snapshot = serializeSceneDocument(document);
    snapshot.entities[0].properties.title = "Changed";
    expect(document.entities[0].properties.title).toBe(project.name);
  });

  it("rejects unknown fields, unsupported versions, unbounded transforms, and arbitrary URLs", () => {
    const document = createStudioDocument(project);
    expect(sceneDocumentSchema.safeParse({ ...document, schemaVersion: 2 }).success).toBe(false);
    expect(
      sceneDocumentSchema.safeParse({ ...document, remoteAsset: "https://example.com/a.glb" })
        .success,
    ).toBe(false);
    document.entities[0].transform.position[0] = Infinity;
    expect(sceneDocumentSchema.safeParse(document).success).toBe(false);
  });
});
