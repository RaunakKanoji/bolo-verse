// CORS for our frontend origins. Set the ALLOWED_ORIGINS secret (comma-separated)
// before the demo; when it is empty every origin is allowed (dev convenience).

const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** CORS headers for this request's Origin. */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowOrigin = allowed.length === 0 ? '*' : allowed.includes(origin) ? origin : allowed[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

/** JSON response in our `{ ok, data | error }` envelope, with CORS. */
export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

export const ok = (req: Request, data: unknown) => json(req, { ok: true, data });
export const fail = (req: Request, status: number, error: string) => json(req, { ok: false, error }, status);
