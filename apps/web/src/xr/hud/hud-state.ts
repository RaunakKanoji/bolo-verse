import { z } from "zod";

export const HUD_NAVIGATION = [
  {
    id: "workspace",
    label: "Workspace",
    href: "/workspace",
    description: "Your projects, deadlines and recent activity.",
  },
  {
    id: "create",
    label: "Create",
    href: "/create",
    description: "Generate and edit campaign imagery with the existing creation tools.",
  },
  {
    id: "brainstorm",
    label: "Brainstorm",
    href: "/brainstorm",
    description: "Explore your brief, develop ideas and save concepts.",
  },
  {
    id: "projects",
    label: "Projects",
    href: "/projects",
    description: "Choose a project to continue its creative workflow.",
  },
  {
    id: "review",
    label: "Review",
    href: "/review",
    description: "Review published deliverables and version-specific feedback.",
  },
  {
    id: "assets",
    label: "Assets",
    href: "/assets",
    description: "Browse verified images, video, audio and models in your library.",
  },
  {
    id: "clients",
    label: "Clients",
    href: "/clients",
    description: "Manage the clients and briefs behind your campaigns.",
  },
  {
    id: "recording",
    label: "Recording Lab",
    href: "/recording-lab",
    description: "Capture media with the existing recording tools.",
  },
  {
    id: "spatial",
    label: "Spatial Studio",
    href: "/spatial-studio",
    description: "Open your project in the canonical desktop 3D editor.",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    description: "Manage your account and workspace preferences.",
  },
] as const;
export type HudWorkspace = (typeof HUD_NAVIGATION)[number]["id"];
export const HudPresetSchema = z.enum(["COMPACT", "STANDARD", "FOCUSED", "IMMERSIVE"]);
export const HudEnvironmentSchema = z.enum(["Dark Studio", "Minimal Void", "Creative Workspace"]);
export const HUD_PANELS = ["main", "navigation", "assistant", "dock"] as const;
export type HudPanelId = (typeof HUD_PANELS)[number];
const offset = z.tuple([
  z.number().min(-0.2).max(0.2),
  z.number().min(-0.2).max(0.2),
  z.number().min(-0.3).max(0.1),
]);
export const HudPreferencesSchema = z.strictObject({
  version: z.literal(1),
  preset: HudPresetSchema,
  environment: HudEnvironmentSchema,
  offsets: z
    .strictObject({ main: offset, navigation: offset, assistant: offset, dock: offset })
    .refine(
      (value) =>
        Math.abs(value.main[0]) <= 0.1 && value.navigation[0] <= 0 && value.assistant[0] >= 0,
    ),
});
export type HudPreferences = z.infer<typeof HudPreferencesSchema>;
export type HudState = {
  workspace: HudWorkspace;
  projectId: string | null;
  focusedPanel: HudPanelId;
  preferences: HudPreferences;
};
export const HUD_STORAGE_KEY = "shape-spatial-hud-view-v1";
export function initialHudState(): HudState {
  return {
    workspace: "workspace",
    projectId: null,
    focusedPanel: "main",
    preferences: {
      version: 1,
      preset: "STANDARD",
      environment: "Dark Studio",
      offsets: { main: [0, 0, 0], navigation: [0, 0, 0], assistant: [0, 0, 0], dock: [0, 0, 0] },
    },
  };
}
const actionSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("navigate"),
    workspace: z.enum(HUD_NAVIGATION.map((n) => n.id)),
  }),
  z.strictObject({ type: z.literal("select-project"), id: z.uuid() }),
  z.strictObject({ type: z.literal("focus"), panel: z.enum(HUD_PANELS) }),
  z.strictObject({ type: z.literal("move-panel"), panel: z.enum(HUD_PANELS), offset }),
  z.strictObject({ type: z.literal("preset"), preset: HudPresetSchema }),
  z.strictObject({ type: z.literal("environment"), environment: HudEnvironmentSchema }),
  z.strictObject({ type: z.literal("restore"), preferences: HudPreferencesSchema }),
  z.strictObject({ type: z.literal("reset-layout") }),
  z.strictObject({ type: z.literal("clear-private") }),
]);
export function reduceHud(state: HudState, input: unknown): HudState {
  const parsed = actionSchema.safeParse(input);
  if (!parsed.success) return state;
  const action = parsed.data;
  switch (action.type) {
    case "navigate":
      return { ...state, workspace: action.workspace, focusedPanel: "main" };
    case "select-project":
      return { ...state, projectId: action.id, focusedPanel: "main" };
    case "focus":
      return { ...state, focusedPanel: action.panel };
    case "move-panel": {
      const preferences = HudPreferencesSchema.safeParse({
        ...state.preferences,
        offsets: { ...state.preferences.offsets, [action.panel]: action.offset },
      });
      return preferences.success ? { ...state, preferences: preferences.data } : state;
    }
    case "preset":
      return { ...state, preferences: { ...state.preferences, preset: action.preset } };
    case "environment":
      return { ...state, preferences: { ...state.preferences, environment: action.environment } };
    case "restore":
      return { ...state, preferences: action.preferences };
    case "reset-layout":
      return { ...state, focusedPanel: "main", preferences: initialHudState().preferences };
    case "clear-private":
      return { ...state, projectId: null };
  }
}
export function readHudPreferences(raw: string | null): HudPreferences {
  try {
    return HudPreferencesSchema.parse(JSON.parse(raw ?? "null"));
  } catch {
    return initialHudState().preferences;
  }
}
export function serializeHudPreferences(state: HudState): string {
  return JSON.stringify(HudPreferencesSchema.parse(state.preferences));
}
