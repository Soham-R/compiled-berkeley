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

export function nextPageUserMessage(body: NextPageRequest): string {
  const { stumbledWords, flagged, words, previousPassage } = body;
  return JSON.stringify({ profile, stumbledWords, flagged, words, previousPassage });
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
        max_tokens: 600,
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
    return { ...page, source: "claude" };
  } catch (err) {
    console.error("next-page fell back:", err);
    return { ...fallback, source: "fallback", reason: String(err) };
  }
}
