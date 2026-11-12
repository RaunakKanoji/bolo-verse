// join-session: Verifies join_token, sets msme_id = caller (only if empty), rotates the token.
// M0 skeleton: auth, CORS, rate limit, ping and input validation are live; logic arrives in M3.
import { z } from "npm:zod@4.6.7";
import { notImplemented, serve } from "../_shared/handler.ts";

const Input = z.object({ session_id: z.uuid(), join_token: z.string().min(16).max(128) });

serve({
  name: "join-session",
  schema: Input,
  handler: async ({ req }) => notImplemented(req, "M3"),
});
