// reel-link: Creates a 24 h signed URL for a reel.
// M0 skeleton: auth, CORS, rate limit, ping and input validation are live; logic arrives in M4.
import { z } from "npm:zod@4.6.7";
import { notImplemented, serve } from "../_shared/handler.ts";

const Input = z.object({ reel_id: z.uuid() });

serve({
  name: "reel-link",
  schema: Input,
  handler: async ({ req }) => notImplemented(req, "M4"),
});
