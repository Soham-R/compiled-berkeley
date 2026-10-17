// Generates the narrator track for the demo video into public/audio/vo/.
// Uses ELEVENLABS_VOICE_ID_NARRATOR when set, so the narrator is a different
// voice from Wren. If a team member records the narration themselves, skip this.
//
//   npx tsx scripts/record-voiceover.ts
//   npx tsx scripts/record-voiceover.ts --force

import { existsSync, mkdirSync } from "node:fs";
import { VOICEOVER } from "../content/voiceover";
import { extFor, loadEnv, pickBackend, play, synth, writeClip } from "./tts";

loadEnv();

const force = process.argv.includes("--force");
const backend = pickBackend();
const voiceId =
  backend === "elevenlabs"
    ? (process.env.ELEVENLABS_VOICE_ID_NARRATOR ?? process.env.ELEVENLABS_VOICE_ID)
    : backend === "openai"
      ? "onyx"
      : "Daniel";
const ext = extFor(backend);

async function main() {
  console.log(`backend: ${backend}  voice: ${voiceId}  ext: ${ext}`);
  if (backend === "elevenlabs" && !process.env.ELEVENLABS_VOICE_ID_NARRATOR) {
    console.warn("ELEVENLABS_VOICE_ID_NARRATOR not set; narrator will sound like Wren.");
  }

  mkdirSync("public/audio/vo", { recursive: true });
  let first: string | null = null;

  for (const line of VOICEOVER) {
    const path = `public/audio/vo/${line.id}.${ext}`;
    if (!force && existsSync(path)) {
      console.log(`  skip  ${line.id}`);
      continue;
    }
    process.stdout.write(`  make  ${line.id} ... `);
    const data = await synth(line.text, backend, voiceId);
    writeClip(path, data);
    first ??= path;
    console.log(`${(data.length / 1024).toFixed(0)} KB`);
  }

  if (first) play(first);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
