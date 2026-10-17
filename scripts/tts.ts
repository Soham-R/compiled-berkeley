// Shared text-to-speech backends for record-lines.ts and record-voiceover.ts.
// Backend is picked from the environment: ElevenLabs, then OpenAI, then macOS `say`.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type Backend = "elevenlabs" | "openai" | "say";

export function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local; rely on the shell env */
  }
}

export function pickBackend(): Backend {
  if (process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "say";
}

export function extFor(backend: Backend): "mp3" | "m4a" {
  return backend === "say" ? "m4a" : "mp3";
}

// "..." in a line is a deliberate pause. Each backend spells that differently.
export function pace(text: string, backend: Backend): string {
  const dots = /\s*\.\.\.\s*/g;
  if (backend === "elevenlabs") return text.replace(dots, ' <break time="0.6s" /> ');
  if (backend === "say") return text.replace(dots, " [[slnc 600]] ");
  return text; // OpenAI: the instructions string asks for pauses at ellipses
}

const OPENAI_INSTRUCTIONS =
  "A calm, warm reading tutor talking to a seven-year-old. Unhurried. No exclamation energy. Pause clearly at the ellipses.";

export async function synth(text: string, backend: Backend, voiceId?: string): Promise<Buffer> {
  const spoken = pace(text, backend);

  if (backend === "elevenlabs") {
    const id = voiceId ?? process.env.ELEVENLABS_VOICE_ID;
    if (!id) throw new Error("ELEVENLABS_VOICE_ID missing");
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${id}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY!,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          text: spoken,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.2, speed: 0.9 },
        }),
      },
    );
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
    return Buffer.from(await res.arrayBuffer());
  }

  if (backend === "openai") {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: voiceId ?? "nova",
        input: spoken,
        response_format: "mp3",
        instructions: OPENAI_INSTRUCTIONS,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    return Buffer.from(await res.arrayBuffer());
  }

  // macOS `say` -> aiff -> aac m4a. Zero setup; swap for real clips before filming.
  const dir = mkdtempSync(join(tmpdir(), "wren-say-"));
  const aiff = join(dir, "line.aiff");
  const m4a = join(dir, "line.m4a");
  execFileSync("say", ["-v", voiceId ?? "Samantha", "-r", "150", "-o", aiff, spoken]);
  execFileSync("afconvert", [aiff, "-f", "mp4f", "-d", "aac", m4a]);
  return readFileSync(m4a);
}

// ElevenLabs voice metadata, so a person can sanity-check an ID before generating.
export async function voiceInfo(voiceId: string) {
  const res = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const v = (await res.json()) as {
    name: string;
    labels?: Record<string, string>;
    description?: string;
    preview_url?: string;
  };
  return { name: v.name, labels: v.labels ?? {}, description: v.description, preview: v.preview_url };
}

export function play(path: string) {
  try {
    execFileSync("afplay", [path], { stdio: "ignore" });
  } catch {
    /* not macOS, or no audio device; fine */
  }
}

export function writeClip(path: string, data: Buffer) {
  if (data.length === 0) throw new Error(`empty audio for ${path}`);
  writeFileSync(path, data);
}
