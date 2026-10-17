import { generateNextPage } from "@/lib/nextPage";
import type { NextPageRequest } from "@/lib/types";

// Soham's Python engine (backend/, FastAPI on :8000) can author the page
// instead of lib/nextPage.ts. Opt in by setting WREN_BACKEND_URL; the default
// path is the tuned Claude prompt with the banned-word and missing-word guards.
const BACKEND_URL = process.env.WREN_BACKEND_URL;

async function fromBackend(body: NextPageRequest) {
  if (!BACKEND_URL) return null;
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/tutor/next-passage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        child_id: body.childId || "maya",
        day: body.day + 1,
        flagged: body.flagged,
        current_rung: body.flagged ? 1 : 0,
        recent_stumbles: body.stumbledWords || [],
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      day: data.day,
      passage: data.passage,
      targetWords: data.target_words || body.stumbledWords || [],
      question: data.question,
      source: "backend" as const,
    };
  } catch {
    return null; // offline or slow; use the Claude path
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as NextPageRequest;
  const fromEngine = await fromBackend(body);
  if (fromEngine) return Response.json(fromEngine);
  return Response.json(await generateNextPage(body));
}
