// Tuning loop for lib/tutor.ts. Runs the real prompts against fixed scenarios
// and prints each response with PASS/FAIL checks.
//
//   npx tsx scripts/eval-tutor.ts            # all six
//   npx tsx scripts/eval-tutor.ts 3          # one scenario
//
// Needs ANTHROPIC_API_KEY in .env.local.

import { readFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import profile from "../content/profile.json";
import passages from "../content/passages.json";
import sessions from "../content/sessions.json";
import { generateNextPage, type NextPageResult } from "../lib/nextPage";
import { tutorSystem, violates } from "../lib/tutor";
import type { NextPageRequest, Passage, Profile, Session, WordResult } from "../lib/types";

// --- env -------------------------------------------------------------------

try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env.local; rely on the shell env */
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY missing. Add it to .env.local.");
  process.exit(1);
}

// --- helpers ---------------------------------------------------------------

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

type Check = { name: string; pass: boolean; detail?: string };

function report(checks: Check[]) {
  for (const c of checks) {
    const tag = c.pass ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
    console.log(`  ${tag} ${c.name}${c.detail ? `${DIM}: ${c.detail}${RESET}` : ""}`);
  }
}

function bannedCheck(text: string): Check {
  const hit = violates(text);
  if (hit) console.log(`  ${RED}BANNED HIT: ${hit}${RESET}`);
  return { name: "no banned phrases", pass: !hit, detail: hit ?? undefined };
}

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
}

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z']+/g) ?? [];
}

function count(text: string, word: string): number {
  return (text.toLowerCase().match(new RegExp(`\\b${word}\\b`, "g")) ?? []).length;
}

// Rough: vowel groups, trailing silent e dropped. Over-counts sometimes; a
// human reviews what it prints.
function syllables(w: string): number {
  const s = w.toLowerCase().replace(/e$/, "").replace(/[^a-z]/g, "");
  return Math.max(1, (s.match(/[aeiouy]+/g) ?? []).length);
}

const interestWords = new Set(
  (profile as Profile).interests
    .flatMap((i) => words(i))
    .flatMap((w) => [w, w.replace(/s$/, ""), `${w}s`])
    .concat(["maya"]),
);

function syllableCheck(text: string): Check {
  const bad = [...new Set(words(text))].filter((w) => !interestWords.has(w) && syllables(w) > 2);
  return {
    name: "no words over 2 syllables (heuristic)",
    pass: bad.length === 0,
    detail: bad.length ? `review: ${bad.join(", ")}` : undefined,
  };
}

function interestCheck(text: string): Check {
  const present = words(text).some((w) => interestWords.has(w) && w !== "maya");
  return { name: "an interest is present", pass: present };
}

function expectedUses(w: WordResult): [number, number] {
  if (w.status === "clean") return [1, 1];
  if (w.hintLevel === 3) return [3, 3];
  if (w.hintLevel === 2) return [2, 3];
  return [2, 2];
}

function properNouns(text: string): Set<string> {
  const out = new Set<string>();
  for (const s of sentences(text)) {
    for (const w of s.split(/\s+/).slice(1)) {
      const clean = w.replace(/[^A-Za-z]/g, "");
      if (/^[A-Z][a-z]+$/.test(clean)) out.add(clean);
    }
  }
  return out;
}

// --- next-page scenarios ---------------------------------------------------

const P = passages as Passage[];
const page1 = P.find((p) => p.day === 1)!.passage;
const page2 = P.find((p) => p.day === 2)!.passage;

const wr = (word: string, hintLevel: 0 | 1 | 2 | 3): WordResult => ({
  word,
  status: hintLevel === 0 ? "clean" : "stumbled",
  hintLevel,
});

type PageScenario = { id: number; title: string; req: NextPageRequest };

const pageScenarios: PageScenario[] = [
  {
    id: 1,
    title: "day 1 -> 2, flagged",
    req: {
      day: 1,
      stumbledWords: ["through", "think", "there"],
      flagged: true,
      words: [wr("through", 3), wr("think", 2), wr("there", 2)],
      previousPassage: page1,
    },
  },
  {
    id: 2,
    title: "day 1 -> 2, not flagged",
    req: {
      day: 1,
      stumbledWords: ["through", "think", "there"],
      flagged: false,
      words: [wr("through", 3), wr("think", 2), wr("there", 2)],
      previousPassage: page1,
    },
  },
  {
    id: 3,
    title: "day 2 -> 5, new words where/which",
    req: {
      day: 2,
      stumbledWords: ["through", "where", "which"],
      flagged: false,
      words: [wr("through", 1), wr("think", 0), wr("there", 0), wr("where", 2), wr("which", 2)],
      previousPassage: page2,
    },
  },
  {
    id: 4,
    title: "legacy shape, stumbledWords only",
    req: { day: 1, stumbledWords: ["through"], flagged: false },
  },
];

