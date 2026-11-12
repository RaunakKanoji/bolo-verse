// tts: Sarvam TTS (bulbul:v3) -> audio bytes.
// M0 skeleton: auth, CORS, rate limit, ping and input validation are live; logic arrives in M2.
import { z } from "npm:zod@4.6.7";
import { notImplemented, serve } from "../_shared/handler.ts";

const Input = z.object({ text: z.string().min(1).max(500), language: z.enum(["en-IN", "hi-IN", "kn-IN"]) });

serve({
  name: "tts",
  schema: Input,
  handler: async ({ req }) => notImplemented(req, "M2"),
});
