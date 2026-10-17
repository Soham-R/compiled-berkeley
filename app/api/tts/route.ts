import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Live text-to-speech for the kid site's dynamic lines (sound-outs of any
// word, story text, greetings), in the same ElevenLabs voice as the recorded
// clips in public/audio. Cached on disk by text so a line is paid for once.
// public/wren-voice.js calls this; on 503 it falls back to the browser voice.

const MAX_CHARS = 400;
const CACHE_DIR = join(process.cwd(), "public", "audio", "tts");

function pace(text: string): string {
  // "..." in a line is a deliberate pause; ElevenLabs honors the break tag.
  return text.replace(/\s*\.\.\.\s*/g, ' <break time="0.6s" /> ');
}

async function synthesize(text: string, voiceId: string): Promise<Buffer> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        text: pace(text),
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.2, speed: 0.9 },
      }),
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function GET(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!key || !voiceId) {
    return new Response("no voice configured", { status: 503 });
  }

  const raw = new URL(req.url).searchParams.get("text") ?? "";
  const text = raw.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
  if (!text) return new Response("missing text", { status: 400 });

  const hash = createHash("sha1").update(`${voiceId}|${text}`).digest("hex").slice(0, 16);
  const file = join(CACHE_DIR, `${hash}.mp3`);

  try {
    let data: Buffer;
    if (existsSync(file)) {
      data = readFileSync(file);
    } else {
      data = await synthesize(text, voiceId);
      mkdirSync(CACHE_DIR, { recursive: true });
      writeFileSync(file, data);
    }
    return new Response(new Uint8Array(data), {
      headers: {
        "content-type": "audio/mpeg",
        "cache-control": "public, max-age=31536000, immutable",
        "x-wren-tts": existsSync(file) ? "cache" : "live",
      },
    });
  } catch (err) {
    console.error("tts failed:", err);
    return new Response("tts failed", { status: 502 });
  }
}
