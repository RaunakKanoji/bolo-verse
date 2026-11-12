import { expect, it } from "vitest";
import { createPlaygroundStore } from "@/features/playground/playground-state";

it("keeps mode prompts separate and isolates independent project workspaces", () => {
  const first = createPlaygroundStore();
  const second = createPlaygroundStore();
  first.getState().setPrompt("image", "A new campaign");
  first.getState().setMode("video");
  first.getState().setPrompt("video", "A short film");
  first.getState().setMode("image");
  expect(first.getState().document.prompts).toMatchObject({
    image: "A new campaign",
    video: "A short film",
  });
  expect(second.getState().document.prompts.image).toBe("");
});

it("captures detached bounded local edits and restores actual adjustments", () => {
  const store = createPlaygroundStore();
  store.getState().setEdits({ brightness: 130 });
  store.getState().capture();
  const first = store.getState().snapshots[0].id;
  store.getState().setEdits({ brightness: 80, rotation: 90 });
  store.getState().restore(first);
  expect(store.getState().edits.brightness).toBe(130);
  expect(store.getState().edits.rotation).toBe(0);
  for (let i = 0; i < 12; i++) store.getState().capture();
  expect(store.getState().snapshots).toHaveLength(8);
  store.getState().resetSource();
  expect(store.getState().snapshots).toHaveLength(0);
  expect(store.getState().edits.brightness).toBe(100);
});

it("refuses unsafe image state and clamps viewport transforms", () => {
  const store = createPlaygroundStore();
  expect(() => store.getState().setEdits({ rotation: 45 as 90 })).toThrow();
  store.getState().setZoom(200);
  store.getState().setPan(1e20, -1e20);
  expect(store.getState().zoom).toBe(4);
  expect(store.getState().pan).toEqual({ x: 1500, y: -1500 });
  store.getState().fit();
  expect(store.getState().zoom).toBe(1);
  expect(store.getState().pan).toEqual({ x: 0, y: 0 });
});
