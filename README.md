# Sanad (سَنَد) — Leadership Communication Coach
### formerly CommCoach / Etqan — «من الوعي بالذات إلى التميز المهني»

Private, local-first web app that learns how you actually communicate (WhatsApp
chats first; email and transcripts in later phases), builds a Communication
Style Profile, and coaches you through interactive meeting roleplays with
scored debriefs.

**Not a therapist.** Sanad is a communication coach and trainer only. It
never diagnoses or treats mental-health conditions.

Built from `COMM-COACH-SPEC.md` v1.0. **Phase 1 (MVP) is implemented:**

- App password gate (single local user)
- WhatsApp `.txt` / `.zip` upload → parser (Android + iOS formats, Arabic +
  English + Arabic-Indic digits) → ingest report
- Communication Style Profile engine (batched analysis, radar chart, verbatim
  evidence, top-3 focus areas)
- Text roleplay simulator — 8 scenarios, streaming counterpart, pause-&-coach,
  end-of-session debrief with the 6-axis rubric, saved to DB
- Dashboard (profile radar + session scores)
- Privacy: raw files stay in `data/` (gitignored), counterpart names become
  pseudonyms before any API call, one-click purge, no telemetry

Phases 2 (voice/Whisper) and 3 (Drive/Gmail/IMAP sync, presentations, daily
drills) are not built yet.

## Setup

1. `npm install`
2. Copy `.env.example` → `.env.local` and set `ANTHROPIC_API_KEY` (from
   https://console.anthropic.com — required for profile generation and
   roleplay; everything else works without it)
3. `npm run db:push` — creates `data/commcoach.db`
4. `npm run dev` — open http://localhost:3000
5. The first-run wizard at `/setup` asks for the licence key, the names you
   appear as in chats, and the app password, and stores them in
   `data/settings.json`. Nothing else needs hand-editing.

   - `npm run licence:new` — mint a licence key (format check only; the real
     entitlement check belongs in the licence gateway, not built yet)
   - `npm run setup:migrate` — one-time move of `APP_PASSWORD` /
     `SELF_ALIASES` out of an older `.env.local`
   - `npm run setup:reset` — clear the setup so the wizard runs again

## Usage

1. In WhatsApp: chat → ⋮ → More → **Export chat → Without media**. Collect the
   `.txt`/`.zip` files.
2. **Data Sources** → upload them → check the ingest report (it tells you if
   none of the messages matched your aliases).
3. **Profile** → *Generate / refresh profile* (needs ≥20 of your own messages).
4. **Roleplay** → pick a scenario → practice → *End & debrief* for scores.
5. **Dashboard** shows the trend as sessions accumulate.

## Commands

- `npm run dev` — start locally
- `npm test` — parser unit tests (Android/iOS, AR/EN fixtures)
- `npm run build && npm start` — production mode
- `npm run db:push` — sync SQLite schema

## Structure

- `prompts/` — versioned system prompts (edit these, not the code)
- `src/lib/parsers/whatsapp.ts` — the export parser
- `src/lib/anonymize.ts` — pseudonyms + phone/email masking
- `src/lib/profile.ts` — batched map-reduce style analysis
- `src/lib/scenarios.ts` — roleplay scenario library
- `data/` — SQLite DB + raw uploads (never committed, never uploaded)
