import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  CreateStudioProjectSchema,
  UpdateStudioProjectSchema,
  StudioListQuerySchema,
  CreateStudioClientSchema,
} from "@/lib/contracts/workspace";
describe("workspace input contracts", () => {
  it("rejects foreign authority, invalid date ranges and unknown fields", () => {
    const valid = {
      idempotencyKey: "d1000000-0000-4000-8000-000000000001",
      name: "Campaign",
      objective: "Launch",
      startDate: "2026-11-20",
      dueDate: "2026-11-19",
    };
    expect(CreateStudioProjectSchema.safeParse(valid).success).toBe(false);
    expect(
      CreateStudioProjectSchema.safeParse({
        ...valid,
        dueDate: "2026-11-21",
        workspaceId: valid.idempotencyKey,
      }).success,
    ).toBe(false);
    expect(CreateStudioProjectSchema.safeParse({ ...valid, dueDate: "2026-11-21" }).success).toBe(
      true,
    );
    expect(UpdateStudioProjectSchema.safeParse({ expectedRevision: 1 }).success).toBe(false);
    expect(
      CreateStudioClientSchema.safeParse({
        idempotencyKey: valid.idempotencyKey,
        name: "Client",
        email: "invalid",
      }).success,
    ).toBe(false);
  });
  it("preserves legacy project wire limits", () => {
    const valid = {
      idempotencyKey: "d1000000-0000-4000-8000-000000000001",
      name: "Campaign",
      objective: "Launch",
    };
    expect(CreateStudioProjectSchema.safeParse({ ...valid, name: "x".repeat(121) }).success).toBe(
      false,
    );
    expect(
      CreateStudioProjectSchema.safeParse({ ...valid, objective: "x".repeat(2001) }).success,
    ).toBe(false);
  });
  it("publishes client email as a bounded string while preserving optional email validation", () => {
    const valid = { idempotencyKey: "d1000000-0000-4000-8000-000000000001", name: "Client" };
    const wire = z.toJSONSchema(CreateStudioClientSchema);
    expect(wire.properties?.email).toMatchObject({ type: "string", maxLength: 254 });
    expect(wire.properties?.email).not.toHaveProperty("anyOf");
    expect(CreateStudioClientSchema.parse({ ...valid, email: "" }).email).toBe("");
    expect(CreateStudioClientSchema.parse({ ...valid, email: " client@example.test " }).email).toBe(
      "client@example.test",
    );
    for (const email of ["invalid", "bad@", "a".repeat(255)])
      expect(CreateStudioClientSchema.safeParse({ ...valid, email }).success).toBe(false);
  });
  it("bounds list pagination and accepts only explicit filters", () => {
    expect(StudioListQuerySchema.parse({})).toMatchObject({ limit: 50, offset: 0 });
    for (const query of [
      { limit: "101" },
      { offset: "-1" },
      { status: "deleted" },
      { archived: "no" },
      { unexpected: "value" },
    ])
      expect(StudioListQuerySchema.safeParse(query).success).toBe(false);
  });
});
