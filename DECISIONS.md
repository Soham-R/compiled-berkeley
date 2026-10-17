# Decisions

Every cut and judgment call during the build. Newest on top.

- **2026-10-17** Scaffolded Next.js 16 + Tailwind v4 + Lexend at repo root alongside the design-doc README (README stays the team's doc; a short run section goes at the top before submission). Replaced the Python `.gitignore` template with a Next.js one.
- **2026-10-17** `/api/next-page` returns the next hand-written passage (`content/passages.json`) when there is no `ANTHROPIC_API_KEY`, the call errors, or it exceeds 8s. Response includes `source: "claude" | "fallback"` so we know which one the video shows.
- **2026-10-17** Model: `claude-sonnet-5-5` for latency (8s budget).
- **2026-10-17** Sound-out chunking is hardcoded in `content/chunks.json` (through, think, there).
