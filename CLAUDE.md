# BoloVerse — Full Build Spec for Claude Code

> **How to use this file**
> 1. Save this file as `CLAUDE.md` in the root of the repo (Claude Code reads it automatically in every session).
> 2. Then send Claude Code this kickoff message:
>    *"Read CLAUDE.md fully. Start with Milestone M0. After each milestone, stop, list what you built, and give me exact steps to test it on an Android phone. Do not start the next milestone until I say 'next'."*
> 3. Optional but recommended: connect Sarvam's docs so the API calls are written against the real reference:
>    `claude mcp add --transport http sarvam-docs https://docs.sarvam.ai/_mcp/server`

---

## ⚠️ CURRENT PLAN (changed 2026-11-12) — this section overrides everything below

**The VR studio is dropped.** Build a single mobile-first web app: **photo upload → spoken instruction → generated product video.**
Sections §0, §3 (layout), §5–§11 and §14 below are historical; where they conflict with this section, this section wins.
Still in force: §1 rules 2, 3, 5, 7 (no keys in frontend, never store command audio, timeouts + fallbacks, VERIFY flags), §16 look and feel, §17 conventions.

**One page (`/`), blue/black/white theme (§16):**
1. **Upload:** file input (camera or gallery). Remove background in-browser with `@imgly/background-removal` (preload the model). Show cut-out on a checkerboard.
2. **Voice:** hold-to-talk mic button AND a "listening" toggle. Record clip → Edge Function `stt` (Sarvam `saaras:v3`, codemix). Show transcript.
3. **Edge Function `brief`:** transcript + previous brief → Gemini → strict JSON:
   `{scene, lighting, mood, motion: "push_in"|"pull_out"|"pan_left"|"pan_right"|"orbit", speed: "slow"|"medium", duration_s: 5-15, background_prompt, grade: {temperature -1..1, brightness 0.5..1.5, contrast 0.8..1.3}, confirm_text, confidence}`.
   Later utterances EDIT the previous brief instead of starting again. Schema lives in `src/shared/briefSchema.js`.
4. **Edge Function `background`:** `background_prompt` → Gemini image model (env `GEMINI_IMAGE_MODEL`) → 9:16 image, empty centre, no products/people/text. Cache by prompt hash in Supabase storage. **Fallback:** if generation fails, is unavailable, or takes > 20 s, pick the closest of 8 preloaded images in `/public/backgrounds` by scene keyword.
5. **Compose** on a 720×1280 canvas: background → soft elliptical contact shadow → product cut-out (fit ~55% height, centred low) → colour grade on the whole frame, slightly stronger on background than product.
6. **Animate** per `brief.motion` with easing; background moves at 0.6× the product's rate (parallax); one diagonal light sweep across the product; subtle film grain.
7. **Record:** `canvas.captureStream(30)` + audio from a Web Audio mixer (live mic narration, or a Sarvam Bulbul voice-over generated from brand facts) → `MediaRecorder` → webm → Supabase storage → player, download link, QR code.
8. **Speak** `confirm_text` with Sarvam TTS after each instruction. If `confidence < 0.6`, ask "Did you mean …?" before generating.
9. **Keep:** keys only in Edge Functions, rate limits, command logs with `stt_ms / brief_ms / background_ms / render_ms`, and a `/metrics` page.

**Milestones (stop after each for phone testing; wait for "next"):**
- **A)** upload + cut-out + preloaded backgrounds + animate + record
- **B)** voice → brief → scene changes
- **C)** generated backgrounds
- **D)** voice-over and edits by follow-up instruction

---

## 0. Project summary

**BoloVerse** is a **voice-only VR product studio** for MSME (micro/small business) content creators in India.

- A small business (MSME) photographs a product on **Phone B** (normal web page).
- The product **appears live** inside a VR studio running on **Phone A**, which is inside a **slide-in phone VR headset** (no controller, no touch once inserted).
- The creator **directs the scene only by voice** (Kannada / Hindi / English / code-mixed): change background, lighting, rotate, scale, then **record a 15-second reel**.
- An **AI claim checker** compares what the creator said in the reel against the brand's facts and warns about false claims (e.g. "100% pure silk" when it is a silk-cotton blend).
- Judges/audience watch on a projector via a **spectator page**, and scan a **QR code** to watch the finished reel on their own phones.

**This is a 12-hour hackathon build. Prioritise a reliable demo over completeness. Simple, readable, well-commented code.**

