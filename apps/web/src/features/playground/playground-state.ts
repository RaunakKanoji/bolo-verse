import { createStore } from "zustand/vanilla";
import { EditSettingsSchema, originalEdits, type EditSettings } from "./image-processing";
import {
  createEmptyCreativeDraftDocument,
  creativePromptLimit,
  type CreativeDraftDocument,
  type CreativeMode,
} from "@/lib/contracts/shape";

export type LocalSnapshot = { id: number; label: string; edits: EditSettings };
export interface PlaygroundState {
  document: CreativeDraftDocument;
  edits: EditSettings;
  compare: boolean;
  zoom: number;
  pan: { x: number; y: number };
  snapshots: LocalSnapshot[];
  sequence: number;
  setMode(mode: CreativeMode): void;
  setPrompt(mode: CreativeMode, prompt: string): void;
  loadDocument(document: CreativeDraftDocument): void;
  setEdits(patch: Partial<EditSettings>): void;
  setCompare(value: boolean): void;
  setZoom(value: number): void;
  setPan(x: number, y: number): void;
  fit(): void;
  resetEdits(): void;
  resetSource(): void;
  capture(): void;
  restore(id: number): void;
}
const clamp = (value: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;

/** One store per mounted project; private drafts never enter browser storage. */
export function createPlaygroundStore() {
  return createStore<PlaygroundState>((set) => ({
    document: createEmptyCreativeDraftDocument(),
    edits: { ...originalEdits },
    compare: false,
    zoom: 1,
    pan: { x: 0, y: 0 },
    snapshots: [],
    sequence: 0,
    setMode: (mode) => set((state) => ({ document: { ...state.document, mode } })),
    setPrompt: (mode, prompt) =>
      set((state) => ({
        document: {
          ...state.document,
          prompts: { ...state.document.prompts, [mode]: prompt.slice(0, creativePromptLimit) },
        },
      })),
    loadDocument: (document) => set({ document: structuredClone(document) }),
    setEdits: (patch) =>
      set((state) => ({
        edits: EditSettingsSchema.parse({ ...state.edits, ...patch }),
        compare: false,
      })),
    setCompare: (compare) => set({ compare }),
    setZoom: (zoom) => set({ zoom: clamp(zoom, 0.5, 4) }),
    setPan: (x, y) => set({ pan: { x: clamp(x, -1500, 1500), y: clamp(y, -1500, 1500) } }),
    fit: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),
    resetEdits: () => set({ edits: { ...originalEdits }, compare: false }),
    resetSource: () =>
      set({
        edits: { ...originalEdits },
        compare: false,
        zoom: 1,
        pan: { x: 0, y: 0 },
        snapshots: [],
      }),
    capture: () =>
      set((state) => {
        const id = state.sequence + 1;
        return {
          sequence: id,
          snapshots: [
            ...state.snapshots,
            { id, label: `Local variant ${id}`, edits: { ...state.edits } },
          ].slice(-8),
        };
      }),
    restore: (id) =>
      set((state) => {
        const snapshot = state.snapshots.find((value) => value.id === id);
        return snapshot ? { edits: { ...snapshot.edits }, compare: false } : {};
      }),
  }));
}
export type PlaygroundStore = ReturnType<typeof createPlaygroundStore>;
