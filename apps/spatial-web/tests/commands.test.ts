import { describe, expect, it } from "vitest";
import { dispatchEditorCommand } from "../src/editor/commands";
import { beginSave, createEditorState, isDirty } from "../src/editor/state";
import type { SpatialSceneSnapshot } from "@shape/scene-schema";

const projectId = "11111111-1111-4111-8111-111111111111";
const assetId = "22222222-2222-4222-8222-222222222222";
const initial: SpatialSceneSnapshot = { projectId, sceneId: projectId, revision: 0, document: { sceneId: projectId, version: 1, objects: [] }, canEdit: true, updatedAt: null };
const run = (state = createEditorState(initial), input: unknown = { type: "PLACE_ASSET", assetId, objectId: "one" }, catalog = [assetId]) => dispatchEditorCommand(state, input, catalog);

describe("canonical editor command adapter", () => {
  it("uses the same undoable transform state and never saves implicitly", () => {
    const placed = run();
    expect(placed.selectedId).toBe("one");
    const moved = run(placed.state, { type: "SET_TRANSFORM", objectId: "one", transform: { position: [1, 2, -3], rotation: [0, Math.SQRT1_2, 0, Math.SQRT1_2], scale: [2, 1, 1] } });
    expect(moved.state.document.objects[0].position).toEqual([1, 2, -3]);
    expect(run(moved.state, { type: "UNDO" }).state.document).toEqual(placed.state.document);
    expect(run(run(moved.state, { type: "UNDO" }).state, { type: "REDO" }).state.document).toEqual(moved.state.document);
    expect(moved.state.snapshot.revision).toBe(0);
    expect(moved.state.pending).toBeNull();
    expect(isDirty(moved.state)).toBe(true);
    expect(beginSave(moved.state, "save").request.expectedRevision).toBe(0);
  });
  it("rejects uncatalogued assets, nonexistent targets and unallowlisted actions", () => {
    expect(() => run(undefined, undefined, [])).toThrow(/asset/i);
    const placed = run().state;
    for (const input of [{ type: "SELECT_OBJECT", objectId: "missing" }, { type: "SET_TRANSFORM", objectId: "missing", transform: { position: [0, 0, 0] } }, { type: "SAVE" }, { type: "PLACE_ASSET", assetId, objectId: "two", url: "https://foreign.test" }]) expect(() => run(placed, input)).toThrow();
    expect(run(placed, { type: "SELECT_OBJECT", objectId: "one" }).selectedId).toBe("one");
  });
  it("rejects invalid transforms and read-only mutation without changing the input", () => {
    const placed = run().state;
    for (const transform of [{ position: [31, 0, 0] }, { scale: [0, 1, 1] }, { scale: [11, 1, 1] }, { rotation: [0, 0, 0, 0] }, { position: [NaN, 0, 0] }, {}, { assetId }]) expect(() => run(placed, { type: "SET_TRANSFORM", objectId: "one", transform })).toThrow();
    const readonly = createEditorState({ ...initial, canEdit: false, document: placed.document });
    for (const input of [{ type: "PLACE_ASSET", assetId, objectId: "two" }, { type: "UNDO" }, { type: "REDO" }, { type: "SET_TRANSFORM", objectId: "one", transform: { scale: [2, 2, 2] } }]) expect(() => run(readonly, input)).toThrow(/read.only/i);
    expect(run(readonly, { type: "SELECT_OBJECT", objectId: "one" }).state).toBe(readonly);
    expect(placed.document.objects[0].position).toEqual([0, 0, 0]);
  });
});
