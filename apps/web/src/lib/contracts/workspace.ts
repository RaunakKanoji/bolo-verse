import { z } from "zod";
import { apiResultSchema } from "./api";
const text = (max: number) => z.string().trim().max(max);
const date = z.iso.date().nullable();
const timestamp = z.iso.datetime();
export const StudioProjectStatusSchema = z.enum(["active", "in_review", "completed", "archived"]);
export const StudioPrioritySchema = z.enum(["low", "normal", "high"]);
export const StudioTaskStatusSchema = z.enum(["todo", "in_progress", "done"]);
const projectFields = {
  name: text(120).min(1),
  objective: text(2000).min(1),
  clientId: z.uuid().nullable(),
  type: text(100).min(1),
  status: StudioProjectStatusSchema,
  priority: StudioPrioritySchema,
  startDate: date,
  dueDate: date,
};
const datesOrdered = (value: { startDate?: string | null; dueDate?: string | null }) =>
  !value.startDate || !value.dueDate || value.startDate <= value.dueDate;
export const CreateStudioProjectSchema = z
  .strictObject({
    idempotencyKey: z.uuid(),
    name: projectFields.name,
    objective: projectFields.objective,
    clientId: projectFields.clientId.default(null),
    type: projectFields.type.default("Custom"),
    priority: projectFields.priority.default("normal"),
    startDate: date.default(null),
    dueDate: date.default(null),
  })
  .refine(datesOrdered, "Due date must follow start date.");
export const UpdateStudioProjectSchema = z
  .strictObject({
    expectedRevision: z.number().int().positive(),
    ...z.object(projectFields).partial().shape,
  })
  .refine((v) => Object.keys(v).length > 1, "Provide an update.")
  .refine(datesOrdered, "Due date must follow start date.");
export const DuplicateStudioProjectSchema = z.strictObject({
  idempotencyKey: z.uuid(),
  name: projectFields.name.optional(),
});
export const StudioProjectSchema = z.strictObject({
  id: z.uuid(),
  ...projectFields,
  clientName: text(160).nullable(),
  createdAt: timestamp,
  updatedAt: timestamp,
  revision: z.number().int().positive(),
  progress: z.number().min(0).max(100).nullable(),
  canEdit: z.boolean(),
});
export type StudioProject = z.infer<typeof StudioProjectSchema>;
const clientFields = {
  name: text(160).min(1),
  organization: text(160),
  email: z
    .string()
    .trim()
    .max(254)
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Provide a valid email address or leave it blank.",
    )
    .describe("Optional contact email; blank or a valid email address, up to 254 characters."),
  phone: text(60),
  notes: text(5000),
};
export const CreateStudioClientSchema = z.strictObject({
  idempotencyKey: z.uuid(),
  name: clientFields.name,
  organization: clientFields.organization.default(""),
  email: clientFields.email.default(""),
  phone: clientFields.phone.default(""),
  notes: clientFields.notes.default(""),
});
export const UpdateStudioClientSchema = z
  .strictObject({
    expectedRevision: z.number().int().positive(),
    ...z.object(clientFields).partial().shape,
  })
  .refine((v) => Object.keys(v).length > 1, "Provide an update.");
export const StudioClientSchema = z.strictObject({
  id: z.uuid(),
  ...clientFields,
  createdAt: timestamp,
  updatedAt: timestamp,
  revision: z.number().int().positive(),
  activeProjects: z.number().int().nonnegative(),
  pendingReviews: z.number().int().nonnegative(),
  lastActivityAt: timestamp.nullable(),
});
export type StudioClient = z.infer<typeof StudioClientSchema>;
const taskFields = {
  title: text(240).min(1),
  status: StudioTaskStatusSchema,
  priority: StudioPrioritySchema,
  dueDate: date,
  ownerLabel: text(160),
};
export const CreateStudioTaskSchema = z.strictObject({
  idempotencyKey: z.uuid(),
  title: taskFields.title,
  priority: taskFields.priority.default("normal"),
  dueDate: date.default(null),
  ownerLabel: taskFields.ownerLabel.default(""),
});
export const UpdateStudioTaskSchema = z
  .strictObject({
    expectedRevision: z.number().int().positive(),
    ...z.object(taskFields).partial().shape,
  })
  .refine((v) => Object.keys(v).length > 1, "Provide an update.");
