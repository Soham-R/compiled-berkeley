# Kickoff prompt for the spec C chat

Paste everything below the line into a new Claude Code chat opened in this folder.

---

You are building the parent summary for Wren, a reading tutor hackathon project. Another
Claude Code chat is working in this same folder at the same time, on the same branch, so
follow the file ownership rules exactly.

**Setup, in this order:**

1. Run `git status -sb` and confirm you are on branch `tutor-voice`. If not,
   `git switch tutor-voice`. Then `git pull`.
2. Read `HACKATHON_CONTEXT.md`, `AGENTS.md`, `DECISIONS.md`, `CLAUDE_CODE_MEMORY.md`,
   `specs/A-tutor-disposition.md`, and then `specs/C-parent-summary.md`. Spec C is your
   task. Build exactly what it says, in the order it says. Do not relitigate decisions
   recorded in `DECISIONS.md`.
3. Next.js 16 changed APIs since your training data. Check `node_modules/next/dist/docs/`
   before writing a page or route handler. `searchParams` is a Promise.

**Ownership rules (non-negotiable):**

- You may create or edit only: `lib/summary.ts`, `lib/parentNote.ts`,
  `app/api/parent-summary/route.ts`, `app/parent/page.tsx`, `content/summaries.json`,
  the `PARENT_NOTE_TASK` export in `lib/tutor.ts`, the import of it in
  `scripts/eval-tutor.ts`, and appended lines in `DECISIONS.md`.
- Do not touch `/read`, `lib/types.ts`, `content/sessions.json`, `content/profile.json`,
  `scripts/record-*.ts`, `public/audio/`, or any spec file.
- The other chat is editing `lib/tutor.ts` (adding an `AUDIO_EXT` constant) and
  `DECISIONS.md`. Pull before you edit either, keep your edits to the lines named above,
  and pull again before you push.
- Commit only your own files, by explicit path. Never `git add -A` or `git add .`.
  Never stash, reset, or clean. End commit messages with the attribution line your
  session reminder gives you.

**Verification before you say you're done:** every item under "Acceptance" in spec C,
including the `summarizeWeek` one-liner output pasted into the commit message,
`npx next build`, and `npm run lint`. There may be no `ANTHROPIC_API_KEY` on this machine;
the fallback path must work on its own.

**When done:** push to `origin tutor-voice`, append a short entry to
`CLAUDE_CODE_MEMORY.md` (newest on top; pull first, it's shared), and report what you
built, what you verified, and anything you cut.
