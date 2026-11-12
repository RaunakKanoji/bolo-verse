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

import { createProjectDocument, documentToLayout } from "@/xr/serializers/scene-document";
import { createDefaultXRLayout, type XRProjectContent } from "@/lib/contracts/xr-workspace";

const content: XRProjectContent = {
  brief: {
    id: "10000000-0000-4000-8000-000000000001",
    title: "Client brief",
    body: "Real brief text",
    status: "approved",
  },
  artifacts: [
    {
      id: "20000000-0000-4000-8000-000000000002",
      kind: "script",
      title: "Script one",
      body: "Actual project script",
    },
  ],
  assets: [
    {
      id: "30000000-0000-4000-8000-000000000003",
      mimeType: "image/png",
      byteSize: 2000,
      width: 640,
      height: 480,
      durationSeconds: null,
    },
  ],
  reviews: [],
};

it("maps authorized private content and saved transforms without introducing samples", () => {
  const layout = createDefaultXRLayout(content);
  layout.objects[1].transform.position = [4, 2, -3];
  const document = createProjectDocument(project, content, layout);
  expect(document.entities.map((entity) => entity.properties.kind)).toEqual([
    "project",
    "brief",
    "artifact",
    "asset",
  ]);
  expect(document.entities[1].properties.body).toBe("Real brief text");
  expect(document.entities[1].transform.position).toEqual([4, 2, -3]);
  expect(documentToLayout(document)).toEqual(layout);
  expect(JSON.stringify(documentToLayout(document))).not.toContain("Real brief text");
});

it("new private projects contain only actual project context", () => {
  const document = createProjectDocument(project, {
    brief: null,
    artifacts: [],
    assets: [],
    reviews: [],
  });
  expect(document.entities).toHaveLength(1);
  expect(document.entities[0].id).toBe("project-overview");
});

it("retains layout transforms for existing content and shows newly authorized content", () => {
  const layout = createDefaultXRLayout({ brief: null, artifacts: [], assets: [], reviews: [] });
  layout.objects[0].transform.position = [1, 2, -3];
  const document = createProjectDocument(project, content, layout);
  expect(document.entities).toHaveLength(4);
  expect(document.entities[0].transform.position).toEqual([1, 2, -3]);
});