export const StudioTaskSchema = z.strictObject({
  id: z.uuid(),
  projectId: z.uuid(),
  projectName: text(160),
  ...taskFields,
  revision: z.number().int().positive(),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type StudioTask = z.infer<typeof StudioTaskSchema>;
export const StudioActivitySchema = z.strictObject({
  id: z.string().max(160),
  projectId: z.uuid(),
  projectName: text(160),
  kind: z.enum([
    "project_created",
    "brief_updated",
    "asset_uploaded",
    "review_submitted",
    "feedback",
    "approved",
    "task_created",
    "artifact_saved",
    "concept_saved",
  ]),
  title: text(300),
  createdAt: timestamp,
});
export type StudioActivity = z.infer<typeof StudioActivitySchema>;
export const StudioAssetCategorySchema = z.enum(["image", "video", "audio", "document", "3d"]);
export const StudioAssetSchema = z.strictObject({
  id: z.uuid(),
  projectId: z.uuid(),
  projectName: text(160),
  name: text(200),
  mimeType: text(160),
  category: StudioAssetCategorySchema,
  byteSize: z.number().int().nonnegative(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  createdAt: timestamp,
  contentUrl: z.string().nullable(),
  nativeContentUrl: z.string().nullable(),
  downloadUrl: z.string().nullable(),
  collection: text(120),
  archived: z.boolean(),
  revision: z.number().int().nonnegative(),
  canEdit: z.boolean(),
});
export type StudioAsset = z.infer<typeof StudioAssetSchema>;
export const UpdateStudioAssetSchema = z
  .strictObject({
    expectedRevision: z.number().int().nonnegative(),
    collection: text(120).optional(),
    archived: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 1, "Provide an update.");
export const StudioListQuerySchema = z.strictObject({
  search: text(160).optional(),
  status: StudioProjectStatusSchema.optional(),
  clientId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  type: text(100).optional(),
  sort: z.enum(["updated", "name", "due"]).default("updated"),
  category: StudioAssetCategorySchema.optional(),
  collection: text(120).optional(),
  archived: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
});
export type StudioListQuery = z.infer<typeof StudioListQuerySchema>;
export const StudioMetricsSchema = z.strictObject({
  activeProjects: z.number().int().nonnegative(),
  pendingReviews: z.number().int().nonnegative(),
  completedDeliverables: z.number().int().nonnegative(),
  upcomingDeadlines: z.number().int().nonnegative(),
});
export const StudioProjectListSchema = z.strictObject({
  projects: z.array(StudioProjectSchema).max(100),
  total: z.number().int().nonnegative(),
});
export const StudioProjectDetailSchema = z.strictObject({
  project: StudioProjectSchema,
  canEdit: z.boolean(),
  tasks: z.array(StudioTaskSchema).max(100),
  activity: z.array(StudioActivitySchema).max(50),
});
export const StudioOverviewSchema = z.strictObject({
  metrics: StudioMetricsSchema,
  projects: z.array(StudioProjectSchema).max(100),
  tasks: z.array(StudioTaskSchema).max(100),
  activity: z.array(StudioActivitySchema).max(50),
});
export const StudioClientListSchema = z.strictObject({
  clients: z.array(StudioClientSchema).max(100),
  total: z.number().int().nonnegative(),
});
export const StudioClientDetailSchema = z.strictObject({
  client: StudioClientSchema,
  projects: z.array(StudioProjectSchema).max(100),
  activity: z.array(StudioActivitySchema).max(50),
});
export const StudioAssetListSchema = z.strictObject({
  assets: z.array(StudioAssetSchema).max(100),
  total: z.number().int().nonnegative(),
});
export const StudioOverviewResponseSchema = apiResultSchema(StudioOverviewSchema);
export type StudioOverview = z.infer<typeof StudioOverviewSchema>;
export const StudioProjectMutationSchema = z.strictObject({ project: StudioProjectSchema });
export const StudioClientMutationSchema = z.strictObject({ client: StudioClientSchema });
export const StudioTaskMutationSchema = z.strictObject({ task: StudioTaskSchema });
export const StudioAssetMutationSchema = z.strictObject({ asset: StudioAssetSchema });
