"use client";

import passages from "@/content/passages.json";
import type { Passage } from "@/lib/types";

// Person A owns this page: Web Speech API, pointer alignment, stumble timer,
// sound-out intervention, flagging card. See HACKATHON_CONTEXT.md section 3.
export default function ReadPage() {
  const page = (passages as Passage[])[0];
  const words = page.passage.split(/\s+/);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 p-10">
      <p className="passage">
        {words.map((w, i) => (
          <span key={i}>{w} </span>
        ))}
      </p>
      {/* Debug line: last transcript chunk goes here while building. */}
      <p className="font-mono text-sm opacity-50">transcript: (not listening yet)</p>
    </main>
  );
}
