import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const fixtures = vi.hoisted(() => ({
  claim: null as unknown,
  authorized: true,
  marked: false,
  stored: false,
  failure: "",
  submits: 0,
  writes: 0,
  revocation: "",
  outputKey: "",
  configured: true,
  existing: null as unknown,
  status: "processing",
}));
vi.mock("@/server/db/video-editor", () => ({
  createVideoRender: async () => ({ id: "job" }),
  findVideoRenderRequest: async () => fixtures.existing,
  claimVideoRender: async () => fixtures.claim,
  readVideoRenderClaim: async () => (fixtures.authorized ? fixtures.claim : null),
  markVideoRenderDispatch: async () => {
    fixtures.marked = true;
    return true;
  },
  recordVideoProviderJob: async () => {
    fixtures.stored = true;
    return true;
  },
  releaseVideoRenderLease: async () => undefined,
  failVideoRender: async (_claim: unknown, code: string) => {
    fixtures.failure = code;
    return true;
  },
  readVideoRender: async () => ({
    id: "job",
    status: fixtures.status,
    failureCode: fixtures.failure,
  }),
  completeVideoRender: async () => ({ id: "job" }),
}));
vi.mock("@/server/providers/shotstack", () => ({
  getVideoEditorCapabilities: () => ({
    availability: fixtures.configured ? "configured" : "disabled",
    environment: fixtures.configured ? "sandbox" : null,
  }),
  createShotstackProvider: () => ({
    submit: async () => {
      fixtures.submits++;
      if (fixtures.revocation === "submit") fixtures.authorized = false;
      if (fixtures.revocation === "uncertain") throw new Error("secret provider URL");
      return { providerJobId: "provider" };
    },
    poll: async () => ({ status: "ready", outputUrl: "secret-url" }),
  }),
}));
vi.mock("@/server/providers/shotstack-media", () => ({
  readAuthorizedShotstackSource: async () => {
    if (fixtures.revocation === "source") fixtures.authorized = false;
    return { assetId: "source", url: "secret-url" };
  },
  readShotstackOutput: async () => {
    if (fixtures.revocation === "output") fixtures.authorized = false;
    return { bytes: new Uint8Array(3), checksumSha256: "a".repeat(64), mimeType: "video/mp4" };
  },
  writeShotstackOutput: async ({ objectKey }: { objectKey: string }) => {
    fixtures.writes++;
    fixtures.outputKey = objectKey;
  },
}));
import { submitVideoRender, refreshVideoRender } from "@/server/services/video-editor";
beforeEach(() => {
  Object.assign(fixtures, {
    claim: {
      subject: "actor",
      job: { id: "job", projectId: "project", providerJobId: "provider" },
      request: { environment: "sandbox", document: {}, sourceSnapshot: [{ id: "source" }] },
    },
    authorized: true,
    marked: false,
    stored: false,
    failure: "",
    submits: 0,
    writes: 0,
    revocation: "",
    outputKey: "",
    configured: true,
    existing: null,
    status: "processing",
  });
});
it("checks access after source signing before durable dispatch intent", async () => {
  fixtures.revocation = "source";
  await submitVideoRender("actor", "project", {} as never);
  expect(fixtures.marked).toBe(false);
  expect(fixtures.submits).toBe(0);
  expect(fixtures.failure).toBe("ACCESS_CHANGED");
});
it("retains uncertain dispatch as a safe failure without a second provider call", async () => {
  fixtures.revocation = "uncertain";
  const result = await submitVideoRender("actor", "project", {} as never);
  expect(fixtures.marked).toBe(true);
  expect(fixtures.submits).toBe(1);
  expect(result.failureCode).toBe("SHOTSTACK_DISPATCH_UNCERTAIN");
  expect(JSON.stringify(result)).not.toContain("secret");
});
it("checks access after provider and before storing a private provider reference", async () => {
  fixtures.revocation = "submit";
  await submitVideoRender("actor", "project", {} as never);
  expect(fixtures.submits).toBe(1);
  expect(fixtures.stored).toBe(false);
  expect(fixtures.failure).toBe("ACCESS_CHANGED");
});
it("refresh never renders and checks access before private output write", async () => {
  fixtures.revocation = "output";
  await refreshVideoRender("actor", "project", "job");
  expect(fixtures.submits).toBe(0);
  expect(fixtures.writes).toBe(0);
  expect(fixtures.failure).toBe("ACCESS_CHANGED");
});
it("imports only verified bytes and uses a content addressed private output", async () => {
  await refreshVideoRender("actor", "project", "job");
  expect(fixtures.submits).toBe(0);
  expect(fixtures.writes).toBe(1);
  expect(fixtures.outputKey).toBe(`private/recordings/project/job/${"a".repeat(64)}.mp4`);
});

it("returns the same existing idempotent job after provider configuration is disabled", async () => {
  fixtures.configured = false;
  fixtures.existing = { id: "job", status: "processing" };
  expect(await submitVideoRender("actor", "project", {} as never)).toEqual(fixtures.existing);
  expect(fixtures.marked).toBe(false);
  expect(fixtures.submits).toBe(0);
});
it("returns terminal refresh state without requiring any provider configuration", async () => {
  fixtures.configured = false;
  fixtures.status = "ready";
  expect(await refreshVideoRender("actor", "project", "job")).toMatchObject({
    id: "job",
    status: "ready",
  });
  expect(fixtures.writes).toBe(0);
  expect(fixtures.submits).toBe(0);
});
