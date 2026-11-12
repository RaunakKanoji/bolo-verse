// Common wrapper for every Edge Function: CORS preflight, POST only, JWT check,
// rate limit, `{ ping: true }` health check, zod input validation, error envelope.
import { z } from 'npm:zod@4.6.7';
import type { SupabaseClient, User } from 'npm:@supabase/supabase-js@2.119.0';
import { corsHeaders, fail, ok } from './cors.ts';
import { HttpError, requireUser } from './auth.ts';
import { rateLimit } from './rateLimit.ts';

export interface Ctx<T> {
  req: Request;
  user: User;
  /** Supabase client acting as the caller (RLS applies). */
  db: SupabaseClient;
  input: T;
}

export interface Options<S extends z.ZodType> {
  name: string;
  schema: S;
  limitPerMin?: number;
  handler: (ctx: Ctx<z.infer<S>>) => Promise<Response | unknown>;
}

/** Starts the function. The handler may return a Response, or plain data to wrap in `{ ok: true, data }`. */
export function serve<S extends z.ZodType>(opts: Options<S>): void {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
    if (req.method !== 'POST') return fail(req, 405, 'method_not_allowed');
    try {
      const { user, db } = await requireUser(req);
      if (!rateLimit(`${opts.name}:${user.id}`, opts.limitPerMin ?? 30)) {
        return fail(req, 429, 'rate_limited');
      }

      const raw = await readBody(req);
      // Health check used by the M0 system-check page.
      if (raw && (raw as Record<string, unknown>).ping === true) {
        return ok(req, { function: opts.name, status: 'skeleton', user: user.id });
      }

      const parsed = opts.schema.safeParse(raw);
      if (!parsed.success) return fail(req, 400, `invalid_input: ${parsed.error.message}`);

      const result = await opts.handler({ req, user, db, input: parsed.data });
      return result instanceof Response ? result : ok(req, result);
    } catch (err) {
      if (err instanceof HttpError) return fail(req, err.status, err.message);
      console.error(`[BoloVerse] ${opts.name} error`, err);
      return fail(req, 500, 'internal_error');
    }
  });
}

/** Parses JSON or multipart bodies into a plain object (File values kept as File). */
async function readBody(req: Request): Promise<unknown> {
  const type = req.headers.get('Content-Type') ?? '';
  if (type.includes('multipart/form-data')) {
    const form = await req.formData();
    return Object.fromEntries(form.entries());
  }
  const text = await req.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
}

/** Placeholder response for functions not built yet. */
export const notImplemented = (req: Request, milestone: string) =>
  fail(req, 501, `not_implemented (arrives in ${milestone})`);

/** fetch() with an AbortController timeout. */
export async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
