# BoloVerse

Voice-only VR product studio for Indian MSME creators. The full spec is in [CLAUDE.md](CLAUDE.md).

**Status: M0 (scaffold).** You get a Vite multi-page app, the Supabase schema with RLS, storage and realtime, six Edge Function skeletons, and a **system-check page** at `/` that proves a phone can reach all of it.

## Repo layout

```
src/index.html, main.js      system check (M0)
src/shared/                  config.js, supabaseClient.js, commandSchema.js, diagnostics.js, theme.css
src/{studio,upload,spectator,watch,approve,metrics}/   one page each (placeholders until their milestone)
supabase/migrations/0001_init.sql   tables, RLS, buckets, storage policies, realtime
supabase/functions/<name>/index.ts  join-session, stt, command, tts, claimcheck, reel-link
supabase/functions/_shared/  cors, auth, rateLimit, handler, sarvam, gemini
tests/                       vitest unit tests
```

## One-time setup

You need Node 20+ and a free [Supabase](https://supabase.com) account. The Supabase CLI is a dev dependency, so run it with `npx supabase …`.

1. **Install:** `npm install`
2. **Create a Supabase project** in the dashboard. Note the *Project ref* (the `xxxx` in `https://xxxx.supabase.co`).
3. **Enable anonymous sign-ins:** Dashboard → Authentication → Sign In / Providers → turn on **Allow anonymous sign-ins** → Save.
4. **Link and push the schema:**
   ```sh
   npx supabase login
   npx supabase link --project-ref <your-ref>
   npx supabase db push
   ```
   Or paste `supabase/migrations/0001_init.sql` into Dashboard → SQL Editor → Run. This also creates the private `products` and `reels` buckets.
5. **Edge Function secrets:** copy `supabase/functions/.env.example` to `supabase/functions/.env` and fill in `SARVAM_API_KEY`, `GEMINI_API_KEY` and `GEMINI_MODEL`. They can stay empty for M0, because the skeletons don't call providers yet. Then run:
   ```sh
   npx supabase secrets set --env-file supabase/functions/.env
   ```
6. **Deploy the functions:**
   ```sh
   npx supabase functions deploy
   ```
   This deploys all six. If it complains about Docker, add `--use-api`.
7. **Frontend env:** copy `.env.example` to `.env`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Dashboard → Project Settings → API (the *anon / publishable* key, never the service-role key).

## Run locally

```sh
npm run dev      # http://localhost:5173  (also printed with your LAN IP)
npm test         # unit tests
npm run build    # production build into dist/
```

## Deploy (Vercel)

1. Push this repo to GitHub and import it in Vercel. `vercel.json` already sets the Vite build and the `dist` output.
2. In Vercel → Settings → Environment Variables, add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and, optionally, `VITE_FUNCTIONS_URL`. Then redeploy.
3. Set the CORS allow-list on the functions (recommended before the demo):
   `npx supabase secrets set ALLOWED_ORIGINS=https://<your-app>.vercel.app,http://localhost:5173`

## Testing on an Android phone

The mic, motion sensors and Wake Lock only work in a **secure context**, meaning HTTPS or `localhost`. A phone opening `http://192.168.x.x:5173` is *not* secure. Use one of these:

- **Vercel URL (easiest):** open `https://<your-app>.vercel.app/` in Chrome on the phone.
- **USB port forwarding:** turn on USB debugging on the phone and plug it in. On the laptop, open `chrome://inspect/#devices` → *Port forwarding* → add `5173` → `localhost:5173` and tick *Enable port forwarding*. Then open `http://localhost:5173/` on the phone.

### Manual device test script (later milestones)
1. Phone A in headset with wired earphones: 20 commands × 3 speakers → record on metrics page.
2. Same with background noise (play crowd noise from a laptop).
3. Full demo loop timed: Phone B capture → appears → 4 voice commands → 15 s reel → QR → watch on another phone.
4. 20-minute endurance: battery, heat, fps.
5. Network drop: turn Wi-Fi off mid-session → fallback messages, no freeze.

## Security & Privacy (DPDP-aligned)

- **Consent:** the studio asks for spoken consent before it processes any command (built in M2).
- **Minimisation:** command audio is transcribed and discarded. Only the text transcript is logged. Reel audio is the creator's content and is stored privately.
- **No secrets in the browser:** Sarvam and Gemini keys live only in Edge Function secrets.
- **Access control:** RLS is on for every table, and only session members can read or write a session's rows and files. `msme_id` is set only by `join-session`. Only the MSME can approve a reel.
- **Deletion:** deleting a session (creator only) cascades to its products, briefs, reels and logs.
- Reels are watched through short-lived signed URLs only. Removing the watermark from approved reels is out of scope: approval hides the "Draft" badge only.

## Notes / to verify
- Edge Functions use `verify_jwt = false` in `supabase/config.toml` and check the JWT in code (`_shared/auth.ts`), so CORS preflight works. Every call still needs a valid user JWT.
- `_shared/rateLimit.ts` is in memory, per isolate, and best-effort.
- `// VERIFY:` markers: Sarvam endpoint/field names, Gemini JSON-mode fields, VAD defaults, and whether `SUPABASE_ANON_KEY` is injected on projects using the new API keys.
