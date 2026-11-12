import { describe, expect, it, vi } from "vitest";
import { applyTransformAction } from "@/xr/interactions/transform-controls";
import { StudioAdapter } from "@/xr/runtime/studio-adapter";
import { createStudioDocument } from "@/xr/serializers/scene-document";

const project = { id: "preview", name: "Test project", objective: "Test objective" };
const original = { position: [0, 1, -3], rotation: [0, 0, 0], scale: [1, 1, 1] } as const;
const transform = (): {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
} => ({
  position: [...original.position],
  rotation: [...original.rotation],
  scale: [...original.scale],
});

describe("bounded transform actions", () => {
  it("moves, rotates and scales detached values without changing the original", () => {
    const current = transform();
    expect(
      applyTransformAction(current, { type: "move", axis: "x", amount: 0.25 }).position,
    ).toEqual([0.25, 1, -3]);
    expect(
      applyTransformAction(current, { type: "rotate", axis: "y", amount: 15 }).rotation,
    ).toEqual([0, 15, 0]);
    expect(applyTransformAction(current, { type: "scale", factor: 1.1 }).scale).toEqual([
      1.1, 1.1, 1.1,
    ]);
    expect(current).toEqual(original);
  });

  it("keeps repeated interaction inside persistence bounds", () => {
    const edge = { position: [30, -30, 0], rotation: [360, -360, 0], scale: [10, 0.1, 1] };
    expect(applyTransformAction(edge, { type: "move", axis: "x", amount: 1 }).position[0]).toBe(30);
    expect(applyTransformAction(edge, { type: "rotate", axis: "y", amount: -15 }).rotation[1]).toBe(
      -360,
    );
    expect(applyTransformAction(edge, { type: "scale", factor: 2 }).scale).toEqual([10, 0.2, 2]);
    expect(applyTransformAction(edge, { type: "scale", factor: 0.5 }).scale).toEqual([5, 0.1, 0.5]);
  });

  it("rejects nonfinite coordinates and unsafe action values", () => {
    expect(() =>
      applyTransformAction(
        { ...transform(), position: [Infinity, 0, 0] },
        { type: "move", axis: "x", amount: 1 },
      ),
    ).toThrow();
    expect(() => applyTransformAction(transform(), { type: "scale", factor: -1 })).toThrow();
    expect(() =>
      applyTransformAction(transform(), { type: "move", axis: "x", amount: NaN }),
    ).toThrow();
    expect(() =>
      applyTransformAction(transform(), {
        type: "reset",
        transform: { ...transform(), scale: [0, 1, 1] },
      }),
    ).toThrow();
  });
});

describe("scene mutation ownership", () => {
  function harness() {
    const onDocumentChange = vi.fn();
    const onSelect = vi.fn();
    const document = createStudioDocument(project);
    const adapter = new StudioAdapter(
      {} as HTMLDivElement,
      project,
      { onSelect, onSession: vi.fn(), onStats: vi.fn(), onError: vi.fn(), onDocumentChange },
      document,
    );
    return { adapter, document, onSelect, onDocumentChange };
  }

  it("changes selected object transforms and emits detached validated snapshots", () => {
    const { adapter, document, onDocumentChange } = harness();
    adapter.select("sample-concept");
    expect(adapter.transformSelected({ type: "move", axis: "x", amount: 0.25 })).toBe(true);
    expect(adapter.serialize().entities[1].transform.position[0]).toBe(-2.05);
    expect(document.entities[1].transform.position[0]).toBe(-2.3);
    expect(onDocumentChange).toHaveBeenCalledOnce();
    onDocumentChange.mock.calls[0][0].entities[1].transform.position[0] = 20;
    expect(adapter.serialize().entities[1].transform.position[0]).toBe(-2.05);
  });

  it("keeps read-only workspaces selectable but refuses user edits", () => {
    const { adapter, onSelect, onDocumentChange } = harness();
    adapter.setEditable(false);
    adapter.select("sample-storyboard");
    expect(onSelect).toHaveBeenCalled();
    expect(adapter.transformSelected({ type: "move", axis: "x", amount: 0.25 })).toBe(false);
    expect(
      adapter.updateTransform("sample-storyboard", {
        position: [1, 2, 3],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      }),
    ).toBe(false);
    expect(onDocumentChange).not.toHaveBeenCalled();
  });

  it("accepts server document refresh without an edit callback and prevents project switching", () => {
    const { adapter, document, onDocumentChange } = harness();
    document.entities[0].transform.position[0] = 2;
    adapter.updateDocument(document);
    expect(adapter.serialize().entities[0].transform.position[0]).toBe(2);
    expect(onDocumentChange).not.toHaveBeenCalled();
    expect(() => adapter.updateDocument({ ...document, projectId: "another-project" })).toThrow(
      /project/i,
    );
  });

  it("ignores mutations after disposal", () => {
    const { adapter, onDocumentChange } = harness();
    adapter.dispose();
    expect(adapter.transformSelected({ type: "move", axis: "x", amount: 1 })).toBe(false);
    expect(onDocumentChange).not.toHaveBeenCalled();
  });
});