function checkPage(s: PageScenario, r: NextPageResult, prev?: NextPageResult): Check[] {
  const checks: Check[] = [];
  const text = r.passage;
  const okShape =
    typeof r.passage === "string" &&
    Array.isArray(r.targetWords) &&
    r.question &&
    typeof r.question.prompt === "string" &&
    Array.isArray(r.question.options) &&
    r.question.options.length === 3;
  checks.push({ name: "schema valid, 3 options", pass: !!okShape });
  checks.push({ name: "source is claude", pass: r.source === "claude", detail: r.reason });

  const n = sentences(text).length;
  const [lo, hi] = s.req.flagged ? [3, 4] : [4, 6];
  checks.push({ name: `sentence count ${lo}-${hi}`, pass: n >= lo && n <= hi, detail: `${n}` });

  const wordList = s.req.words ?? s.req.stumbledWords.map((w) => wr(w, 2));
  for (const w of wordList) {
    const [min, max] = expectedUses(w);
    const c = count(text, w.word);
    checks.push({
      name: `"${w.word}" used ${min === max ? min : `${min}-${max}`}x (hint ${w.hintLevel})`,
      pass: c >= min && c <= max,
      detail: `${c}`,
    });
  }

  checks.push(syllableCheck(text));
  checks.push(interestCheck(text));
  checks.push(bannedCheck(`${text} ${r.question.prompt} ${r.question.options.join(" ")}`));

  if (prev) {
    const shared = [...properNouns(text)].filter((p) => properNouns(prev.passage).has(p));
    checks.push({
      name: "continues previous page (shared proper noun)",
      pass: shared.length > 0,
      detail: shared.join(", ") || "none",
    });
  }
  return checks;
}

// --- parent-note scenarios (previews spec C) --------------------------------

const NOTE_TASK = `## Your task: write the parent note

The reader is the parent, after a long day. 90 to 130 words. Plain English, second person, no headings, no bullet points. In this order: (1) what clicked this week, naming the words; (2) what she's working on and what you're doing about it; (3) the time-before-a-break trend in minutes, stated as a fact, not a verdict; (4) one concrete thing to try at homework time that mirrors what worked. No percentages, no grades, no comparison to other kids. Return plain text.`;

type NoteScenario = { id: number; title: string; throughDay: number };
const noteScenarios: NoteScenario[] = [
  { id: 5, title: "parent note, day 7", throughDay: 7 },
  { id: 6, title: "parent note, day 1", throughDay: 1 },
];

function masteredWords(ss: Session[]): string[] {
  const seen = new Map<string, WordResult["status"][]>();
  for (const s of ss) for (const w of s.words) seen.set(w.word, [...(seen.get(w.word) ?? []), w.status]);
  return [...seen]
    .filter(([, h]) => h.includes("stumbled") && h.length >= 2 && h.slice(-2).every((x) => x === "clean"))
    .map(([w]) => w);
}

async function runNote(s: NoteScenario): Promise<{ text: string; checks: Check[] }> {
  const ss = (sessions as Session[]).filter((x) => x.day <= s.throughDay);
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 2000,
    thinking: { type: "between_tools" },
    system: `${tutorSystem(profile as Profile)}\n\n${NOTE_TASK}`,
    messages: [{ role: "user", content: JSON.stringify({ profile, sessions: ss }) }],
  });
  const text = msg.content.find((b) => b.type === "text")?.text ?? "";

  const checks: Check[] = [];
  const wc = words(text).length;
  checks.push({ name: "90-130 words", pass: wc >= 90 && wc <= 130, detail: `${wc}` });
  const mastered = masteredWords(ss);
  const missing = mastered.filter((w) => count(text, w) === 0);
  checks.push({
    name: `names every mastered word (${mastered.join(", ") || "none"})`,
    pass: missing.length === 0,
    detail: missing.length ? `missing: ${missing.join(", ")}` : undefined,
  });
  checks.push({
    name: "contains minutes",
    pass: /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty)\s*min/i.test(text),
  });
  checks.push({ name: "no % sign", pass: !text.includes("%") });
  checks.push(bannedCheck(text));
  return { text, checks };
}

// --- main ------------------------------------------------------------------

async function main() {
  const only = process.argv[2] ? Number(process.argv[2]) : null;
  const results = new Map<number, NextPageResult>();

  for (const s of pageScenarios) {
    if (only && s.id !== only) continue;
    console.log(`\n=== ${s.id}. ${s.title} ===`);
    const r = await generateNextPage(s.req);
    results.set(s.id, r);
    console.log(r.passage);
    console.log(`${DIM}Q: ${r.question.prompt} | ${r.question.options.join(" / ")}${RESET}`);
    report(checkPage(s, r, s.id === 3 ? results.get(2) : undefined));
  }

  for (const s of noteScenarios) {
    if (only && s.id !== only) continue;
    console.log(`\n=== ${s.id}. ${s.title} ===`);
    const { text, checks } = await runNote(s);
    console.log(text);
    report(checks);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
