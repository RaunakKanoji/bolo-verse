import {
  CanonicalSpatialSceneSchema,
  SaveSpatialSceneSchema,
  SpatialSceneSnapshotSchema,
  type CanonicalSpatialScene,
  type SpatialSceneSnapshot,
  type SaveSpatialScene,
} from "@shape/scene-schema";

export type SceneObject = CanonicalSpatialScene["objects"][number];
export type EditorState = {
  snapshot: SpatialSceneSnapshot;
  document: CanonicalSpatialScene;
  past: CanonicalSpatialScene[];
  future: CanonicalSpatialScene[];
  status: "ready" | "saving" | "saved" | "conflict" | "error";
  pending: { id: string; request: SaveSpatialScene } | null;
};
const copy = <T>(value: T): T => structuredClone(value);
const same = (a: CanonicalSpatialScene, b: CanonicalSpatialScene) =>
  JSON.stringify(a) === JSON.stringify(b);

export function validateSnapshot(input: unknown, projectId?: string): SpatialSceneSnapshot {
  const snapshot = SpatialSceneSnapshotSchema.parse(input);
  if (
    snapshot.projectId !== snapshot.sceneId ||
    snapshot.sceneId !== snapshot.document.sceneId ||
    (projectId && snapshot.projectId !== projectId)
  ) {
    throw new Error("Scene does not belong to this project.");
  }
  return snapshot;
}
export function createEditorState(snapshot: SpatialSceneSnapshot): EditorState {
  const parsed = validateSnapshot(snapshot);
  return {
    snapshot: copy(parsed),
    document: copy(parsed.document),
    past: [],
    future: [],
    status: "ready",
    pending: null,
  };
}
export const isDirty = (state: EditorState) => !same(state.document, state.snapshot.document);
function writable(state: EditorState) {
  if (!state.snapshot.canEdit) throw new Error("This scene is read-only.");
}
function change(state: EditorState, document: CanonicalSpatialScene): EditorState {
  writable(state);
  const parsed = CanonicalSpatialSceneSchema.parse(document);
  if (same(state.document, parsed)) return state;
  return {
    ...state,
    document: parsed,
    past: [...state.past.slice(-49), copy(state.document)],
    future: [],
    status: state.status === "saved" ? "ready" : state.status,
  };
}
export function placeAsset(state: EditorState, assetId: string, id: string): EditorState {
  return change(state, {
    ...state.document,
    objects: [
      ...state.document.objects,
      { id, assetId, position: [0, 0, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1], visible: true },
    ],
  });
}
export function editObject(
  state: EditorState,
  id: string,
  patch: Partial<Omit<SceneObject, "id" | "assetId">>,
): EditorState {
  if (!state.document.objects.some((object) => object.id === id))
    throw new Error("Select an object first.");
  return change(state, {
    ...state.document,
    objects: state.document.objects.map((object) =>
      object.id === id ? { ...object, ...patch } : object,
    ),
  });
}
export function removeObject(state: EditorState, id: string): EditorState {
  return change(state, {
    ...state.document,
    objects: state.document.objects.filter((object) => object.id !== id),
  });
}
export function undo(state: EditorState): EditorState {
  writable(state);
  const document = state.past.at(-1);
  return document
    ? {
        ...state,
        document: copy(document),
        past: state.past.slice(0, -1),
        future: [copy(state.document), ...state.future],
      }
    : state;
}
export function redo(state: EditorState): EditorState {
  writable(state);
  const document = state.future[0];
  return document
    ? {
        ...state,
        document: copy(document),
        past: [...state.past.slice(-49), copy(state.document)],
        future: state.future.slice(1),
      }
    : state;
}
export function beginSave(
  state: EditorState,
  id: string,
): { state: EditorState; request: SaveSpatialScene } {
  writable(state);
  if (state.pending || state.status === "conflict")
    throw new Error("Reload the latest scene before saving again.");
  const request = SaveSpatialSceneSchema.parse({
    expectedRevision: state.snapshot.revision,
    document: copy(state.document),
  });
  return {
    state: { ...state, status: "saving", pending: { id, request: copy(request) } },
    request,
  };
}
export function resolveSave(
  state: EditorState,
  id: string,
  result: SpatialSceneSnapshot | "conflict" | "error",
): EditorState {
  if (state.pending?.id !== id) return state;
  if (typeof result === "string") return { ...state, status: result, pending: null };
  const snapshot = validateSnapshot(result, state.snapshot.projectId);
  if (
    snapshot.revision !== state.pending.request.expectedRevision + 1 ||
    !same(snapshot.document, state.pending.request.document)
  ) {
    return { ...state, status: "error", pending: null };
  }
  return { ...state, snapshot: copy(snapshot), status: "saved", pending: null };
}
export function reloadScene(
  state: EditorState,
  snapshot: SpatialSceneSnapshot,
  discard: boolean,
): EditorState {
  if (isDirty(state) && !discard)
    throw new Error("Confirm discard before reloading local changes.");
  const parsed = validateSnapshot(snapshot, state.snapshot.projectId);
  if (parsed.revision < state.snapshot.revision)
    throw new Error("A stale scene response was discarded.");
  return createEditorState(parsed);
}
