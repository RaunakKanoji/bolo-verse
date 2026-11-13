import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { clerkWebConfigured } from "@/lib/auth/configured";
describe("Clerk web auth readiness", () => {
  it("requires both real Clerk keys, independently of database setup", () => {
    expect(clerkWebConfigured({})).toBe(false);
    expect(clerkWebConfigured({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_public" })).toBe(false);
    expect(
      clerkWebConfigured({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: " ",
        CLERK_SECRET_KEY: "sk_test_private",
      }),
    ).toBe(false);
    expect(
      clerkWebConfigured({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_public",
        CLERK_SECRET_KEY: "sk_test_private",
      }),
    ).toBe(true);
  });
});
