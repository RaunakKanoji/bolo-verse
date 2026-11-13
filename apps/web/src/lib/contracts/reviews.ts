import { z } from "zod";
const id = z.uuid();
const time = z.iso.datetime();
export const ShareReviewSchema = z.strictObject({
  reviewerId: z
    .string()
    .regex(/^user_[A-Za-z0-9]+$/)
    .max(255),
  idempotencyKey: id,
  expiresInDays: z.int().min(1).max(30).optional(),
});
export type ShareReviewRequest = z.infer<typeof ShareReviewSchema>;
export type ShareReview = ShareReviewRequest & { expiresInDays: number };
const binding = { grantId: id, expectedVersion: z.int().positive(), idempotencyKey: id };
export const ReviewCommentInputSchema = z.strictObject({
  ...binding,
  comment: z.string().trim().min(1).max(2000),
  timecodeSeconds: z.number().finite().min(0).max(600).optional(),
});
export const ReviewDecisionInputSchema = z.strictObject({
  ...binding,
  decision: z.enum(["approved", "changes_requested"]),
  comment: z.string().trim().max(2000).optional(),
});
export type ReviewCommentInput = z.infer<typeof ReviewCommentInputSchema>;
export type ReviewDecisionInput = z.infer<typeof ReviewDecisionInputSchema>;
export const RevokeReviewSchema = z.strictObject({});
export const ReviewCommentSchema = z.strictObject({
  id,
  grantId: id.nullable(),
  comment: z.string().max(2000),
  timecodeSeconds: z.number().finite().nonnegative().nullable(),
  createdAt: time,
});
export const ReviewDecisionSchema = z.strictObject({
  id,
  grantId: id.nullable(),
  decision: z.enum(["approved", "changes_requested"]),
  comment: z.string().max(2000).nullable(),
  createdAt: time,
});
export const ReviewGrantSchema = z.strictObject({
  grantId: id,
  reviewId: id,
  expiresAt: time,
  revokedAt: time.nullable(),
  createdAt: time,
  active: z.boolean(),
  reviewUrl: z.string().regex(/^\/reviews\/[0-9a-f-]{36}$/),
});
export const ReviewGrantResultSchema = z.strictObject({ grant: ReviewGrantSchema });
export const ReviewSummarySchema = z.strictObject({
  reviewId: id,
  grantId: id,
  version: z.int().positive(),
  title: z.string().max(120),
  expiresAt: time,
  decision: ReviewDecisionSchema.nullable(),
});
export const ReviewDetailSchema = z
  .strictObject({
    reviewId: id,
    grantId: id,
    version: z.int().positive(),
    title: z.string().max(120),
    caption: z.string().max(1000),
    publishedAt: time,
    expiresAt: time,
    preview: z.strictObject({
      url: z.string().regex(/^\/api\/v1\/reviews\/[0-9a-f-]{36}\/content$/),
      mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
      byteSize: z.int().positive().max(20971520),
      width: z.int().positive().max(8192),
      height: z.int().positive().max(8192),
    }),
    comments: z.array(ReviewCommentSchema).max(100),
    decision: ReviewDecisionSchema.nullable(),
    history: z.array(ReviewSummarySchema).max(50).optional(),
  })
  .refine(
    (value) =>
      value.preview.url === `/api/v1/reviews/${value.reviewId}/content` &&
      value.preview.width * value.preview.height <= 16777216,
  );
export type ReviewDetail = z.infer<typeof ReviewDetailSchema>;
export const ReviewResultSchema = z.strictObject({ review: ReviewDetailSchema });
export const ReviewInboxSchema = z.strictObject({
  reviews: z.array(ReviewSummarySchema).max(50),
  hasMore: z.boolean(),
});
export const ReviewFeedbackSchema = z.strictObject({
  reviewId: id,
  version: z.int().positive(),
  grants: z.array(ReviewGrantSchema).max(50),
  comments: z.array(ReviewCommentSchema).max(100),
  decisions: z.array(ReviewDecisionSchema).max(100),
  latestDecision: ReviewDecisionSchema.nullable(),
});
export const ReviewFeedbackResultSchema = z.strictObject({ feedback: ReviewFeedbackSchema });
