# Decisions

Every cut and judgment call during the build. Newest on top.

- **2026-10-17** Scaffolded Next.js 16 + Tailwind v4 + Lexend at repo root alongside the design-doc README (README stays the team's doc; a short run section goes at the top before submission). Replaced the Python `.gitignore` template with a Next.js one.
- **2026-10-17** `/api/next-page` returns the next hand-written passage (`content/passages.json`) when there is no `ANTHROPIC_API_KEY`, the call errors, or it exceeds 8s. Response includes `source: "claude" | "fallback"` so we know which one the video shows.
- **2026-10-17** Model: `claude-sonnet-5-5` for latency (8s budget).
- **2026-10-17** Sound-out chunking is hardcoded in `content/chunks.json` (through, think, there).
- **2026-10-17** Session data contract: `Session` type in `lib/types.ts`. `/read` writes raw facts only (words, hint level, flag, seconds until flag); the parent summary interprets them. Age-dependent numbers (stumble timeout, silence threshold, expected attention span) live in `profile.thresholds`, not in the session, so one kid profile change retunes both `/read` and the summary.
- **2026-10-17** `content/sessions.json` seeds one week for Maya (days 1–7, Mon 12th → Sun 18th) with the 6 → 9 → 11 minute time-to-break trend the parent view shows. Dates are illustrative.
- **2026-10-17** Live tutor voice = scripted lines recorded once with ElevenLabs. Claude is only called between pages (next-page, parent summary), never mid-sentence.
