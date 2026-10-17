# Prompt: Build the Wren homepage (`/`)

## Context

Read `HACKATHON_CONTEXT.md` and `AGENTS.md` first. This is Next.js 16 (App Router) with Tailwind v4 and the Lexend font, which are already set up in `app/layout.tsx` and `app/globals.css`. Next 16 changed some APIs, so check `node_modules/next/dist/docs/` before using anything you're unsure of; for example, `searchParams` is a Promise in page components. There is no database, no auth and no deployment. The app runs on localhost and gets screen-recorded for a 90-second demo video.

## What the homepage is for

1. **Kid entry point.** Maya (age 7, dyslexia, ADHD) opens the app and starts reading in one tap.
2. **Filming aid.** The person recording the demo can jump straight to any "day" without clicking through the app.

The homepage is not in the storyboard. It may appear as an opening shot and in the README, and nothing more.

**Timebox: 20 minutes.** If something takes longer, cut it and add a line to `DECISIONS.md`.

## Files

- Edit `app/page.tsx` only.
- Do not edit `app/read/page.tsx` (Person A owns it). See "Dependency" below.

## Layout (kid view, the default)

- A full-height page on the existing cream background (`#FBF7EE`), with everything centered and plenty of empty space. Calm and uncluttered, never busy.
- **Greeting:** "Hi, Maya!" in large Lexend text (about 48px). Read the name from `content/profile.json`; do not hardcode it.
- **Subline:** "Biscuit found a new story for you." (Biscuit is Maya's dog, from the profile's interests.) About 24px, softer color.
- **One primary button:** "Let's read" links to `/read`. Make it big (at least 80px tall, generous width), with rounded corners and a calm, warm color that keeps strong contrast against the cream. The tap target should be obvious to a 7-year-old.
- **A small text link** in the bottom corner: "For grown-ups" goes to `/parent`. Keep it understated so a kid won't tap it by accident.
- **Optional, only if time remains:** a simple inline SVG or emoji of a dog near the greeting. No image files and no illustration libraries.

## Demo controls (filming only)

- Show these only when the URL has `?demo=1`. They are hidden by default, so they never appear in the kid view.
- A small, low-key row of three pill links: "Day 1", "Day 2" and "Day 5", pointing to `/read?day=1`, `/read?day=2` and `/read?day=5`. Build the list from the `day` values in `content/passages.json`, not a hardcoded array.
- Place the row at the bottom, visually separate from the kid UI, so it can be cropped out of a recording.

## Dependency

`/read` currently always shows the first passage and ignores `?day=`. Do not change it yourself. Add a one-line note to `DECISIONS.md` saying the homepage demo links expect `/read` to honor `?day=N` (default 1), so Person A can wire it in.

## Hard rules (from the brief)

- The kid never types. No inputs, no search, no chat box.
- No scores, streaks, stars, progress bars, or anything that grades the kid.
- No sign-in, no onboarding form, no settings menu.
- Copy stays short, warm and concrete. Never use the words "patience" or "learning styles" anywhere.
- No new dependencies. Tailwind classes and the existing Lexend font only.
- No dark mode, no animations beyond a subtle hover/press state on the button.

## Acceptance criteria

- `/` shows the greeting, subline, "Let's read" button and "For grown-ups" link, and nothing else.
- `/?demo=1` additionally shows the Day 1 / Day 2 / Day 5 row, and the links have the right `?day=` values.
- Clicking "Let's read" opens `/read`, and "For grown-ups" opens `/parent`.
- The layout looks right at 1920x1080 (recording size) and does not break at phone width.
- `npx next build` and `npm run lint` both pass.

## Out of scope

Kid profile switching, multiple kids, onboarding, auth, analytics, sound, any new route, and any change to `/read`, `/parent` or `/api/next-page`.

## When done

Add one line to `DECISIONS.md` describing what was built and anything cut. Commit only `app/page.tsx` and `DECISIONS.md` (plus this spec if it isn't committed yet), by explicit path.
