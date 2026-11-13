import { describe, expect, it } from "vitest";
import { brainstormTemplates, buildTemplatePrompt } from "@/lib/contracts/brainstorm-templates";

describe("demo prompt templates", () => {
  it("defines the ten required uniquely identified templates with objectives, inputs and outputs", () => {
    expect(brainstormTemplates.map(t => t.label)).toEqual([
      "Analyze Client Brief", "Generate Campaign Ideas", "Create Creative Direction",
      "Identify Target Audience", "Generate Content Strategy", "Create Script Outline",
      "Generate Storyboard Plan", "Generate Shot List", "Generate Production Notes", "Suggest Improvements",
    ]);
    expect(new Set(brainstormTemplates.map(t => t.id)).size).toBe(10);
    for (const t of brainstormTemplates) {
      expect(t.objective.length).toBeGreaterThan(10);
      expect(t.inputs.length).toBeGreaterThan(0);
      expect(t.outputs.length).toBeGreaterThan(0);
      const prompt = buildTemplatePrompt(t.id);
      expect(prompt).toContain(t.objective);
      for (const output of t.outputs) expect(prompt).toContain(output);
      expect(prompt.length).toBeLessThanOrEqual(2000);
      expect(prompt).toContain("No uploaded documents or media have been analyzed");
    }
  });
  it("preserves custom instructions, rejects unknown templates and bounds the editable prompt", () => {
    expect(buildTemplatePrompt("campaign-ideas", "Use a warm morning commute.")).toContain("Use a warm morning commute.");
    expect(() => buildTemplatePrompt("unknown")).toThrow();
    expect(() => buildTemplatePrompt("campaign-ideas", "x".repeat(2000))).toThrow();
  });
});
