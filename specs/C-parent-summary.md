# Spec C: Parent summary (`/parent` and `/api/parent-summary`)

Branch: `tutor-voice` (or `parent-summary` cut from it). Owner: a second Claude Code
chat, in parallel with spec B. Timebox: **35 minutes.**
Depends on spec A (`lib/tutor.ts`). Independent of spec B.

## Context

Read `HACKATHON_CONTEXT.md`, `AGENTS.md`, `DECISIONS.md` and `specs/A-tutor-disposition.md`
first. Next.js 16 App Router (note: `searchParams` is a Promise in page components; check
`node_modules/next/dist/docs/` before using anything you're unsure of), Tailwind v4,
Lexend, no database.

Already on the branch:

- `lib/types.ts`: `Session`, `WordResult`, `Profile`, `Thresholds`. Do not change their shape.
- `content/profile.json`: Maya, with `thresholds.expectedAttentionMin: 8`.
- `content/sessions.json`: seven seeded sessions, days 1 to 7. Day 1, 3 and 5 are flagged
  with `secondsUntilFlag` 360, 540, 660 (the 6 / 9 / 11 minute trend). `through`, `think`,
  `there` are stumbled early and clean by the end; `where` is still shaky; `which` was
  stumbled once then clean.
- `lib/tutor.ts`: `tutorSystem(profile)`, `violates(text)`.
- `lib/nextPage.ts`: the pattern to copy for a Claude call with timeout and fallback.
- `scripts/eval-tutor.ts`: contains a stub `NOTE_TASK` string for the parent note.
  **Move it** into `lib/tutor.ts` as `export const PARENT_NOTE_TASK` and import it in the
  eval, so there is one copy.
- `app/parent/page.tsx`: a two-line stub. Replace it.

Decisions already made: summaries are shown in-app, nothing is emailed. Cadence is after
session 1, 3, 7, then every 7. The video shows day 7. "Patience" and "learning styles"
never appear; `violates()` guards every generated note.

## Files

| file | what |
|---|---|
| `lib/summary.ts` | pure functions, no Claude |
| `lib/parentNote.ts` | the Claude call + fallback, shared by the route and the page |
| `app/api/parent-summary/route.ts` | `POST { throughDay }` |
| `content/summaries.json` | hand-written fallback notes for days 1, 3, 7 |
| `app/parent/page.tsx` | the page |
| `lib/tutor.ts` | add `PARENT_NOTE_TASK` (moved from the eval) |
| `scripts/eval-tutor.ts` | import `PARENT_NOTE_TASK` instead of the local stub |

---

## 1. `lib/summary.ts`

```ts
export const CADENCE = [1, 3, 7];           // then every 7 after that
export function reportDue(latestDay: number): boolean
export function reportDays(throughDay: number): number[]   // e.g. 7 -> [1, 3, 7]; 15 -> [1,3,7,14]
export function summarizeWeek(sessions: Session[], profile: Profile): WeekFacts
```

- `reportDue(d)`: true if `d` is 1, 3, 7, or a multiple of 7.
- `summarizeWeek` takes sessions already sliced to `day <= throughDay`, sorted by day.
  Returns:

```ts
export type WeekFacts = {
  throughDay: number;
  mastered: string[];     // stumbled in any session, and clean in the last 2 sessions it appeared in
  workingOn: string[];    // stumbled in either of the last 2 sessions
  timeToBreak: { day: number; date: string; weekday: string; minutes: number }[];  // flagged sessions only
  trend: "up" | "flat" | "down";           // last vs first timeToBreak; "flat" if < 2 entries or equal
  vsExpected: "above" | "near" | "below";  // last timeToBreak vs thresholds.expectedAttentionMin, +/- 1 min = near
  sessionsCount: number;
  cleanPages: number;     // sessions with no stumbled words
};
```

- A word can't be in both lists; `workingOn` wins. Both lists keep first-seen order.
- `weekday` is the long English name from `date`, computed in UTC so the demo doesn't
  shift by timezone.
- With the seeded data through day 7: mastered = through, think, there, which;
  workingOn = where; timeToBreak = Mon 6, Wed 9, Fri 11; trend up; vsExpected above.
  Through day 1: mastered = []; workingOn = through, think, there; timeToBreak = Mon 6;
  trend flat; vsExpected below.

## 2. `PARENT_NOTE_TASK` (in `lib/tutor.ts`)

Replace the eval's stub with this, then delete the stub:

```
## Your task: write the parent note

The reader is {name}'s parent, after a long day. 90 to 130 words. Plain English, second
person ("she", "you"), no headings, no bullet points, no greeting line, no sign-off.
You will be given "facts" (already computed; trust them, don't recount) and the raw
"sessions". In this order:
1. What clicked: name every word in facts.mastered. If the list is empty, say what she
   tried and how the pieces helped, without pretending something clicked.
2. What she's working on (facts.workingOn) and what you are doing about it on the page
   (where the word sits, how often it comes back).
3. The time-before-a-break numbers, as minutes with weekdays, stated as a fact, not a
   verdict. If there is only one, say it plainly without a trend.
4. One thing to try at homework time that mirrors what worked: covering all but the
   first piece, reading one short page then stopping, letting her pick the story.
No percentages, no grades, no comparison to other kids, no reading levels, no diagnosis
words. Return plain text only.
```

Interpolate `{name}` from the profile at call time.

## 3. `lib/parentNote.ts`

```ts
export type ParentNote = { day: number; note: string; facts: WeekFacts; source: "claude" | "fallback"; reason?: string };
export async function generateParentNote(throughDay: number): Promise<ParentNote>
```

- Slice `content/sessions.json` to `day <= throughDay`; compute `facts`.
- If `!reportDue(throughDay)`, still generate (the page may be asked for any day), but
  include `due: false` in the result so the page can say "next note after day N".
- Claude call: same shape as `lib/nextPage.ts`. `claude-sonnet-5-5`, `max_tokens: 400`,
  8 s timeout, system = `tutorSystem(profile) + "\n\n" + PARENT_NOTE_TASK`, user message
  = `JSON.stringify({ facts, sessions })`.
- Post-checks before returning Claude's text, any failure means fallback with a reason:
  `violates()` is null; word count 70 to 150 (looser than the prompt asks); no `%`;
  every `facts.mastered` word appears.
- Fallback: `content/summaries.json`, keyed by day string. If the exact day isn't there,
  use the nearest lower key.

## 4. `content/summaries.json`

Three hand-written notes. Draft them now; they're what the README shows if generation
flakes. Each should pass the same post-checks as a generated note.

```json
{
  "1": "Maya met three th- words today: through, think and there. All three slowed her down, and on each one she tried the pieces before anything else, which is the move we want. The page broke the word into th and the rest, and she read the second half herself every time. She needed a break after 6 minutes on Monday, which is about what we expected for a first page. The next page is shorter, about Biscuit, and the same three words come back in easy spots. If she stalls on a word at homework time, cover everything but the first piece with your finger and wait. She'll get there.",
  "3": "...",
  "7": "..."
}
```

Write "3" and "7" in the same voice. Day 7 must name through, think, there and which as
clicked, where as still slowing her, and the 6, 9, 11 minute trend with weekdays.

## 5. `app/api/parent-summary/route.ts`

`POST { throughDay: number }` → `Response.json(await generateParentNote(throughDay))`.
Validate `throughDay` is an integer 1 to 60; 400 otherwise.

## 6. `app/parent/page.tsx`

Server component. `const { day } = await searchParams; const throughDay = Number(day ?? 7)`.
Calls `generateParentNote(throughDay)` directly (never `fetch` localhost from a server
component). Renders, top to bottom:

- **Header:** "Maya, day {throughDay}" and the latest session's date in long form.
- **The note:** one card that reads like a message from Wren. Soft border, cream
  background (`#FBF7EE` is already the page background; use a slightly lighter or
  darker tone for the card so it lifts), Lexend at normal size (18 to 20px, line-height
  1.6). This page is for the adult, not the kid: no 30px type here. A small "from Wren"
  label above the text.
- **Three plain-English blocks** from `facts`, so the numbers are visible even if the
  note is short. No charts, no bars, no icons.
  - **Words that clicked:** the mastered words as a sentence ("through, think, there and
    which"). If empty: "Nothing yet. That's normal for the first days."
  - **Working on:** the workingOn words the same way.
  - **Time before a break:** one line per entry: "Monday: 6 minutes". Below it, one
    sentence from `trend` and `vsExpected`: "Up from Monday, and past the 8 minutes we
    expected for her age."
- **Footer line, muted:** "Notes arrive after day 1, 3 and 7, then every week." If
  `due` is false: "Next note after day N."
- Dev hint, muted, only when `source === "fallback"`: "(pre-written note)". The video
  can use either; the README GIF should show one real generation.
- `?day=1`, `?day=3`, `?day=7` all render. An out-of-range day shows the day-7 view.

Max width around 640px, centered, generous padding. Works at phone width.

## Acceptance

- `summarizeWeek` on the seeded data gives exactly the day-7 and day-1 values listed in
  section 1 (check in a `tsx -e` one-liner; paste the output into the commit message).
- `/parent` and `/parent?day=7` show mastered = through, think, there, which; working on
  = where; Monday 6, Wednesday 9, Friday 11.
- `/parent?day=1` shows the day-1 note without error.
- With no `ANTHROPIC_API_KEY`, every page is the fallback note and `source` says so.
- `npx tsx scripts/eval-tutor.ts 5` still runs and uses `PARENT_NOTE_TASK` from `lib/tutor.ts`.
- `grep -ri "patien\|learning style" app lib content scripts` hits only the `BANNED` list.
- `npx next build` and `npm run lint` pass.

## Out of scope

Email or push delivery, more than one kid, charts, a date picker, editing the note,
anything on `/read`, any change to `Session` or `Profile` shapes.

## When done

Append to `DECISIONS.md` (mastery rule as implemented, anything cut). Pull before
pushing; spec B is appending to `DECISIONS.md` on the same branch. Commit by explicit
path only: `lib/summary.ts`, `lib/parentNote.ts`, `lib/tutor.ts`,
`app/api/parent-summary/route.ts`, `app/parent/page.tsx`, `content/summaries.json`,
`scripts/eval-tutor.ts`, `DECISIONS.md`.
