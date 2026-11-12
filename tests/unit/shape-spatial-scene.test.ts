import { describe, expect, it } from "vitest";
import { CanonicalSpatialSceneSchema, eulerXYZDegreesToQuaternion, quaternionToEulerXYZDegrees } from "@/lib/contracts/spatial-scene";

import scene from "../../packages/api-contract/fixtures/canonical-scene.json";

describe("canonical scene boundary", () => {
  it("accepts metres and identity quaternion, rejecting non-finite/out-of-bounds or non-unit data", () => {
    expect(CanonicalSpatialSceneSchema.parse(scene)).toEqual(scene);
    for (const replacement of [{ position: [Infinity, 0, 0] }, { position: [31, 0, 0] }, { rotation: [0, 0, 0, 0] }, { scale: [0, 1, 1] }]) {
      expect(CanonicalSpatialSceneSchema.safeParse({ ...scene, objects: [{ ...scene.objects[0], ...replacement }] }).success).toBe(false);
    }
  });
  it("rejects duplicate object identities and unrecognized properties", () => {
    expect(CanonicalSpatialSceneSchema.safeParse({ ...scene, objects: [...scene.objects, ...scene.objects] }).success).toBe(false);
    expect(CanonicalSpatialSceneSchema.safeParse({ ...scene, units: "feet" }).success).toBe(false);
  });
});

describe("legacy XYZ degree adapter", () => {
  it("maps independent quarter turns to XYZW quaternions", () => {
    const half = Math.SQRT1_2;
    for (const [euler, expected] of [[[90, 0, 0], [half, 0, 0, half]], [[0, 90, 0], [0, half, 0, half]], [[0, 0, -90], [0, 0, -half, half]]] as const) {
      const actual = eulerXYZDegreesToQuaternion([...euler]);
      expected.forEach((component, index) => expect(actual[index]).toBeCloseTo(component, 12));
    }
  });
  it("preserves noncommuting XYZ orientation and gimbal-lock rotations on roundtrip", () => {
    for (const angles of [[30, 45, 60], [120, 90, 80], [-45, -90, 10], [180, 0, 0]] as [number, number, number][]) {
      const original = eulerXYZDegreesToQuaternion(angles);
      const roundtrip = eulerXYZDegreesToQuaternion(quaternionToEulerXYZDegrees(original));
      expect(Math.abs(original.reduce((dot, component, index) => dot + component * roundtrip[index], 0))).toBeCloseTo(1, 10);
    }
    const combined = eulerXYZDegreesToQuaternion([90, 90, 0]);
    combined.forEach((component, index) => expect(component).toBeCloseTo([0.5, 0.5, 0.5, 0.5][index], 12));
  });
  it("rejects invalid source rotations instead of normalizing corrupt data", () => {
    expect(() => eulerXYZDegreesToQuaternion([NaN, 0, 0])).toThrow();
    expect(() => quaternionToEulerXYZDegrees([0, 0, 0, 0])).toThrow();
  });
});