---

## 1. HARD RULES (never break these)

1. **Voice-only in the studio.** After the single "Start" tap (before the phone goes into the headset), the studio must have **zero** taps, buttons, or menus. Every action is triggered by voice and **confirmed by voice**.
2. **No API keys in frontend code.** Sarvam and Gemini keys live only in **Supabase Edge Function secrets**. The browser only calls our Edge Functions.
3. **Never store raw voice-command audio.** Command audio is transcribed and discarded. Only transcripts are logged. (The reel's audio is part of the user's content and is stored.)
4. **Phone-first.** Target = Android phone, Chrome, landscape, inside a cardboard-style headset. Test assumptions against that, not a desktop.
5. **Every external call has a timeout and a fallback.** The demo must not freeze.
6. **Keep all shared names exactly as defined in this file** (table names, JSON schema, function names, env vars). Other teammates build against them in parallel.
7. When unsure about a third-party API detail (Sarvam, Gemini, imgly, vad-web), **check the official docs** rather than guessing. Flag anything you could not verify in a `// VERIFY:` comment.

---

## 2. Tech stack (fixed)

| Layer | Tech |
|---|---|
| Frontend build | Vite + vanilla JavaScript (ES modules), multi-page app |
| VR rendering | three.js + `StereoEffect` (`three/addons/effects/StereoEffect.js`) |
| Head tracking | Custom `deviceorientation` → quaternion controller (port the logic of three.js's old `DeviceOrientationControls`, accounting for `screen.orientation.angle`) |
| Mic + voice activity detection | `getUserMedia` + `@ricky0123/vad-web` (Silero VAD, `MicVAD`) |
| Speech-to-text | **Sarvam AI** Speech-to-Text REST, model `saaras:v3`, code-mix mode |
| Text-to-speech | **Sarvam AI** Text-to-Speech, model `bulbul:v3` |
| Command understanding + claim check | **Gemini API** (Flash model, name from env `GEMINI_MODEL`), JSON output mode |
| DB / Storage / Realtime / Auth | **Supabase** (Postgres, Storage, Realtime, Anonymous Auth, Row Level Security) |
| Backend | **Supabase Edge Functions** (Deno, TypeScript) |
| Background removal | `@imgly/background-removal` (runs in browser on Phone B) |
| Recording | `MediaRecorder` + `canvas.captureStream()` |
| QR codes | `qrcode` npm package |
| Validation | `zod` (frontend and Edge Functions) |
| Tests | `vitest` |
| Hosting | Vercel (static Vite build, HTTPS required for mic/camera) |

---

## 3. Repository structure

```
boloverse/
├─ CLAUDE.md                      # this file
├─ README.md                      # setup + run + deploy steps (you write this)
├─ package.json
├─ vite.config.js                 # multi-page inputs + static copy of VAD/onnx assets
├─ .env.example                   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├─ public/
│  ├─ manifest.webmanifest        # PWA: display fullscreen, orientation landscape
│  ├─ icons/
│  ├─ skies/                      # 360° equirectangular JPGs ≤ 4096x2048
│  │  ├─ palace.jpg  beach.jpg  studio.jpg  market.jpg
│  ├─ audio/cached/               # pre-generated TTS clips (see §8.4)
│  └─ products/demo1.png demo2.png  # backup products
├─ src/
│  ├─ shared/
│  │  ├─ supabaseClient.js
│  │  ├─ commandSchema.js         # zod schema for command JSON (§6)
│  │  ├─ sceneState.js            # scene state shape + reducer (§7)
│  │  ├─ wav.js                   # Float32Array(16kHz) -> WAV Blob
│  │  └─ config.js                # timeouts, thresholds, feature flags
│  ├─ studio/                     # Phone A (in headset)
│  │  ├─ index.html
│  │  ├─ main.js                  # boot, start screen, session
│  │  ├─ vr/scene.js              # three.js scene, sky, stage, product, lights
│  │  ├─ vr/stereo.js             # StereoEffect wrapper
│  │  ├─ vr/gyroControls.js       # deviceorientation head tracking
│  │  ├─ vr/effects.js            # spotlight + sparkle on product arrival
│  │  ├─ vr/hud.js                # in-VR text: last transcript, status, debug
│  │  ├─ voice/listener.js        # MicVAD -> WAV -> /stt
│  │  ├─ voice/speaker.js         # cached clips + /tts playback queue
│  │  ├─ voice/fallback.js        # Web Speech API fallback
│  │  ├─ commands/dispatcher.js   # command JSON -> scene actions
│  │  ├─ recorder.js              # mono offscreen render + MediaRecorder
│  │  └─ realtime.js              # products subscription, scene_state writes
│  ├─ upload/                     # Phone B
│  │  ├─ index.html  main.js
│  ├─ spectator/                  # projector view
│  │  ├─ index.html  main.js
│  ├─ watch/                      # judges watch reel via QR
│  │  ├─ index.html  main.js
│  ├─ approve/                    # MSME approves reel (removes watermark)
│  │  ├─ index.html  main.js
│  └─ metrics/                    # live testing metrics
│     ├─ index.html  main.js
├─ supabase/
│  ├─ migrations/0001_init.sql    # schema + RLS + realtime (§5)
│  └─ functions/
│     ├─ _shared/cors.ts  _shared/rateLimit.ts  _shared/sarvam.ts  _shared/gemini.ts  _shared/auth.ts
│     ├─ join-session/index.ts
│     ├─ stt/index.ts
│     ├─ command/index.ts
│     ├─ tts/index.ts
│     ├─ claimcheck/index.ts
│     └─ reel-link/index.ts
└─ tests/
   ├─ fixtures/commands.json      # 20+ utterances with expected actions
   ├─ fixtures/claims.json        # 10 true + 10 false claims with a brief
   ├─ commandSchema.test.js
   ├─ sceneReducer.test.js
   ├─ wav.test.js
   └─ scripts/run-fixtures.mjs    # hits live /command and /claimcheck, prints accuracy
```

---

## 4. Environment variables & secrets

**Frontend (`.env`, safe to expose):**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_FUNCTIONS_URL=          # https://<project>.functions.supabase.co
```

**Edge Function secrets (set via `supabase secrets set`, NEVER in frontend):**
```
SARVAM_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=                # current free-tier Flash model name
SUPABASE_SERVICE_ROLE_KEY=   # only used inside functions when needed
```

Sarvam auth uses the header **`api-subscription-key: <key>`** — NOT `Authorization: Bearer`.

---

## 5. Database (Supabase) — `supabase/migrations/0001_init.sql`

Enable **Anonymous Sign-ins** in Supabase Auth (human does this in dashboard; tell them).

### Tables

```sql
-- A studio session links one creator (Phone A) with one MSME (Phone B)
create table sessions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id),
  msme_id uuid references auth.users(id),
  join_token text not null,              -- random 16+ chars, shown in QR
  language text not null default 'en-IN',
  consent_given boolean not null default false,
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  name text,
  image_path text not null,              -- storage path in bucket 'products'
  cutout_ok boolean not null default true,
  status text not null default 'ready',
  created_at timestamptz default now()
);

