import { describe, expect, it } from "vitest";
import { z } from "zod";
import * as sharedScene from "@shape/scene-schema";
import * as legacySceneImport from "@/lib/contracts/spatial-scene";
import scene from "../../packages/api-contract/fixtures/canonical-scene.json";
import openapi from "../../packages/api-contract/openapi.json";

describe("shared scene package compatibility", () => {
  it("keeps existing application imports on the same schema and adapter instances", () => {
    expect(legacySceneImport.CanonicalSpatialSceneSchema).toBe(sharedScene.CanonicalSpatialSceneSchema);
    expect(legacySceneImport.SaveSpatialSceneSchema).toBe(sharedScene.SaveSpatialSceneSchema);
    expect(legacySceneImport.eulerXYZDegreesToQuaternion).toBe(sharedScene.eulerXYZDegreesToQuaternion);
    expect(legacySceneImport.quaternionToEulerXYZDegrees).toBe(sharedScene.quaternionToEulerXYZDegrees);
  });

  it("preserves the checked-in canonical document without adding wire fields", () => {
    const parsed = sharedScene.CanonicalSpatialSceneSchema.parse(scene);
    expect(parsed).toEqual(scene);
    expect(Object.keys(parsed).sort()).toEqual(["objects", "sceneId", "version"]);
    expect(Object.keys(parsed.objects[0]).sort()).toEqual(["assetId", "id", "position", "rotation", "scale", "visible"]);
    expect(sharedScene.CanonicalSpatialSceneSchema.safeParse({ ...scene, schemaVersion: 2 }).success).toBe(false);
  });

  it("emits unchanged scene schemas for the existing TypeScript and Swift API contract", () => {
    const exported = {
      CanonicalSpatialObject: sharedScene.CanonicalSpatialObjectSchema,
      CanonicalSpatialScene: sharedScene.CanonicalSpatialSceneSchema,
      SpatialSceneSnapshot: sharedScene.SpatialSceneSnapshotSchema,
      SaveSpatialScene: sharedScene.SaveSpatialSceneSchema,
    };
    for (const [name, schema] of Object.entries(exported)) {
      const emitted = z.toJSONSchema(schema, { target: "draft-2020-12", unrepresentable: "throw" });
      delete emitted.$schema;
      expect(emitted).toEqual(openapi.components.schemas[name as keyof typeof exported]);
    }
  });
});
