-- BoloVerse initial schema (CLAUDE.md §5) + RLS + storage + realtime.
-- Apply with:  npx supabase db push   (after `npx supabase link`)
-- or paste into Dashboard → SQL Editor → Run.
--
-- Anonymous sign-ins must be enabled in Dashboard → Authentication → Sign In / Providers.
-- Anonymous users get the `authenticated` role, so policies below target `authenticated`.

-- ───────────────────────── Tables ─────────────────────────

-- A studio session links one creator (Phone A) with one MSME (Phone B)
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  msme_id uuid references auth.users(id) on delete set null,
  join_token text not null check (length(join_token) >= 16),  -- random 16+ chars, shown in QR
  language text not null default 'en-IN' check (language in ('en-IN', 'hi-IN', 'kn-IN')),
  consent_given boolean not null default false,
  created_at timestamptz default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  name text,
  image_path text not null,              -- storage path in bucket 'products'
  depth_path text,                       -- optional depth map (§8.9)
  cutout_ok boolean not null default true,
  status text not null default 'ready',
  created_at timestamptz default now()
);

create table public.brand_briefs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  facts text[] not null default '{}',
  banned_claims text[] not null default '{}',
  updated_at timestamptz default now()
);

create table public.reels (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  video_path text not null,              -- storage path in bucket 'reels'
  duration_s int,
  transcript text,
  claim_result jsonb,                    -- output of claimcheck
  approved boolean not null default false,
  created_at timestamptz default now()
);

-- One row per session; studio writes, spectator reads
create table public.scene_state (
  session_id uuid primary key references public.sessions(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz default now()
);

create table public.command_logs (
  id bigint generated always as identity primary key,
  session_id uuid references public.sessions(id) on delete cascade,
  transcript text,
  detected_language text,
  action text,
  success boolean,
  fallback_used boolean default false,
  confidence real,                       -- §8.8
  needed_confirmation boolean default false,  -- §8.8
  stt_ms int, llm_ms int, tts_ms int, total_ms int,
  created_at timestamptz default now()
);

create table public.claim_logs (
  id bigint generated always as identity primary key,
  session_id uuid references public.sessions(id) on delete cascade,
  reel_id uuid references public.reels(id) on delete cascade,
  sentence text,
  verdict text check (verdict in ('ok', 'contradicts', 'banned', 'unverifiable')),
  brief_fact text,
  created_at timestamptz default now()
);

create table public.upload_logs (
  id bigint generated always as identity primary key,
  session_id uuid references public.sessions(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  removal_ms int, upload_ms int,
  appear_ms int,                          -- filled by studio when rendered
  created_at timestamptz default now()
);

create index on public.products (session_id, created_at);
create index on public.reels (session_id);
create index on public.brand_briefs (product_id);
create index on public.command_logs (session_id, created_at);
create index on public.claim_logs (session_id);
create index on public.upload_logs (session_id);

-- ───────────────────────── Membership helpers ─────────────────────────
-- SECURITY DEFINER so policies on other tables can check membership without
-- recursing through the `sessions` RLS policies.

create or replace function public.is_session_member(sid uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.sessions s
    where s.id = sid and (s.creator_id = auth.uid() or s.msme_id = auth.uid())
  );
$$;

create or replace function public.is_session_msme(sid uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.sessions s where s.id = sid and s.msme_id = auth.uid());
$$;

-- Storage paths look like "<session_id>/<file>". Returns false for malformed paths.
create or replace function public.is_member_of_path(object_name text)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare sid uuid;
begin
  begin
    sid := split_part(object_name, '/', 1)::uuid;
  exception when invalid_text_representation then
    return false;
  end;
  return public.is_session_member(sid);
end;
$$;

revoke all on function public.is_session_member(uuid) from public, anon;
revoke all on function public.is_session_msme(uuid) from public, anon;
revoke all on function public.is_member_of_path(text) from public, anon;
grant execute on function public.is_session_member(uuid) to authenticated;
grant execute on function public.is_session_msme(uuid) to authenticated;
grant execute on function public.is_member_of_path(text) to authenticated;

-- ───────────────────────── Grants ─────────────────────────
-- Nothing for the bare `anon` role: every client signs in (anonymously) first.
revoke all on all tables in schema public from anon;

-- Column-level UPDATE grants keep clients from touching protected columns
-- (e.g. sessions.msme_id / join_token are only changed by the join-session function).
revoke update on public.sessions, public.reels, public.upload_logs from authenticated;
grant update (language, consent_given) on public.sessions to authenticated;
grant update (approved) on public.reels to authenticated;
grant update (appear_ms) on public.upload_logs to authenticated;

-- ───────────────────────── Row Level Security ─────────────────────────
alter table public.sessions     enable row level security;
alter table public.products     enable row level security;
alter table public.brand_briefs enable row level security;
alter table public.reels        enable row level security;
alter table public.scene_state  enable row level security;
alter table public.command_logs enable row level security;
alter table public.claim_logs   enable row level security;
alter table public.upload_logs  enable row level security;

-- sessions: creator inserts (msme must start empty); members read; creator updates
-- language/consent (column grant above) and may delete (data deletion request).
create policy sessions_insert on public.sessions for insert to authenticated
  with check (creator_id = auth.uid() and msme_id is null);
create policy sessions_select on public.sessions for select to authenticated
  using (creator_id = auth.uid() or msme_id = auth.uid());
create policy sessions_update on public.sessions for update to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy sessions_delete on public.sessions for delete to authenticated
  using (creator_id = auth.uid());

-- products: members read/insert/update (name)/delete.
create policy products_all on public.products for all to authenticated
  using (public.is_session_member(session_id))
  with check (public.is_session_member(session_id));

-- brand_briefs: membership via the product's session.
create policy brand_briefs_all on public.brand_briefs for all to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and public.is_session_member(p.session_id)))
  with check (exists (select 1 from public.products p where p.id = product_id and public.is_session_member(p.session_id)));

