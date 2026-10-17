import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Mihika's site ("Alder Learning Tutor.html" at the repo root) is the product's
// front door: the parent site, the onboarding wizard and the kid world. It is
// served here, at /, so its calls to /api/next-page, /api/memory, /api/coach
// and /api/tts hit this app, and so the voice shim can be injected without
// editing her file. She keeps editing the HTML at the root; a reload picks
// it up.

// The product was renamed from Wren to Alder mid-hackathon; accept either file.
const SITE_FILES = ["Alder Learning Tutor.html", "Wren Learning Tutor.html"].map((f) =>
  join(process.cwd(), f),
);
const SHIM = '<script src="/wren-voice.js"></script>';

async function readSite(): Promise<string | null> {
  for (const file of SITE_FILES) {
    try {
      return await readFile(file, "utf8");
    } catch {
      /* try the next name */
    }
  }
  return null;
}

export async function GET() {
  const html = await readSite();
  if (html === null) {
    return new Response("Alder Learning Tutor.html is missing from the repo root.", { status: 500 });
  }
  const injected = html.includes(SHIM)
    ? html
    : html.replace(/<body([^>]*)>/i, (tag) => `${tag}\n${SHIM}`);
  return new Response(injected, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
