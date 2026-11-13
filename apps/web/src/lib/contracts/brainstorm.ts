import { z } from "zod";
import { apiResultSchema } from "./api";

const text = (max: number) => z.string().trim().min(1).max(max);
export const BrainstormRequestSchema = z.strictObject({
  message: text(2000),
  briefVersion: z.int().min(1).max(2_147_483_647).optional(),
});
export type BrainstormRequest = z.infer<typeof BrainstormRequestSchema>;
export const CreativeDirectionSchema = z.strictObject({
  name: text(80), concept: text(600), visualDirection: text(400),
  proposedDeliverable: text(200), productionSuggestion: text(400),
});
export type CreativeDirection = z.infer<typeof CreativeDirectionSchema>;
export const BrainstormContentSchema = z.strictObject({
  reply: text(2000), directions: z.array(CreativeDirectionSchema).length(3),
});
export const BrainstormResultSchema = z.strictObject({
  reply: text(6000), directions: z.array(CreativeDirectionSchema).max(3),
  format: z.enum(["structured", "plain_text"]),
  sourceBriefVersion: z.int().min(1).max(2_147_483_647),
  providerStatus: z.literal("live"),
}).refine((value) => value.format === "structured" ? value.directions.length === 3 : value.directions.length === 0);
export type BrainstormResult = z.infer<typeof BrainstormResultSchema>;
export const BrainstormResponseSchema = apiResultSchema(BrainstormResultSchema);

/** No HTML/Markdown execution and no URL fetching. Redact obvious secret material before transmission/display. */
export function redactBrainstormText(text: string, secrets: string[] = []): string {
  let result = text
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g, "[redacted]")
    .replace(/(?:https?|postgres(?:ql)?|s3|r2):\/\/[^\s<>"\\]+/gi, "[URL omitted]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+/gi, "[redacted]")
    .replace(/\b(?:AIza[A-Za-z0-9_-]{20,}|sk_(?:live|test)_[A-Za-z0-9_-]+|AKIA[A-Z0-9]{16})\b/g, "[redacted]")
    .replace(/\b(?:api[_ -]?key|secret|password|token)\s*[:=]\s*[^\s,;]+/gi, "[redacted]");
  for (const secret of secrets) if (secret.length >= 8) result = result.split(secret).join("[redacted]");
  return result;
}
