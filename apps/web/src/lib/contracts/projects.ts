import { z } from "zod";

export const ProjectNameSchema = z.string().trim().min(1, "Enter a project name.").max(120, "Use at most 120 characters.");
export const ProjectObjectiveSchema = z.string().trim().min(1, "Enter a project objective.").max(2000, "Use at most 2,000 characters.");

export const CreateProjectSchema = z.strictObject({
  name: ProjectNameSchema,
  objective: ProjectObjectiveSchema,
});

export const UpdateProjectSchema = CreateProjectSchema.partial().refine(
  (value) => value.name !== undefined || value.objective !== undefined,
  { message: "Provide a project name or objective to update." },
);

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
