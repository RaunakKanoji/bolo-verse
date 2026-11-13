import { z } from "zod";
import { ResourceIdSchema } from "./api";
import { BriefPayloadSchema } from "./documents";
import { ProjectNameSchema } from "./projects";

const text = (max: number) => z.string().trim().min(1).max(max);
export const ProjectSubmissionSchema = z.strictObject({
  idempotencyKey: ResourceIdSchema,
  name: ProjectNameSchema,
  description: text(2000),
  brand: text(300),
  contentType: z.enum(["poster", "reel", "script"]),
  audience: text(1000),
  objectives: text(1000),
  deliverables: text(1000),
  channel: text(120),
  deadline: z.iso.date(),
  instructions: z.string().trim().max(1500),
});
export type ProjectSubmission = z.infer<typeof ProjectSubmissionSchema>;
export const ProjectSubmissionResultSchema = z.strictObject({
  projectId: ResourceIdSchema,
  href: z.string(),
});

/** Preserve the current brief v1 format without dropping any client requirements. */
export function submissionBrief(input: ProjectSubmission) {
  return BriefPayloadSchema.parse({
    schemaVersion: 1,
    title: input.name,
    objective: input.objectives,
    audience: input.audience,
    product: input.brand,
    format: input.contentType,
    aspectRatio: input.contentType === "reel" ? "9:16" : "1:1",
    tone: "To be agreed with the client",
    language: "en-IN",
    facts: [],
    prohibitedClaims: [],
    constraints: [
      ...Array.from(input.deliverables.matchAll(/[\s\S]{1,260}/g), ([part]) => `Deliverables: ${part}`),
      ...Array.from(input.instructions.matchAll(/[\s\S]{1,260}/g), ([part]) => `Special instructions: ${part}`),
    ],
    brandRequirements: input.brand,
    channels: [input.channel],
    deadline: input.deadline,
    notes: `Description: ${input.description}\n\nDeliverables: ${input.deliverables}\n\nSpecial instructions: ${input.instructions || "None supplied"}`,
  });
}
