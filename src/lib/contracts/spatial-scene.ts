import { z } from "zod";

/** Canonical scene: right-handed coordinates, +Y up, metres; forward is -Z. */
const vector = (min: number, max: number) => z.tuple([
  z.number().finite().min(min).max(max), z.number().finite().min(min).max(max), z.number().finite().min(min).max(max),
]);
const EulerXYZDegreesSchema = vector(-360, 360);
export const QuaternionXYZWSchema = z.tuple([
  z.number().finite().min(-1).max(1), z.number().finite().min(-1).max(1),
  z.number().finite().min(-1).max(1), z.number().finite().min(-1).max(1),
]).refine((q) => Math.abs(q.reduce((length, value) => length + value * value, 0) - 1) <= 1e-6, "Rotation must be a unit XYZW quaternion.");
export const CanonicalSpatialObjectSchema = z.strictObject({
  id: z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/), assetId: z.uuid(),
  position: vector(-30, 30), rotation: QuaternionXYZWSchema, scale: vector(0.1, 10), visible: z.boolean(),
});
export const CanonicalSpatialSceneSchema = z.strictObject({
  sceneId: z.uuid(), version: z.literal(1), objects: z.array(CanonicalSpatialObjectSchema).max(50),
}).refine(({ objects }) => new Set(objects.map(({ id }) => id)).size === objects.length, "Object IDs must be unique.");
export type QuaternionXYZW = z.infer<typeof QuaternionXYZWSchema>;
export type CanonicalSpatialScene = z.infer<typeof CanonicalSpatialSceneSchema>;

/** Pure adapter only. Does not read, migrate or overwrite stored legacy layouts. */
export function eulerXYZDegreesToQuaternion(input: [number, number, number]): QuaternionXYZW {
  const [x, y, z] = EulerXYZDegreesSchema.parse(input).map((angle) => angle * Math.PI / 360);
  const c1 = Math.cos(x), c2 = Math.cos(y), c3 = Math.cos(z);
  const s1 = Math.sin(x), s2 = Math.sin(y), s3 = Math.sin(z);
  return QuaternionXYZWSchema.parse([
    s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3,
    c1 * c2 * s3 + s1 * s2 * c3, c1 * c2 * c3 - s1 * s2 * s3,
  ]);
}

/** Returns one equivalent XYZ Euler representation; angles are not unique at gimbal lock. */
export function quaternionToEulerXYZDegrees(input: QuaternionXYZW): [number, number, number] {
  const [x, y, z, w] = QuaternionXYZWSchema.parse(input);
  const m11 = 1 - 2 * (y * y + z * z), m12 = 2 * (x * y - z * w), m13 = 2 * (x * z + y * w);
  const m22 = 1 - 2 * (x * x + z * z), m23 = 2 * (y * z - x * w);
  const m32 = 2 * (y * z + x * w), m33 = 1 - 2 * (x * x + y * y);
  const angles: [number, number, number] = Math.abs(m13) < 0.9999999
    ? [Math.atan2(-m23, m33), Math.asin(Math.max(-1, Math.min(1, m13))), Math.atan2(-m12, m11)]
    : [Math.atan2(m32, m22), Math.asin(Math.max(-1, Math.min(1, m13))), 0];
  return angles.map((angle) => angle * 180 / Math.PI) as [number, number, number];
}
