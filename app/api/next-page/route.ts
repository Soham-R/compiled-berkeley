import Anthropic from "@anthropic-ai/sdk";
import profile from "@/content/profile.json";
import passages from "@/content/passages.json";
import type { NextPageRequest, Passage } from "@/lib/types";

const MODEL = "claude-sonnet-5-5";
const TIMEOUT_MS = 8000;

// Day 1 -> Day 2 -> Day 5, matching the video's three "days".
function fallbackFor(day: number): Passage {
  const all = passages as Passage[];
  return all.find((p) => p.day > day) ?? all[all.length - 1];
}

function nextDay(day: number) {
  return fallbackFor(day).day;
}

const SYSTEM = `You write the next page of a reading tutor's story for one child.
Return ONLY a JSON object, no prose, no code fences:
{"passage": string, "targetWords": string[], "question": {"prompt": string, "options": [string, string, string]}}

Rules:
- Reading band: late 1st / early 2nd grade.
- 4 to 6 sentences. If "flagged" is true, write only 3 to 4 short sentences.
- Use EACH stumbled word 2 to 3 times, naturally. targetWords = the stumbled words.
- Build the story around the child's interests.
- No words over 2 syllables, except the child's named interests.
- The question is one gentle multiple-choice question about the story. Every option is plausible and kind; there is no "gotcha".`;

export async function POST(req: Request) {
  const body = (await req.json()) as NextPageRequest;
  const fallback = fallbackFor(body.day);

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ ...fallback, source: "fallback" });
  }

  try {
    const client = new Anthropic();
    const msg = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 600,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              profile,
              stumbledWords: body.stumbledWords,
              flagged: body.flagged,
            }),
          },
        ],
      },
      { signal: AbortSignal.timeout(TIMEOUT_MS) },
    );

    const text = msg.content.find((b) => b.type === "text")?.text ?? "";
    const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    const page: Passage = { day: nextDay(body.day), ...parsed };
    return Response.json({ ...page, source: "claude" });
  } catch (err) {
    console.error("next-page fell back:", err);
    return Response.json({ ...fallback, source: "fallback" });
  }
}
