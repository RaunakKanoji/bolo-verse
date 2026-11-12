import { z } from "zod";

export const ResourceIdSchema = z.uuid();
export const RequestIdSchema = z.string().trim().min(1).max(128);
export const LanguageSchema = z.enum(["en-IN", "hi-IN", "kn-IN"]);
export type Language = z.infer<typeof LanguageSchema>;

export const ApiErrorSchema = z.strictObject({
  code: z.string().min(1).max(80),
  message: z.string().min(1).max(1000),
  retryable: z.boolean(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export function apiResultSchema<T extends z.ZodType>(data: T) {
  return z.discriminatedUnion("ok", [
    z.strictObject({ ok: z.literal(true), data, requestId: RequestIdSchema }),
    z.strictObject({ ok: z.literal(false), error: ApiErrorSchema, requestId: RequestIdSchema }),
  ]);
}

export type ApiResult<T> =
  | { ok: true; data: T; requestId: string }
  | { ok: false; error: ApiError; requestId: string };
