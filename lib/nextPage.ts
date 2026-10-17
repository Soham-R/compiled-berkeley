import Anthropic from "@anthropic-ai/sdk";
import profile from "@/content/profile.json";
import passages from "@/content/passages.json";
import type { NextPageRequest, Passage, Profile } from "./types";
import { NEXT_PAGE_TASK, tutorSystem, violates } from "./tutor";

const MODEL = "claude-sonnet-5-5";
const TIMEOUT_MS = 8000;

export type NextPageResult = Passage & { source: "claude" | "fallback"; reason?: string };

// Day 1 -> Day 2 -> Day 5, matching the video's three "days".
export function fallbackFor(day: number): Passage {
  const all = passages as Passage[];
  return all.find((p) => p.day > day) ?? all[all.length - 1];
}

export function nextPageSystem(): string {
  return `${tutorSystem(profile as Profile)}\n\n${NEXT_PAGE_TASK}`;
}

// Exact count each word must appear, from its hint level. Precomputed so the
// model gets a checklist, not a rule to interpret.
export function requiredUses(body: NextPageRequest): { word: string; times: number }[] {
  const list = body.words ?? body.stumbledWords.map((word) => ({ word, status: "stumbled" as const, hintLevel: 2 as const }));
  return list.map((w) => ({
    word: w.word,
    times: w.status === "clean" ? 1 : w.hintLevel === 3 ? 3 : 2,
  }));
}

export function nextPageUserMessage(body: NextPageRequest): string {
  const { stumbledWords, flagged, words, previousPassage } = body;
  return JSON.stringify({
    profile,
    stumbledWords,
    flagged,
    words,
    previousPassage,
    requiredUses: requiredUses(body),
    maxSentences: flagged ? 4 : 6,
    minSentences: flagged ? 3 : 4,
  });
}

// Shared by /api/next-page and scripts/eval-tutor.ts so the eval runs the
// real prompt, not a copy.
export async function generateNextPage(body: NextPageRequest): Promise<NextPageResult> {
  const fallback = fallbackFor(body.day);
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ...fallback, source: "fallback", reason: "no key" };
  }

  try {
    const client = new Anthropic();
    const msg = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 2000,
        // Sonnet 5.5 thinks by default and spends the whole budget on it for a
        // task this small; even low-effort thinking blows the 8 s timeout.
        // between_tools is the supported off switch. Counts land within ±1.
        thinking: { type: "between_tools" },
        system: nextPageSystem(),
        messages: [{ role: "user", content: nextPageUserMessage(body) }],
      },
      { signal: AbortSignal.timeout(TIMEOUT_MS) },
    );

    const text = msg.content.find((b) => b.type === "text")?.text ?? "";
    const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    const page: Passage = { day: fallback.day, ...parsed };

    const hit = violates(`${page.passage} ${page.question.prompt} ${page.question.options.join(" ")}`);
    if (hit) {
      console.warn(`next-page: banned phrase "${hit}", using fallback`);
      return { ...fallback, source: "fallback", reason: `banned: ${hit}` };
    }

    // Counts land within ±1 of the checklist; a word that is missing entirely
    // defeats the point of the page, so that one case falls back.
    const missing = requiredUses(body).find(
      (r) => !new RegExp(`\\b${r.word}\\b`, "i").test(page.passage),
    );
    if (missing) {
      console.warn(`next-page: "${missing.word}" never used, using fallback`);
      return { ...fallback, source: "fallback", reason: `missing: ${missing.word}` };
    }
    return { ...page, source: "claude" };
  } catch (err) {
    console.error("next-page fell back:", err);
    return { ...fallback, source: "fallback", reason: String(err) };
  }
}
