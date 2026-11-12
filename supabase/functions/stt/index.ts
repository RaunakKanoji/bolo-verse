// stt: Sarvam STT (saaras:v3, code-mix) on a <= 12 s, <= 1 MB WAV. Audio is never stored.
// M0 skeleton: auth, CORS, rate limit, ping and input validation are live; logic arrives in M2.
import { z } from "npm:zod@4.6.7";
import { notImplemented, serve } from "../_shared/handler.ts";

const Input = z.object({
  audio: z.instanceof(File).refine((f) => f.size <= 1024 * 1024, "audio > 1 MB"),
  session_id: z.uuid(),
  language_hint: z.enum(["en-IN", "hi-IN", "kn-IN"]).optional(),
});

serve({
  name: "stt",
  schema: Input,
  handler: async ({ req }) => notImplemented(req, "M2"),
});
