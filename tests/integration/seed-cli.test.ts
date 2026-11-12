import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";

it("loads the server-only seed CLI and refuses an invalid identity before provider access", () => {
  const result = spawnSync("npm", ["run", "db:seed", "--", "invalid-subject"], {
    encoding: "utf8", timeout: 15_000,
  });
  expect(result.status).toBe(1);
  expect(result.stderr.trim()).toBe("Usage: npm run db:seed -- user_<existing Clerk subject>");
});
