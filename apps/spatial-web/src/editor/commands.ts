import { z } from "zod";
import { CanonicalSpatialObjectSchema } from "@shape/scene-schema";
import { editObject, placeAsset, redo, undo, type EditorState } from "./state";

const objectId = CanonicalSpatialObjectSchema.shape.id;
const transform = CanonicalSpatialObjectSchema.pick({ position: true, rotation: true, scale: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "A transform is required.");
export const EditorCommandSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("PLACE_ASSET"), assetId: z.uuid(), objectId }),
  z.strictObject({ type: z.literal("SELECT_OBJECT"), objectId }),
  z.strictObject({ type: z.literal("SET_TRANSFORM"), objectId, transform }),
  z.strictObject({ type: z.literal("UNDO") }),
  z.strictObject({ type: z.literal("REDO") }),
]);

/** Local dispatch after explicit review. No network, microphone, persistence or Save action.
 * A future voice caller must invalidate proposals when its session/context changes.
 * The server independently reauthorizes all asset references and revisions on explicit Save.
 */
export function dispatchEditorCommand(
  state: EditorState,
  input: unknown,
  availableAssetIds: readonly string[],
): { state: EditorState; selectedId?: string } {
  const command = EditorCommandSchema.parse(input);
  switch (command.type) {
    case "PLACE_ASSET":
      if (!availableAssetIds.includes(command.assetId))
        throw new Error("Choose a ready, supported asset from this project.");
      return {
        state: placeAsset(state, command.assetId, command.objectId),
        selectedId: command.objectId,
      };
    case "SELECT_OBJECT":
      if (!state.document.objects.some(({ id }) => id === command.objectId))
        throw new Error("That object is no longer in the scene.");
      return { state, selectedId: command.objectId };
    case "SET_TRANSFORM":
      return { state: editObject(state, command.objectId, command.transform) };
    case "UNDO":
      return { state: undo(state) };
    case "REDO":
      return { state: redo(state) };
  }
}
