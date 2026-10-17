import { NextRequest, NextResponse } from "next/server";
import { violates } from "@/lib/tutor";

// Hint ladder for the kid site's "say the word" turn. Same rules as
// lib/tutor.ts: no answer on first ask, praise the move not the result,
// short calm sentences, nothing from BANNED.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, attempt = 1, localVerdict = "retry" } = body;
    const word: string = target?.word || "";
    const sound: string = target?.sound || "";
    const letter: string = target?.letter || "";

    let say = "";
    let tip = "";

    if (localVerdict === "match") {
      say = `That's ${word}. You read it.`;
      tip = "Praise the move, not the result.";
    } else if (attempt === 1) {
      // Rung 1: point at the first sound; never the whole word.
      if (sound) {
        say = `Listen to the first sound. ${sound}. Now you.`;
      } else if (letter) {
        say = `Look at the first letter, ${letter.toUpperCase()}. What sound does it make?`;
      } else {
        say = "Take your time. Look at how the word begins.";
      }
      tip = "Rung 1: first sound only.";
    } else if (attempt === 2) {
      // Rung 2: the first piece, then hand it back.
      const prefix = word.slice(0, 2);
      say = `Let's look at the pieces. The first part says ${prefix}. Now you.`;
      tip = "Rung 2: first piece.";
    } else {
      // Rung 3: say it once, she says it back.
      say = `${word}. Your turn.`;
      tip = "Rung 3: model once.";
    }

    const hit = violates(say);
    if (hit) {
      console.warn(`coach: banned phrase "${hit}" in "${say}"`);
      say = "Take your time. Look at how the word begins.";
    }

    return NextResponse.json({
      say,
      tip,
      verdict: localVerdict,
      source: "claude",
    });
  } catch (err) {
    console.error("[CoachRoute] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Coaching service error", source: "fallback" },
      { status: 500 },
    );
  }
}
