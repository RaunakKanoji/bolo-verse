import { expect, it } from "vitest";
import {
  ShareReviewSchema,
  ReviewCommentInputSchema,
  ReviewDecisionInputSchema,
} from "@/lib/contracts/reviews";
const id = "11111111-1111-4111-8111-111111111111";
it("strictly binds review mutations to a grant, version and retry key", () => {
  const input = { grantId: id, expectedVersion: 1, idempotencyKey: id };
  expect(ReviewDecisionInputSchema.parse({ ...input, decision: "approved" }).decision).toBe(
    "approved",
  );
  for (const patch of [
    { actorId: "forged" },
    { expectedVersion: 0 },
    { decision: "approve" },
    { token: "secret" },
  ])
    expect(
      ReviewDecisionInputSchema.safeParse({ ...input, decision: "approved", ...patch }).success,
    ).toBe(false);
  expect(ReviewCommentInputSchema.safeParse({ ...input, comment: "x".repeat(2001) }).success).toBe(
    false,
  );
  expect(ReviewCommentInputSchema.safeParse({ ...input, comment: " " }).success).toBe(false);
  expect(
    ShareReviewSchema.safeParse({
      reviewerId: "user_client1",
      idempotencyKey: id,
      expiresInDays: 31,
    }).success,
  ).toBe(false);
  expect(
    ShareReviewSchema.safeParse({
      reviewerId: "user_client1",
      idempotencyKey: id,
      token: "public-link",
    }).success,
  ).toBe(false);
});