-- reels: members insert + read; only the session's MSME may update (`approved` only, via grant).
create policy reels_insert on public.reels for insert to authenticated
  with check (public.is_session_member(session_id) and approved = false);
create policy reels_select on public.reels for select to authenticated
  using (public.is_session_member(session_id));
create policy reels_update_msme on public.reels for update to authenticated
  using (public.is_session_msme(session_id)) with check (public.is_session_msme(session_id));

-- scene_state: members read/insert/update.
create policy scene_state_all on public.scene_state for all to authenticated
  using (public.is_session_member(session_id))
  with check (public.is_session_member(session_id));

-- Log tables: members insert + read their own session's rows.
create policy command_logs_insert on public.command_logs for insert to authenticated
  with check (public.is_session_member(session_id));
create policy command_logs_select on public.command_logs for select to authenticated
  using (public.is_session_member(session_id));

create policy claim_logs_insert on public.claim_logs for insert to authenticated
  with check (public.is_session_member(session_id));
create policy claim_logs_select on public.claim_logs for select to authenticated
  using (public.is_session_member(session_id));

create policy upload_logs_insert on public.upload_logs for insert to authenticated
  with check (public.is_session_member(session_id));
create policy upload_logs_select on public.upload_logs for select to authenticated
  using (public.is_session_member(session_id));
create policy upload_logs_update on public.upload_logs for update to authenticated
  using (public.is_session_member(session_id)) with check (public.is_session_member(session_id));

-- ───────────────────────── Storage ─────────────────────────
-- Private buckets with size/type limits (§12). Path prefix = session_id/.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('products', 'products', false, 5242880,  array['image/png', 'image/jpeg', 'image/webp']),
  ('reels',    'reels',    false, 26214400, array['video/webm', 'video/mp4', 'audio/webm'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy storage_member_select on storage.objects for select to authenticated
  using (bucket_id in ('products', 'reels') and public.is_member_of_path(name));
create policy storage_member_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('products', 'reels') and public.is_member_of_path(name));
create policy storage_member_update on storage.objects for update to authenticated
  using (bucket_id in ('products', 'reels') and public.is_member_of_path(name))
  with check (bucket_id in ('products', 'reels') and public.is_member_of_path(name));
create policy storage_member_delete on storage.objects for delete to authenticated
  using (bucket_id in ('products', 'reels') and public.is_member_of_path(name));

-- ───────────────────────── Realtime ─────────────────────────
alter publication supabase_realtime add table public.products, public.scene_state, public.reels;