create table brand_briefs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  facts text[] not null default '{}',
  banned_claims text[] not null default '{}',
  updated_at timestamptz default now()
);

create table reels (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  product_id uuid references products(id),
  video_path text not null,              -- storage path in bucket 'reels'
  duration_s int,
  transcript text,
  claim_result jsonb,                    -- output of claimcheck
  approved boolean not null default false,
  created_at timestamptz default now()
);

-- One row per session; studio writes, spectator reads
create table scene_state (
  session_id uuid primary key references sessions(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz default now()
);

create table command_logs (
  id bigint generated always as identity primary key,
  session_id uuid references sessions(id) on delete cascade,
  transcript text,
  detected_language text,
  action text,
  success boolean,
  fallback_used boolean default false,
  stt_ms int, llm_ms int, tts_ms int, total_ms int,
  created_at timestamptz default now()
);

create table claim_logs (
  id bigint generated always as identity primary key,
  session_id uuid references sessions(id) on delete cascade,
  reel_id uuid references reels(id) on delete cascade,
  sentence text,
  verdict text,                          -- 'ok' | 'contradicts' | 'banned' | 'unverifiable'
  brief_fact text,
  created_at timestamptz default now()
);

create table upload_logs (
  id bigint generated always as identity primary key,
  session_id uuid references sessions(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  removal_ms int, upload_ms int,
  appear_ms int,                          -- filled by studio when rendered
  created_at timestamptz default now()
);
```

### Row Level Security
- Enable RLS on **every** table.
- Helper: a row is visible/editable if `auth.uid()` equals `sessions.creator_id` or `sessions.msme_id` for that row's `session_id`.
- `sessions`: creator can insert (with `creator_id = auth.uid()`), both members can select; `msme_id` is set ONLY via the `join-session` Edge Function (service role), never directly by clients.
- `reels.approved` can be updated **only by the session's `msme_id`**.
- Log tables: members can insert and select their own session's rows.

### Storage
- Buckets `products` and `reels`, both **private**. Path prefix = `session_id/`. Storage policies mirror the session-membership rule.
- Public viewing of reels happens only through **short-lived signed URLs** from `reel-link`.

### Realtime
```sql
alter publication supabase_realtime add table products, scene_state, reels;
```

---

## 6. Command JSON contract (shared by everyone — do not change)

`/command` must return exactly this shape (validate with zod on both server and client):

```json
{
  "action": "set_background | rotate | scale | move | lighting | select_product | name_product | set_brief | start_recording | stop_recording | reset_view | undo | repeat | help | set_language | none | unknown",
  "params": {},
  "confirm_text": "short spoken confirmation in the user's language",
  "confidence": 0.0,
  "reply_language": "en-IN | hi-IN | kn-IN"
}
```

### Params per action
| action | params | examples of what the user may say |
|---|---|---|
| `set_background` | `{ "name": "palace" \| "beach" \| "studio" \| "market" }` | "palace background", "beach ಹಾಕು", "market wala background" |
| `rotate` | `{ "mode": "spin" \| "stop" \| "turn", "degrees"?: number, "direction"?: "left" \| "right", "speed"?: "slow" \| "fast" }` | "rotate slowly", "stop rotating", "turn left 90" |
| `scale` | `{ "factor": number }` (bigger ≈ 1.25, smaller ≈ 0.8, clamp total 0.3–3) | "make it bigger", "thoda chhota karo" |
| `move` | `{ "direction": "up" \| "down" \| "left" \| "right" \| "closer" \| "farther" }` | "move it closer" |
| `lighting` | `{ "preset": "golden_hour" \| "studio" \| "dramatic" \| "soft", "brightness"?: number 0.2–2 }` | "golden hour", "light kam karo" |
| `select_product` | `{ "which": "next" \| "previous" \| "latest" \| "<name>" }` | "show the saree", "next product" |
| `name_product` | `{ "name": string }` | "call it Ilkal saree" |
| `set_brief` | `{ "facts": string[], "banned_claims": string[] }` | "brand brief: silk-cotton blend, handwoven in Ilkal, don't say pure silk" |
| `start_recording` | `{ "seconds": int 5–30, default 15 }` | "record 15 seconds", "recording shuru karo" |
| `stop_recording` | `{}` | "stop" (only action accepted while recording) |
| `reset_view` | `{}` | "reset view", "centre the product" |
| `undo` | `{}` | "undo", "go back" |
| `repeat` | `{}` | "say that again" |
| `help` | `{}` | "help", "what can I say" |
| `set_language` | `{ "code": "en-IN" \| "hi-IN" \| "kn-IN" }` | "talk to me in Kannada" |
| `none` | `{}` | background chatter / not addressed to the app → **do nothing, say nothing** |
| `unknown` | `{}` | clearly a command attempt but unclear → say "Sorry, say that again" |

### Gemini prompt rules for `/command`
- System instruction explains the schema above, lists the allowed values, includes ~10 code-mixed examples (Kannada/Hindi/English).
- Use Gemini **JSON output mode with a response schema**; temperature ≤ 0.2.
- Input includes: transcript, current scene state summary (current background, product names list, recording flag), current language.
- `confirm_text` ≤ 8 words, in `reply_language` (match the user's language).
- Output `none` for speech that isn't a command (people talking nearby). Prefer `none` over `unknown` when unsure if the user was addressing the app.
- `confidence` is 0–1: how sure the model is that it picked the right action and params.
- **Wake word:** when `WAKE_WORD_ENABLED` is true (see §8.8), return `none` unless the transcript starts with a wake word; strip the wake word before interpreting.

---

## 7. Scene state (shared shape)

```js
{
  background: "studio",                // key from public/skies
  lighting: { preset: "studio", brightness: 1 },
  product: { id, name, imageUrl, scale: 1, rotationY: 0, spin: null | "slow" | "fast", position: {x:0,y:1.4,z:-2} },
  products: [{ id, name }],            // available in session
  recording: { active: false, secondsLeft: 0 },
  lastTranscript: "",
  lastAction: "",
  language: "en-IN"
}
```
- `sceneReducer(state, command) -> newState` is a **pure function** (unit tested).
- Keep an **undo stack** of the last 10 states.
- Studio writes `scene_state` (debounced ~150 ms) on every change; spectator renders from it.

---

## 8. Studio (Phone A) — detailed behaviour

### 8.1 Start screen (the only touch interaction)
1. Signs in anonymously, creates a `sessions` row with a random `join_token`.
2. Shows: big **QR code** → `https://<host>/upload/?s=<session_id>&t=<join_token>`, plus the session's short code, and a consent line:
   *"BoloVerse listens for voice commands. Command audio is transcribed and deleted; only text is kept."*
3. One big **"Start"** button. On tap, in this order: request mic (`getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}})`), request fullscreen, lock orientation to landscape (best-effort), request Wake Lock, iOS-style motion permission if present, start VAD, preload cached audio + VAD model, switch to stereo VR view.
4. Speak: *"Welcome to BoloVerse. Say 'I agree' to begin."* → on "I agree / ಒಪ್ಪುತ್ತೇನೆ / मैं सहमत हूँ" set `consent_given = true`. Until consent, ignore all other commands.
5. Re-acquire the Wake Lock on `visibilitychange`.

### 8.2 VR scene
- three.js renderer full-screen, `setPixelRatio(min(devicePixelRatio, 1.5))` for performance.
- `StereoEffect` side-by-side; eye separation configurable in `config.js`.
- Sky: large inverted sphere with an equirectangular texture; crossfade (~600 ms) when switching backgrounds. Preload all 4 skies at start.
- Stage: subtle circular platform at eye level ~2 m ahead.
- Product: textured plane (transparent PNG), soft contact shadow below; if `cutout_ok=false` render on a rounded white card with a thin border.
- Lighting presets map to ambient + directional + spot light colours/intensities (golden hour = warm orange, dramatic = strong side light, soft = low contrast, studio = neutral bright).
- **Arrival effect:** new product fades/scales in under a spotlight with a short sparkle particle burst (~1.5 s).
- **HUD (inside VR, both eyes):** small bottom text showing listening indicator (● idle / ◉ hearing / … thinking), last transcript, last action, recording countdown. A `debug` flag shows timings (stt/llm/tts ms) and last error — keep ON during the hackathon.
- Gyro head tracking; `reset_view` recentres yaw so the product is straight ahead.
- Target ≥ 30 fps on a mid-range Android phone.

### 8.3 Voice pipeline
1. `MicVAD` (use our own mic stream via its stream option) → `onSpeechStart`: HUD "hearing" + soft tick sound; `onSpeechEnd(audio)`: encode 16 kHz mono WAV → POST to `/stt`.
2. Ignore clips < 0.4 s or > 12 s.
3. `/stt` → transcript + detected language → POST `/command` with scene summary.
4. Validate with zod → `dispatcher` applies reducer → render → speak `confirm_text`.
5. **Pause VAD while the app is speaking** (avoid hearing itself), resume after playback ends.
6. While `recording.active`, only `stop_recording` is honoured; everything else is ignored silently.
7. Two `unknown` in a row → speak help: *"Try: 'palace background', 'rotate slowly', or 'record 15 seconds'."*
8. Log every utterance to `command_logs` with timings.
9. Timeouts: stt 6 s, command 6 s, tts 5 s.

### 8.4 Speaking (speaker.js)
- **Cached clips first:** at build time, a script `npm run cache-tts` calls `/tts` and saves MP3s to `public/audio/cached/` for common phrases in en/hi/kn: welcome, "Got it", "Say that again", "New product ready. What's it called?", "Recording started", "Recording saved", help line, "Careful — that doesn't match the brand brief".
- Dynamic text → `/tts` (Bulbul v3, voice matching `reply_language`) → play.
- Playback queue (never overlap), with a hard cap of 6 s per clip.

### 8.5 Fallback (fallback.js)
- If `/stt` or `/tts` fails **2 times in a row**, switch to browser Web Speech API (`SpeechRecognition` en-IN, `speechSynthesis`) and set `fallback_used=true` in logs. HUD shows "fallback mode". Try Sarvam again after 60 s.
- If `/command` fails, try a **local regex matcher** for the 8 most common commands (background names, bigger/smaller, rotate/stop, record, help) before giving up.

### 8.6 Realtime products
- Subscribe to `products` inserts for this session → load the signed image URL → add to `products` list, select it, run arrival effect, speak "New product ready. What's it called?" → the next utterance that is not a command becomes `name_product` (Gemini handles this via scene summary flag `awaiting_product_name: true`).
- Write `appear_ms` to `upload_logs` (difference between `upload_logs.created_at` and render time).
- If Realtime is not connected within 5 s, **fallback to polling** every 2 s.

### 8.8 Noise and unclear commands
- Mic constraints: `echoCancellation`, `noiseSuppression`, `autoGainControl` all true. The creator wears wired earphones with a mic.
- `config.js`: `WAKE_WORD_ENABLED` (default **true**), `WAKE_WORDS = ["bolo","बोलो","ಬೋಲೋ","bollo","below","polo"]` (fuzzy start-of-transcript match). Example: *"Bolo, palace background."*
- Confidence handling in `dispatcher.js`:
  - `>= 0.8` → execute and confirm aloud.
  - `0.5–0.8` → speak *"Did you say <confirm_text>?"* and wait up to 6 s for yes/no (`yes / haan / howdu`, `no / nahi / illa / beda`); no answer = cancel.
  - `< 0.5` → treat as `unknown`.
  - `start_recording` always asks for confirmation unless confidence ≥ 0.9.
- Voice command **"noisy mode on / off"** raises the VAD speech threshold and forces the wake word on. Expose `positiveSpeechThreshold` and `minSpeechFrames` in `config.js`.
- The HUD always shows what was heard, so the creator can see a mishearing.
- Log `confidence` and `needed_confirmation` in `command_logs` (add both columns) and show them on `/metrics`.

### 8.9 Depth relief (optional, only after M4 passes)
- On Phone B, after background removal, estimate depth in the browser with `@huggingface/transformers` (`pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small')`). Preload the model with the page.
- Upload the depth map as a small greyscale PNG next to the cut-out (`products.depth_path`, nullable).
- In the studio, render the product as a subdivided plane (≈128×128) displaced by the depth map (`displacementMap`, modest `displacementScale`), so head movement gives real parallax.
- It has no back: clamp `rotate` to ±30° for depth-relief products and say *"That's as far as this one turns."*
- If depth fails or takes more than 10 s, upload without it; the flat cut-out path must keep working.
- Roadmap only (do not build): send the photo to an image-to-3D API from an Edge Function and swap in the returned GLB when ready.

### 8.7 Recording (recorder.js)
- **Do NOT record the stereo canvas.** Use a second offscreen `WebGLRenderer` (mono, 720×1280 portrait) rendering the same scene from a fixed "reel camera" that slowly orbits/pushes in on the product. Render it only while recording.
- `canvas.captureStream(30)` + the mic audio track (same mic stream) → `MediaRecorder` (pick the first supported of `video/webm;codecs=vp9,opus`, `video/webm;codecs=vp8,opus`, `video/webm`).
- Countdown "3, 2, 1" spoken, then record N seconds, auto-stop (or on `stop_recording`).
- Burn in a **"DRAFT — pending brand approval"** watermark on the reel canvas.
- Upload to bucket `reels` → insert `reels` row → speak "Recording saved" → call `/claimcheck` with the reel id → speak any warning → call `/reel-link` → show QR on **spectator** page (and in HUD as text).

---

## 9. Upload page (Phone B) — `src/upload/`
- Reads `s` and `t` from the URL → anonymous sign-in → POST `/join-session` → becomes the session's `msme_id`.
- **Preload** the imgly background-removal model on page load; show "Model ready ✓".
- One big **"Capture product"** button → `<input type="file" accept="image/*" capture="environment">`.
- Pipeline with visible progress: *Removing background… → Compressing… → Uploading… → Sent to studio ✓*.
  - Downscale to max 1024 px before removal (speed).
  - If removal fails or exceeds 15 s → upload the original (compressed JPG) with `cutout_ok=false`.
- Optional text input "Product name" and "Brand facts" (MSME side may use normal UI) → saves to `products.name` / `brand_briefs`.
- Insert `upload_logs` with `removal_ms`, `upload_ms`.
- Big, simple, mobile-first UI. Works with one hand.

---

## 10. Other pages
- **Spectator (`/spectator/?s=`)** — laptop/projector. Mono full-screen three.js render driven by `scene_state` Realtime. Overlay: last transcript (large captions), last action, recording countdown, and — when a reel is ready — a **large QR** to `/watch/?r=<reel_id>&k=<signed_token>`. Also shows the session's upload QR for re-pairing. (Requires the creator's session — sign in with a viewer link token generated by the studio; keep simple and secure.)
- **Watch (`/watch/`)** — plays reel from a signed URL (from `reel-link`), shows product name, "Draft" badge if not approved, and claim-check result summary.
- **Approve (`/approve/?r=`)** — only the session's MSME can approve; sets `approved=true`. (After approval, the watch page hides the draft badge. Re-encoding without the watermark is out of scope — note this in README.)
- **Metrics (`/metrics/?s=` or all sessions)** — reads log tables and shows: command accuracy % (success / total excluding `none`), avg + p90 total latency, avg stt/llm/tts ms, fallback count, avg upload→appear ms, claim-check catch rate (from fixture runs). Large numbers, readable on a projector.

---

## 11. Edge Functions (Deno, TypeScript)

All functions: CORS for our domain, require a valid Supabase JWT (anonymous user OK) and verify session membership, **rate limit** (e.g. 30 req/min per user, simple in-memory or table-based), zod-validate input, return `{ ok, data | error }`, timeouts with `AbortController`.

| Function | Input | Does | Output |
|---|---|---|---|
| `join-session` | `{ session_id, join_token }` | Verifies token, sets `msme_id = auth.uid()` (only if empty), rotates token | `{ ok }` |
| `stt` | multipart WAV (≤ 12 s), `session_id`, `language_hint` | Sarvam STT REST, model `saaras:v3`, code-mix output mode (VERIFY exact param names in Sarvam docs) | `{ transcript, language, ms }` |
| `command` | `{ session_id, transcript, scene_summary, language }` | Gemini JSON mode with schema from §6 | command JSON + `ms` |
| `tts` | `{ text, language }` | Sarvam TTS `bulbul:v3`, a clear voice per language (VERIFY speaker names + response format; decode base64 audio if returned that way) | audio bytes (mp3/wav) |
| `claimcheck` | `{ session_id, reel_id }` | Downloads reel audio (or receives extracted audio blob from client if simpler), Sarvam STT (≤ 30 s REST), splits into sentences, Gemini compares each sentence to `brand_briefs` → verdicts; writes `reels.transcript`, `reels.claim_result`, `claim_logs` | `{ transcript, issues: [{sentence, verdict, brief_fact, suggestion}] , spoken_warning }` |
| `reel-link` | `{ reel_id }` | Creates a signed URL (expires 24 h) | `{ url }` |

Claim-check Gemini rules: verdict `contradicts` only when a sentence clearly conflicts with a fact; `banned` when it matches a banned claim; `unverifiable` for strong unsupported superlatives ("best in India"); otherwise `ok`. `spoken_warning` ≤ 15 words, in session language, naming the first issue.

> Note: if extracting audio from webm server-side is hard in Deno, have the studio send the **mic-only audio track** (record a parallel audio-only `MediaRecorder`, ≤ 30 s) to `claimcheck`. Prefer this simpler path.

---

## 12. Security checklist (must all be true before M7 is done)
- [ ] No secrets in frontend bundle (grep the `dist/` build for key prefixes).
- [ ] RLS enabled on all tables; cross-session access test fails as expected.
- [ ] Buckets private; reels only via signed URLs.
- [ ] `join_token` single-use (rotated after join).
- [ ] Command audio never written to storage or DB.
- [ ] Rate limiting on all Edge Functions.
- [ ] Voice consent recorded before any command is processed.
- [ ] Inputs validated with zod; file size/type limits on uploads (images ≤ 5 MB, audio ≤ 1 MB, reels ≤ 25 MB).
- [ ] README has a short "Security & Privacy" section (DPDP-aligned: consent, minimisation, deletion of command audio).

---

## 13. Testing

### Unit tests (vitest)
- `commandSchema.test.js` — valid/invalid command JSON.
- `sceneReducer.test.js` — every action, clamping (scale 0.3–3, brightness 0.2–2), undo stack, recording lock (only stop allowed).
- `wav.test.js` — header correctness, sample rate 16 kHz, length.
- Local regex fallback matcher.

### Fixtures
- `tests/fixtures/commands.json` — **at least 30** utterances: English, Hindi, Kannada, and code-mixed, plus 5 "chatter" lines that must map to `none`. Each with `expected_action` (and key params).
- `tests/fixtures/claims.json` — one brand brief (silk-cotton blend saree, handwoven in Ilkal, banned: "pure silk", "machine washable") + 10 true and 10 false sentences.
- `tests/scripts/run-fixtures.mjs` — calls live `/command` and `/claimcheck`-logic (a test-mode endpoint or direct Gemini call) and prints **accuracy %, confusion list, avg latency**. Output a markdown table we can paste into the pitch deck.

### Manual device test script (write it into README)
1. Phone A in headset with wired earphones: 20 commands × 3 speakers → record on metrics page.
2. Same with background noise (play crowd noise from a laptop).
3. Full demo loop timed: Phone B capture → appears → 4 voice commands → 15 s reel → QR → watch on another phone.
4. 20-minute endurance: battery, heat, fps.
5. Network drop: turn Wi-Fi off mid-session → fallback messages, no freeze.

---

## 14. Milestones (build in this order; stop after each and report)

Each milestone ends with: summary of files changed, how to run locally, how to deploy, and **exact test steps on an Android phone**.

| # | Milestone | Acceptance criteria |
|---|---|---|
| **M0** | Scaffold | Vite multi-page app runs; Supabase client connects; migration SQL ready; Edge Function skeletons deploy; README setup steps; `.env.example`. |
| **M1** | VR studio shell | Start screen (one tap) → stereo view with sky + stage + demo product; gyro head tracking; HUD; PWA manifest; Wake Lock. ≥ 30 fps on phone. |
| **M2** | Voice loop | VAD → `/stt` → `/command` → reducer → scene changes → `/tts` speaks; cached clips; consent flow; wake word and confidence handling (§8.8); logs written; debug timings in HUD; fallback to Web Speech API. |
| **M3** | Upload → live in VR | Session QR pairing; `/upload` capture → background removal → upload; studio shows product with arrival effect within ~30 s; naming by voice; polling fallback. **(Core wow done.)** |
| **M4** | Recording + reel | "record 15 seconds" → mono portrait reel with watermark → upload → `/reel-link` → QR on spectator + watch page plays it. |
| **M5** | Spectator view | Projector page mirrors scene via `scene_state`, big captions, reel QR. |
| **M6** | Brand brief + claim check | Brief via voice (`set_brief`) or upload page; after recording, issues are spoken and shown on watch page. |
| **M7** | Security hardening | Everything in §12 checked; approve page works. |
| **M8** | Tests + metrics | Unit tests pass; fixtures runner prints accuracy table; metrics page live. |
| **M9** | Depth relief (optional) | §8.9 works on Phone B and Phone A; flat cut-out still works when depth is missing. |

**If time is short, cut in this order:** approve page → `set_language` → voice-set brief (hardcode the brief instead) → spectator (use phone screen-mirroring instead). **Never cut:** M1–M4 and the fallbacks.

---

## 15. Things the human must do (tell them when needed — you cannot do these)
- Create Supabase project, enable Anonymous Sign-ins, create buckets if not done by migration, run migration.
- Get Sarvam API key and Gemini API key; set Edge Function secrets.
- Create Vercel project linked to the repo and set the `VITE_*` env vars.
- Put 4 equirectangular sky images (≤ 4096×2048) into `public/skies/` (e.g. from Poly Haven).
- Test on real Android phones + headset; report errors/screenshots back.
- Run `npm run cache-tts` after `/tts` works.

---

## 16. Look and feel
- Three colours only: blue-black `#05070d`, white `#f2f5fb`, cobalt `#3b74ff` (pale blue `#8fb6ff` for secondary). No other accent colours.
- Fonts: Syne (headings), Hanken Grotesk (body), JetBrains Mono (HUD, labels). Square corners, thin hairlines, no drop shadows.
- This applies to the upload, spectator, watch, approve and metrics pages and to the in-VR HUD. The four 360° sets keep their natural colours.

## 17. Coding conventions
- Vanilla JS ES modules, small focused files, JSDoc comments on public functions.
- No frameworks beyond what is listed. Do not add React.
- Every async external call: `try/catch`, timeout, user-facing spoken/HUD message on failure, log to console with a `[BoloVerse]` prefix.
- Constants (timeouts, thresholds, colours, eye separation) live in `src/shared/config.js`.
- Commit after each milestone with a clear message.
- Do not invent API parameters silently — mark uncertain ones with `// VERIFY:` and list them in your milestone report.
