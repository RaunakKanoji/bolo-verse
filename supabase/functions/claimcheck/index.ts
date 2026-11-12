// claimcheck: Transcribes reel narration, compares each sentence with brand_briefs via Gemini, writes claim results.
// M0 skeleton: auth, CORS, rate limit, ping and input validation are live; logic arrives in M6.
import { z } from "npm:zod@4.6.7";
import { notImplemented, serve } from "../_shared/handler.ts";

const Input = z.object({ session_id: z.uuid(), reel_id: z.uuid() });

serve({
  name: "claimcheck",
  schema: Input,
  handler: async ({ req }) => notImplemented(req, "M6"),
});
