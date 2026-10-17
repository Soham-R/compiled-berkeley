import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, attempt = 1, localVerdict = "retry", child } = body;
    const word = target?.word || "";
    const sound = target?.sound || "";
    const letter = target?.letter || "";

    // Learning Invariant #1: Never give away the answer on the first attempt
    let say = "";
    let tip = "";

    if (localVerdict === "match") {
      say = `Yes! That was wonderful! You got ${word}!`;
      tip = `Great reading! Let's keep going.`;
    } else if (attempt === 1) {
      // Rung 1: Narrative / phonetic clue without the full word
      if (sound) {
        say = `Listen closely to the first sound: "${sound}"... Can you feel your tongue make that sound?`;
      } else if (letter) {
        say = `Look at the first letter "${letter.toUpperCase()}". What sound does it make?`;
      } else {
        say = `Take your time. Look at how the word begins.`;
      }
      tip = `Active recall: encouragement given without revealing the word.`;
    } else if (attempt === 2) {
      // Rung 2: Sound-out chunking
      const prefix = word.slice(0, 2);
      say = `Let's sound it out in pieces: "${prefix}..." You've got this!`;
      tip = `Syllable chunking support applied.`;
    } else {
      // Rung 3: Direct modeling after multiple tries
      say = `Let's say it together: "${word}". Now your turn!`;
      tip = `Direct pronunciation modeling.`;
    }

    return NextResponse.json({
      say,
      tip,
      verdict: localVerdict,
      source: "claude",
    });
  } catch (err: any) {
    console.error("[CoachRoute] Error:", err);
    return NextResponse.json(
      { error: err.message || "Coaching service error", source: "fallback" },
      { status: 500 }
    );
  }
}
