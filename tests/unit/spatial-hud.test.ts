import { describe, expect, it } from "vitest";
import {
  HudPreferencesSchema,
  initialHudState,
  reduceHud,
  readHudPreferences,
  serializeHudPreferences,
  HUD_NAVIGATION,
} from "../../apps/web/src/xr/hud/hud-state";

describe("spatial HUD boundaries", () => {
  it("switches context and retains selection without accepting unknown commands", () => {
    const state = reduceHud(initialHudState(), {
      type: "select-project",
      id: "b83c51a0-56d0-4a97-97a0-cb8f2fb5f832",
    });
    expect(reduceHud(state, { type: "navigate", workspace: "brainstorm" })).toMatchObject({
      workspace: "brainstorm",
      projectId: state.projectId,
    });
    expect(reduceHud(state, { type: "navigate", workspace: "javascript:alert(1)" })).toBe(state);
    expect(reduceHud(state, { type: "select-project", id: "bad" })).toBe(state);
    expect(HUD_NAVIGATION).toHaveLength(10);
  });
  it("rejects nonfinite, behind-viewer and excessive panel offsets", () => {
    const state = initialHudState();
    expect(reduceHud(state, { type: "move-panel", panel: "main", offset: [0, 0, 9] })).toBe(state);
    expect(reduceHud(state, { type: "move-panel", panel: "main", offset: [NaN, 0, 0] })).toBe(
      state,
    );
    const moved = reduceHud(state, { type: "move-panel", panel: "main", offset: [0.1, 0.1, -0.1] });
    expect(moved.preferences.offsets.main).toEqual([0.1, 0.1, -0.1]);
    expect(reduceHud(moved, { type: "reset-layout" }).preferences).toEqual(state.preferences);
  });
  it("persists only nonprivate preferences and recovers corrupt storage", () => {
    const state = reduceHud(initialHudState(), {
      type: "select-project",
      id: "b83c51a0-56d0-4a97-97a0-cb8f2fb5f832",
    });
    const serialized = serializeHudPreferences(state);
    expect(serialized).not.toContain(state.projectId);
    expect(readHudPreferences("{broken")).toEqual(initialHudState().preferences);
    expect(
      HudPreferencesSchema.safeParse({ ...state.preferences, prompt: "private" }).success,
    ).toBe(false);
    expect(readHudPreferences(serialized)).toEqual(state.preferences);
  });
  it("clears private selection while retaining ordinary viewing preferences", () => {
    const state = reduceHud(reduceHud(initialHudState(), { type: "preset", preset: "FOCUSED" }), {
      type: "select-project",
      id: "b83c51a0-56d0-4a97-97a0-cb8f2fb5f832",
    });
    expect(reduceHud(state, { type: "clear-private" })).toMatchObject({
      projectId: null,
      preferences: { preset: "FOCUSED" },
    });
  });
});

import { createHudSurfaces } from "../../apps/web/src/xr/hud/hud-surfaces";
it("focused immersive surfaces always offer layout recovery and session exit", () => {
  const state = reduceHud(initialHudState(), { type: "preset", preset: "FOCUSED" });
  const surfaces = createHudSurfaces({ state, data: null, notice: "", immersive: true });
  expect(surfaces).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ panel: "main", action: "layout:STANDARD" }),
      expect.objectContaining({ panel: "main", action: "exit-vr" }),
    ]),
  );
});
it("read-only projects never offer an inert assistant action", () => {
  const state = reduceHud(initialHudState(), {
    type: "select-project",
    id: "e67ea056-e196-445c-8c9b-55b2058a5d58",
  });
  const data = {
    metrics: {
      activeProjects: 1,
      pendingReviews: 0,
      completedDeliverables: 0,
      upcomingDeadlines: 0,
    },
    projects: [
      {
        id: state.projectId!,
        name: "Read only",
        objective: "Brief",
        clientId: null,
        type: "Campaign",
        status: "active" as const,
        priority: "normal" as const,
        startDate: null,
        dueDate: null,
        clientName: null,
        createdAt: "2026-11-13T00:00:00.000Z",
        updatedAt: "2026-11-13T00:00:00.000Z",
        revision: 1,
        progress: null,
        canEdit: false,
      },
    ],
    tasks: [],
    activity: [],
  };
  expect(
    createHudSurfaces({ state, data, notice: "", immersive: true }).some(
      (surface) => surface.action === "open-assistant",
    ),
  ).toBe(false);
});
it("keeps side panels out of the main workspace's horizontal space", () => {
  const state = initialHudState();
  expect(reduceHud(state, { type: "move-panel", panel: "navigation", offset: [0.1, 0, 0] })).toBe(
    state,
  );
  expect(reduceHud(state, { type: "move-panel", panel: "assistant", offset: [-0.1, 0, 0] })).toBe(
    state,
  );
  expect(reduceHud(state, { type: "move-panel", panel: "main", offset: [0.2, 0, 0] })).toBe(state);
});
