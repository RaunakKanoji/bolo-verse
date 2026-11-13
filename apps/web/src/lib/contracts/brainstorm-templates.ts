/** Versioned authoring prompts; selection is editable data, never a tool command. */
export const brainstormTemplates = [
  {
    id: "analyze-brief",
    label: "Analyze Client Brief",
    objective: "Identify the brief's goals, constraints and unanswered questions.",
    inputs: ["Saved client brief", "Project requirements"],
    outputs: ["Goals", "Verified facts", "Constraints", "Open questions"],
  },
  {
    id: "campaign-ideas",
    label: "Generate Campaign Ideas",
    objective: "Propose three distinct campaign concepts grounded in the supplied brief.",
    inputs: ["Saved client brief", "Audience", "Saved ideas"],
    outputs: [
      "Concept title",
      "Audience",
      "Core message",
      "Format",
      "Production requirements",
      "Next steps",
    ],
  },
  {
    id: "creative-direction",
    label: "Create Creative Direction",
    objective: "Develop a coherent visual and narrative direction for the selected concept.",
    inputs: ["Saved concept", "Brand requirements"],
    outputs: ["Hook", "Concept", "Visual treatment", "Rationale", "Constraints"],
  },
  {
    id: "target-audience",
    label: "Identify Target Audience",
    objective:
      "Describe an evidence-based audience and distinguish assumptions from supplied facts.",
    inputs: ["Brief audience", "Product", "Objectives"],
    outputs: ["Audience segments", "Needs", "Message relevance", "Assumptions to validate"],
  },
  {
    id: "content-strategy",
    label: "Generate Content Strategy",
    objective: "Plan content formats and channels that support the brief's objectives.",
    inputs: ["Objectives", "Channels", "Saved ideas"],
    outputs: ["Content pillars", "Formats", "Channels", "Sequence", "Production needs"],
  },
  {
    id: "script-outline",
    label: "Create Script Outline",
    objective: "Outline a promotional script using the saved concept and verified claims.",
    inputs: ["Saved concept", "Brief facts", "Duration target"],
    outputs: [
      "Opening hook",
      "Timed sections",
      "Dialogue or voiceover",
      "On-screen text",
      "Call to action",
    ],
  },
  {
    id: "storyboard-plan",
    label: "Generate Storyboard Plan",
    objective: "Describe a text-only storyboard plan for the supplied script.",
    inputs: ["Script text", "Visual direction", "Duration target"],
    outputs: [
      "Scene number",
      "Description",
      "Visual direction",
      "Camera framing",
      "Dialogue or voiceover",
      "Estimated duration",
      "Notes",
    ],
  },
  {
    id: "shot-list",
    label: "Generate Shot List",
    objective: "Break the supplied storyboard into practical production shots.",
    inputs: ["Storyboard text", "Available equipment"],
    outputs: [
      "Shot number",
      "Scene",
      "Framing",
      "Camera movement",
      "Lighting",
      "Equipment",
      "Production notes",
    ],
  },
  {
    id: "production-notes",
    label: "Generate Production Notes",
    objective: "Prepare actionable production notes and identify unresolved dependencies.",
    inputs: ["Saved direction", "Script or storyboard", "Constraints"],
    outputs: ["Preparation", "Assets needed", "Shoot notes", "Dependencies", "Review checklist"],
  },
  {
    id: "suggest-improvements",
    label: "Suggest Improvements",
    objective: "Review supplied work against the brief and propose concrete revisions.",
    inputs: ["Saved work", "Client feedback", "Brief requirements"],
    outputs: ["Issue", "Evidence", "Suggested revision", "Priority", "Questions"],
  },
] as const;

export function buildTemplatePrompt(id: string, instructions = ""): string {
  const template = brainstormTemplates.find((entry) => entry.id === id);
  if (!template) throw new Error("Choose a supported prompt template.");
  const prompt = [
    `${template.label} [${template.id}:v1]`,
    `Objective: ${template.objective}`,
    `Inputs: ${template.inputs.join("; ")}. Use the linked saved brief, recent conversation and saved ideas; ask for missing inputs.`,
    `In your reply, use these labeled sections: ${template.outputs.join("; ")}. Include 1 to 3 supporting concepts in the existing response structure.`,
    "No uploaded documents or media have been analyzed. Do not claim extraction, generated image frames, completed assets or approvals.",
    instructions.trim() ? `Additional instructions: ${instructions.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  if (prompt.length > 2000)
    throw new Error("Shorten additional instructions to keep the prompt within 2,000 characters.");
  return prompt;
}
