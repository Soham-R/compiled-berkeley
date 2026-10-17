import Anthropic from "@anthropic-ai/sdk";
import profile from "@/content/profile.json";
import sessions from "@/content/sessions.json";
import summaries from "@/content/summaries.json";
import { reportDue, summarizeWeek, type WeekFacts } from "./summary";
import { PARENT_NOTE_TASK, tutorSystem, violates } from "./tutor";
import type { Profile, Session } from "./types";

const MODEL = "claude-sonnet-5-5";
const TIMEOUT_MS = 8000;

export type ParentNote = {
  day: number;
  note: string;
  facts: WeekFacts;
  due: boolean; // false when the cadence (1, 3, 7, weekly) has no note for this day
  source: "claude" | "fallback";
  reason?: string;
};

// One generation per day per server process, so a page reload is instant.
const cache = new Map<number, ParentNote>();

// Hand-written note for the nearest day at or below `day`.
function fallbackNote(day: number): string {
  const keyed = summaries as Record<string, string>;
  const days = Object.keys(keyed).map(Number).sort((a, b) => a - b);
  const pick = [...days].reverse().find((d) => d <= day) ?? days[0];
  return keyed[String(pick)];
}

function wordCount(text: string): number {
  return (text.match(/[A-Za-z0-9'-]+/g) ?? []).length;
}

// Why a generated note can't be shown, or null when it can.
export function noteProblem(note: string, facts: WeekFacts): string | null {
  const hit = violates(note);
  if (hit) return `banned: ${hit}`;
  const n = wordCount(note);
  if (n < 70 || n > 150) return `length: ${n} words`;
  if (note.includes("%")) return "contains %";
  const missing = facts.mastered.find((w) => !new RegExp(`\\b${w}\\b`, "i").test(note));
  if (missing) return `missing mastered word: ${missing}`;
  return null;
}

export async function generateParentNote(
  throughDay: number,
  opts: { fresh?: boolean } = {},
): Promise<ParentNote> {
  if (!opts.fresh && cache.has(throughDay)) return cache.get(throughDay)!;

  const week = (sessions as Session[]).filter((s) => s.day <= throughDay);
  const facts = summarizeWeek(week, profile as Profile);
  const due = reportDue(throughDay);
  const base = { day: throughDay, facts, due };
  const fallback = (reason: string): ParentNote => ({
    ...base,
    note: fallbackNote(throughDay),
    source: "fallback",
    reason,
  });

  let result: ParentNote;
  if (!process.env.ANTHROPIC_API_KEY) {
    result = fallback("no key");
  } else {
    try {
      const client = new Anthropic();
      const msg = await client.messages.create(
        {
          model: MODEL,
          max_tokens: 2000,
          // Same reason as lib/nextPage.ts: thinking on by default eats the
          // whole budget for a task this small.
          thinking: { type: "between_tools" },
          system: `${tutorSystem(profile as Profile)}\n\n${PARENT_NOTE_TASK}`,
          messages: [{ role: "user", content: JSON.stringify({ facts, sessions: week }) }],
        },
        { signal: AbortSignal.timeout(TIMEOUT_MS) },
      );
      const note = (msg.content.find((b) => b.type === "text")?.text ?? "").trim();
      const problem = noteProblem(note, facts);
      if (problem) {
        console.warn(`parent-note: ${problem}, using fallback`);
        result = fallback(problem);
      } else {
        result = { ...base, note, source: "claude" };
      }
    } catch (err) {
      console.error("parent-note fell back:", err);
      result = fallback(String(err));
    }
  }

  cache.set(throughDay, result);
  return result;
}
