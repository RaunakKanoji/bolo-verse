import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const clerk = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@clerk/backend", () => ({
  createClerkClient: () => ({ users: { getUser: clerk.getUser } }),
}));
import { verifyReviewRecipient } from "@/server/auth/review-recipient";
afterEach(() => {
  vi.unstubAllEnvs();
  clerk.getUser.mockReset();
});
it("requires configured server authentication before recipient lookup", async () => {
  vi.stubEnv("CLERK_SECRET_KEY", "");
  await expect(verifyReviewRecipient("user_client1")).rejects.toMatchObject({ status: 503 });
  expect(clerk.getUser).not.toHaveBeenCalled();
});
it("accepts only the exact existing active Clerk subject", async () => {
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_private");
  clerk.getUser.mockResolvedValue({ id: "user_client1", banned: false });
  expect(await verifyReviewRecipient("user_client1")).toBe("user_client1");
  expect(clerk.getUser).toHaveBeenCalledWith("user_client1");
});
it.each(["different", "banned", "provider error"])(
  "rejects unavailable recipient: %s without exposing private provider output",
  async (kind) => {
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_private");
    if (kind === "provider error")
      clerk.getUser.mockRejectedValue(new Error("private-provider-details sk_test_private"));
    else
      clerk.getUser.mockResolvedValue({
        id: kind === "different" ? "user_other" : "user_client1",
        banned: kind === "banned",
      });
    await expect(verifyReviewRecipient("user_client1")).rejects.toMatchObject({ status: 400 });
    await verifyReviewRecipient("user_client1").catch((error: Error) =>
      expect(error.message).not.toMatch(/sk_test_private|private-provider-details/),
    );
  },
);
