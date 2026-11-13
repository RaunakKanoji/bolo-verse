import { z } from "zod";
import { apiResultSchema } from "./api";
const text = (max: number) => z.string().trim().min(1).max(max);
const revision = z.int().min(0).max(2_147_483_646);
export const BrainstormConceptSchema = z.strictObject({
  title: text(120),
  targetAudience: text(400),
  coreMessage: text(600),
  contentFormat: text(160),
  creativeDirection: text(1000),
  productionRequirements: z.array(text(200)).max(8),
  nextSteps: z.array(text(200)).max(8),
});
export const BrainstormStudioContentSchema = z.strictObject({
  reply: text(6000),
  concepts: z.array(BrainstormConceptSchema).min(1).max(3),
});
export type BrainstormStudioContent = z.infer<typeof BrainstormStudioContentSchema>;
export const CreateBrainstormSessionSchema = z.strictObject({
  idempotencyKey: z.uuid(),
  title: text(120),
  projectId: z.uuid().optional(),
});
export const UpdateBrainstormSessionSchema = z
  .strictObject({
    idempotencyKey: z.uuid(),
    expectedRevision: revision,
    title: text(120).optional(),
    pinned: z.boolean().optional(),
    projectId: z.uuid().nullable().optional(),
  })
  .refine((v) => v.title !== undefined || v.pinned !== undefined || v.projectId !== undefined);
export const SendBrainstormMessageSchema = z.strictObject({
  idempotencyKey: z.uuid(),
  expectedRevision: revision,
  message: text(2000),
});
export const SaveBrainstormIdeaSchema = z.strictObject({
  idempotencyKey: z.uuid(),
  expectedRevision: revision,
  title: text(120),
  description: text(4000),
  tags: z.array(text(40)).max(8),
  category: z.enum(["idea", "concept", "direction", "outline", "action"]),
  sourceMessageId: z.uuid().optional(),
});
export const BrainstormSessionSchema = z.strictObject({
  id: z.uuid(),
  title: text(120),
  projectId: z.uuid().nullable(),
  pinned: z.boolean(),
  revision,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type BrainstormSession = z.infer<typeof BrainstormSessionSchema>;
export const BrainstormMessageSchema = z.strictObject({
  id: z.uuid(),
  sessionId: z.uuid(),
  message: text(2000),
  status: z.enum(["pending", "completed", "uncertain"]),
  content: BrainstormStudioContentSchema.nullable(),
  createdAt: z.iso.datetime(),
});
export type BrainstormMessage = z.infer<typeof BrainstormMessageSchema>;
export const BrainstormIdeaSchema = z.strictObject({
  id: z.uuid(),
  sessionId: z.uuid(),
  title: text(120),
  description: text(4000),
  tags: z.array(text(40)).max(8),
  category: z.enum(["idea", "concept", "direction", "outline", "action"]),
  sourceMessageId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
});
export type BrainstormIdea = z.infer<typeof BrainstormIdeaSchema>;
export const BrainstormSessionListSchema = z.strictObject({
  sessions: z.array(BrainstormSessionSchema).max(100),
});
export const BrainstormSessionDetailSchema = z.strictObject({
  session: BrainstormSessionSchema,
  messages: z.array(BrainstormMessageSchema).max(40),
  ideas: z.array(BrainstormIdeaSchema).max(100),
});
export type BrainstormSessionDetail = z.infer<typeof BrainstormSessionDetailSchema>;
export const BrainstormSessionResponseSchema = apiResultSchema(
  z.strictObject({ session: BrainstormSessionSchema }),
);
export const BrainstormSessionsResponseSchema = apiResultSchema(BrainstormSessionListSchema);
export const BrainstormDetailResponseSchema = apiResultSchema(BrainstormSessionDetailSchema);
export const BrainstormIdeaResponseSchema = apiResultSchema(
  z.strictObject({ session: BrainstormSessionSchema, idea: BrainstormIdeaSchema }),
);
export const BrainstormMessageResponseSchema = apiResultSchema(
  z.strictObject({ session: BrainstormSessionSchema, message: BrainstormMessageSchema }),
);
