import { describe, expect, it } from "vitest";
import { beginSave, createEditorState, editObject, placeAsset, redo, resolveSave, undo, reloadScene, isDirty, validateSnapshot } from "../src/editor/state";
import type { SpatialSceneSnapshot } from "@shape/scene-schema";

const projectId = "11111111-1111-4111-8111-111111111111";
const assetId = "22222222-2222-4222-8222-222222222222";
const initial: SpatialSceneSnapshot = { projectId, sceneId: projectId, revision: 0, document: { sceneId: projectId, version: 1, objects: [] }, canEdit: true, updatedAt: null };

describe("canonical editor state", () => {
  it("places stable IDs and restores edits through undo/redo", () => {
    const placed = placeAsset(createEditorState(initial), assetId, "object_1");
    const moved = editObject(placed, "object_1", { position: [1, 2, 3] });
    expect(moved.document.objects[0].position).toEqual([1, 2, 3]);
    expect(undo(moved).document.objects[0].position).toEqual([0, 0, 0]);
    expect(redo(undo(moved)).document.objects[0].id).toBe("object_1");
    expect(initial.document.objects).toEqual([]);
  });
  it("rejects bounds, duplicate IDs and read-only mutations without altering data", () => {
    const placed = placeAsset(createEditorState(initial), assetId, "object_1");
    expect(() => editObject(placed, "object_1", { position: [31, 0, 0] })).toThrow();
    expect(() => editObject(placed, "object_1", { rotation: [0, 0, 0, 0] })).toThrow();
    expect(() => placeAsset(placed, assetId, "object_1")).toThrow();
    expect(() => placeAsset(createEditorState({ ...initial, canEdit: false }), assetId, "object_1")).toThrow(/read.only/i);
  });
  it("saves an immutable revision snapshot while preserving subsequent edits", () => {
    const placed = placeAsset(createEditorState(initial), assetId, "object_1");
    const { state: saving, request } = beginSave(placed, "save_1");
    const moved = editObject(saving, "object_1", { position: [3, 0, 0] });
    expect(request.expectedRevision).toBe(0);
    expect(request.document.objects[0].position).toEqual([0, 0, 0]);
    const saved = resolveSave(moved, "save_1", { ...initial, revision: 1, document: request.document });
    expect(saved.snapshot.revision).toBe(1);
    expect(saved.document.objects[0].position).toEqual([3, 0, 0]);
    expect(isDirty(saved)).toBe(true);
    expect(resolveSave(saved, "save_1", { ...initial, revision: 0 })).toBe(saved);
  });
  it("retains local work on conflict and reloads only after an explicit discard", () => {
    const placed = placeAsset(createEditorState(initial), assetId, "object_1");
    const { state } = beginSave(placed, "save_1");
    const conflict = resolveSave(state, "save_1", "conflict");
    expect(conflict.status).toBe("conflict");
    expect(conflict.document).toEqual(placed.document);
    expect(() => reloadScene(conflict, { ...initial, revision: 4 }, false)).toThrow(/discard/i);
    const reloaded = reloadScene(conflict, { ...initial, revision: 4 }, true);
    expect(reloaded.document.objects).toEqual([]);
    expect(isDirty(reloaded)).toBe(false);
  });
  it("rejects foreign scene identity and stale reloads", () => {
    expect(() => validateSnapshot({ ...initial, sceneId: assetId })).toThrow(/project/i);
    const latest = createEditorState({ ...initial, revision: 4 });
    expect(() => reloadScene(latest, { ...initial, revision: 3 }, true)).toThrow(/stale/i);
  });
  it("rejects a mismatched save reply without clearing local work", () => {
    const placed = placeAsset(createEditorState(initial), assetId, "object_1");
    const { state } = beginSave(placed, "save_1");
    const invalidReply = resolveSave(state, "save_1", { ...initial, revision: 1 });
    expect(invalidReply.status).toBe("error");
    expect(invalidReply.document).toEqual(placed.document);
    expect(isDirty(invalidReply)).toBe(true);
  });
});
