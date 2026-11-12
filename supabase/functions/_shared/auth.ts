// Auth helpers. Every function requires a valid Supabase JWT (anonymous users are fine).
// We verify the JWT in code with auth.getUser() (config.toml sets verify_jwt = false so
// CORS preflight requests reach us; the check below is the real gate).
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2.119.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
// VERIFY: hosted functions inject SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY. Projects that
// moved to the new publishable/secret API keys may need these set explicitly as secrets.
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Client that acts as the calling user (RLS applies). */
export function userClient(req: Request): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Service-role client (bypasses RLS). Use only for the few writes that need it. */
export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Verifies the bearer JWT with Supabase Auth. Throws HttpError(401) when missing/invalid. */
export async function requireUser(req: Request): Promise<{ user: User; db: SupabaseClient }> {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'missing_jwt');
  const db = userClient(req);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'invalid_jwt');
  return { user: data.user, db };
}

/** Throws HttpError(403) unless the user is the session's creator or MSME. */
export async function requireSessionMember(db: SupabaseClient, sessionId: string): Promise<void> {
  // RLS on `sessions` only returns rows where the caller is a member.
  const { data, error } = await db.from('sessions').select('id').eq('id', sessionId).maybeSingle();
  if (error || !data) throw new HttpError(403, 'not_session_member');
}
