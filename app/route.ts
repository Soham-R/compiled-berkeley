import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Mihika's site ("Wren Learning Tutor.html" at the repo root) is the product's
// front door: the parent site, the onboarding wizard and the kid world. It is
// served here, at /, so its calls to /api/next-page, /api/memory, /api/coach
// and /api/tts hit this app, and so the voice shim can be injected without
// editing her file. She keeps editing the HTML at the root; a reload picks
// it up.

const SITE_FILE = join(process.cwd(), "Wren Learning Tutor.html");
const SHIM = '<script src="/wren-voice.js"></script>';

export async function GET() {
  let html: string;
  try {
    html = await readFile(SITE_FILE, "utf8");
  } catch {
    return new Response("Wren Learning Tutor.html is missing from the repo root.", { status: 500 });
  }
  const injected = html.includes(SHIM)
    ? html
    : html.replace(/<body([^>]*)>/i, (tag) => `${tag}\n${SHIM}`);
  return new Response(injected, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
