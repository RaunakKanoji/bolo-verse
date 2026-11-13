import { describe, expect, it } from "vitest";
import {
  filterProjects,
  safeAssetUrl,
} from "../../apps/web/src/features/platform/workspace-view-model";
describe("creator workspace views", () => {
  const rows = [
    {
      id: "a",
      name: "Launch",
      objective: "Film",
      status: "active",
      clientId: null,
      type: "Video Production",
      dueDate: "2026-12-03",
      updatedAt: "2026-11-13T00:00:00Z",
    },
    {
      id: "b",
      name: "Archived logo",
      objective: "Brand",
      status: "archived",
      clientId: "client",
      type: "Brand Identity",
      dueDate: null,
      updatedAt: "2026-11-12T00:00:00Z",
    },
    {
      id: "c",
      name: "Autumn",
      objective: "Launch film",
      status: "completed",
      clientId: "client",
      type: "Video Production",
      dueDate: "2026-11-20",
      updatedAt: "2026-11-11T00:00:00Z",
    },
  ];
  it("combines search, client, type and status while keeping archive explicit", () => {
    expect(
      filterProjects(rows, {
        search: "film",
        status: "all",
        clientId: "client",
        type: "Video Production",
        sort: "updated",
      }).map((p) => p.id),
    ).toEqual(["c"]);
    expect(
      filterProjects(rows, { search: "", status: "all", clientId: "", type: "", sort: "name" }).map(
        (p) => p.id,
      ),
    ).toEqual(["c", "a"]);
    expect(
      filterProjects(rows, {
        search: "",
        status: "archived",
        clientId: "",
        type: "",
        sort: "name",
      }).map((p) => p.id),
    ).toEqual(["b"]);
  });
  it("sorts deadlines with undated projects last without mutating records", () => {
    expect(
      filterProjects(rows, { search: "", status: "all", clientId: "", type: "", sort: "due" }).map(
        (p) => p.id,
      ),
    ).toEqual(["c", "a"]);
    expect(rows.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });
  it("only renders authenticated same-origin asset content paths", () => {
    expect(safeAssetUrl("https://storage.example/secret-key")).toBeNull();
    expect(safeAssetUrl("//evil.example/file")).toBeNull();
    expect(
      safeAssetUrl("/api/v1/workspace/assets/e67ea056-e196-445c-8c9b-55b2058a5d58/download"),
    ).toBe("/api/v1/workspace/assets/e67ea056-e196-445c-8c9b-55b2058a5d58/download");
    expect(
      safeAssetUrl(
        "/api/v1/workspace/assets/e67ea056-e196-445c-8c9b-55b2058a5d58/download?secret=x",
      ),
    ).toBeNull();
    expect(safeAssetUrl("/api/v1/assets/e67ea056-e196-445c-8c9b-55b2058a5d58/content")).toBe(
      "/api/v1/assets/e67ea056-e196-445c-8c9b-55b2058a5d58/content",
    );
  });
});
