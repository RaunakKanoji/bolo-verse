import { z } from "zod";
import { XRTransformSchema, type XRTransform } from "@/lib/contracts/xr-workspace";

const axis = z.enum(["x", "y", "z"]);
export const TransformActionSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("move"), axis, amount: z.number().min(-30).max(30) }),
  z.strictObject({ type: z.literal("rotate"), axis, amount: z.number().min(-360).max(360) }),
  z.strictObject({ type: z.literal("scale"), factor: z.number().min(0.1).max(10) }),
  z.strictObject({ type: z.literal("reset"), transform: XRTransformSchema }),
]);
export type TransformAction = z.infer<typeof TransformActionSchema>;

const axisIndex = { x: 0, y: 1, z: 2 } as const;
const bounded = (value: number, minimum: number, maximum: number) =>
  Math.round(Math.min(maximum, Math.max(minimum, value)) * 1e6) / 1e6;

/** One deterministic path for accessible controls and controller-ray actions. */
export function applyTransformAction(current: unknown, input: TransformAction): XRTransform {
  const next = XRTransformSchema.parse(current);
  const action = TransformActionSchema.parse(input);
  if (action.type === "reset") return XRTransformSchema.parse(action.transform);
  if (action.type === "move") {
    const index = axisIndex[action.axis];
    next.position[index] = bounded(next.position[index] + action.amount, -30, 30);
  } else if (action.type === "rotate") {
    const index = axisIndex[action.axis];
    next.rotation[index] = bounded(next.rotation[index] + action.amount, -360, 360);
  } else {
    next.scale = next.scale.map((value) =>
      bounded(value * action.factor, 0.1, 10),
    ) as XRTransform["scale"];
  }
  return XRTransformSchema.parse(next);
}

export const SPATIAL_TRANSFORM_ACTIONS: readonly {
  id: string;
  label: string;
  action: Exclude<TransformAction, { type: "reset" }>;
}[] = [
  { id: "left", label: "Left", action: { type: "move", axis: "x", amount: -0.25 } },
  { id: "right", label: "Right", action: { type: "move", axis: "x", amount: 0.25 } },
  { id: "up", label: "Up", action: { type: "move", axis: "y", amount: 0.25 } },
  { id: "down", label: "Down", action: { type: "move", axis: "y", amount: -0.25 } },
  { id: "forward", label: "Further", action: { type: "move", axis: "z", amount: -0.25 } },
  { id: "back", label: "Closer", action: { type: "move", axis: "z", amount: 0.25 } },
  { id: "rotate-left", label: "Turn left", action: { type: "rotate", axis: "y", amount: -15 } },
  { id: "rotate-right", label: "Turn right", action: { type: "rotate", axis: "y", amount: 15 } },
  { id: "grow", label: "Larger", action: { type: "scale", factor: 1.1 } },
  { id: "shrink", label: "Smaller", action: { type: "scale", factor: 1 / 1.1 } },
];
