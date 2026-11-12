// command: Gemini JSON mode: transcript + scene summary -> command JSON (CLAUDE.md §6).
// M0 skeleton: auth, CORS, rate limit, ping and input validation are live; logic arrives in M2.
import { z } from "npm:zod@4.6.7";
import { notImplemented, serve } from "../_shared/handler.ts";

const Input = z.object({
  session_id: z.uuid(),
  transcript: z.string().min(1).max(1000),
  scene_summary: z.record(z.string(), z.unknown()).default({}),
  language: z.enum(["en-IN", "hi-IN", "kn-IN"]),
});

serve({
  name: "command",
  schema: Input,
  handler: async ({ req }) => notImplemented(req, "M2"),
});
