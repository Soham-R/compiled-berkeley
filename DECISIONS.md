# Decisions

Every cut and judgment call during the build. Newest on top.

- **2026-10-17** Scaffolded Next.js 16 + Tailwind v4 + Lexend at repo root alongside the design-doc README (README stays the team's doc; a short run section goes at the top before submission). Replaced the Python `.gitignore` template with a Next.js one.
- **2026-10-17** `/api/next-page` returns the next hand-written passage (`content/passages.json`) when there is no `ANTHROPIC_API_KEY`, the call errors, or it exceeds 8s. Response includes `source: "claude" | "fallback"` so we know which one the video shows.
- **2026-10-17** Model: `claude-sonnet-5-5` for latency (8s budget).
- **2026-10-17** Sound-out chunking is hardcoded in `content/chunks.json` (through, think, there).
- **2026-10-17** Session data contract: `Session` type in `lib/types.ts`. `/read` writes raw facts only (words, hint level, flag, seconds until flag); the parent summary interprets them. Age-dependent numbers (stumble timeout, silence threshold, expected attention span) live in `profile.thresholds`, not in the session, so one kid profile change retunes both `/read` and the summary.
- **2026-10-17** `content/sessions.json` seeds one week for Maya (days 1–7, Mon 12th → Sun 18th) with the 6 → 9 → 11 minute time-to-break trend the parent view shows. Dates are illustrative.
- **2026-10-17** Live tutor voice = scripted lines recorded once with ElevenLabs. Claude is only called between pages (next-page, parent summary), never mid-sentence.
- **2026-10-17** Spec A built: `lib/tutor.ts` (tutorSystem, NEXT_PAGE_TASK, LINES, lineUrl, BANNED/violates), `lib/nextPage.ts` (shared generation so the eval runs the real prompt), `scripts/eval-tutor.ts`. `NextPageRequest` gained optional `words` (hintLevel per word) and `previousPassage`; the old `stumbledWords` shape still works and is treated as hintLevel 2.
- **2026-10-17** The BANNED list in `lib/tutor.ts` is the one place the banned phrases appear in source, by necessity. The `grep` acceptance check excludes that file.
- **2026-10-17** `stumble.wait` recorded as a line; whether `/read` plays it is pink's call.
- **2026-10-17** Eval not yet run: no `ANTHROPIC_API_KEY` on this machine. Tuning rounds happen once the key is in `.env.local`.
- **2026-10-17** Spec B built: `scripts/tts.ts` (ElevenLabs → OpenAI → macOS `say`, picked from env), `scripts/record-lines.ts`, `scripts/record-voiceover.ts`, `content/voiceover.ts`. Clips written at `lineUrl()` paths with a manifest so re-runs only regenerate edited lines.
- **2026-10-17** Current clips are the `say` fallback (Samantha for Wren, Daniel for narrator), so `AUDIO_EXT = "m4a"`. When `ELEVENLABS_API_KEY` is in `.env.local`: run `record-lines.ts --force` and `record-voiceover.ts --force`, set `AUDIO_EXT` back to `"mp3"`, delete the `.m4a` files. Wren voice ID: r1KmysJdVYZjJCm4mL3b (not yet heard).
- **2026-10-17** Narrator will be generated too, in a second ElevenLabs voice (`ELEVENLABS_VOICE_ID_NARRATOR`).
