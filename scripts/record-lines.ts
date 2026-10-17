// Generates one clip per LINES entry into public/audio/, at the exact path
// lineUrl() gives, so the script and /read can never disagree.
//
//   npx tsx scripts/record-lines.ts            # only lines whose text changed
//   npx tsx scripts/record-lines.ts --force    # everything
//   npx tsx scripts/record-lines.ts --info     # print the ElevenLabs voice's metadata and stop
//   npx tsx scripts/record-lines.ts --one breakOffer   # one line, then play it
//
// Backend: ElevenLabs if ELEVENLABS_API_KEY is set, else OpenAI TTS, else macOS `say`.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { AUDIO_EXT, LINES, lineUrl, type LineKey } from "../lib/tutor";
import { extFor, loadEnv, pickBackend, play, synth, voiceInfo, writeClip } from "./tts";

loadEnv();

const args = process.argv.slice(2);
const force = args.includes("--force");
const info = args.includes("--info");
const oneIdx = args.indexOf("--one");
const only = oneIdx >= 0 ? (args[oneIdx + 1] as LineKey) : null;

const backend = pickBackend();
const voiceId =
  backend === "elevenlabs" ? process.env.ELEVENLABS_VOICE_ID : backend === "openai" ? "nova" : "Samantha";
const ext = extFor(backend);

type Manifest = Record<string, { text: string; hash: string; backend: string; voiceId?: string }>;
const MANIFEST = "public/audio/manifest.json";

function hash(text: string) {
  return createHash("sha1").update(`${backend}|${voiceId}|${text}`).digest("hex").slice(0, 12);
}

async function main() {
  console.log(`backend: ${backend}  voice: ${voiceId}  ext: ${ext}`);

  if (ext !== AUDIO_EXT) {
    console.warn(
      `\nAUDIO_EXT in lib/tutor.ts is "${AUDIO_EXT}" but this backend writes "${ext}".\n` +
        `Set AUDIO_EXT = "${ext}" so lineUrl() points at the files this run creates.\n`,
    );
  }

  if (info) {
    if (backend !== "elevenlabs") throw new Error("--info needs ELEVENLABS_API_KEY");
    console.log(JSON.stringify(await voiceInfo(voiceId!), null, 2));
    return;
  }

  mkdirSync("public/audio", { recursive: true });
  const manifest: Manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};

  let firstWritten: string | null = null;
  let written = 0;

  for (const [key, text] of Object.entries(LINES) as [LineKey, string][]) {
    if (only && key !== only) continue;
    const path = `public${lineUrl(key).replace(/\.[a-z0-9]+$/, `.${ext}`)}`;
    const h = hash(text);

    if (!force && existsSync(path) && manifest[key]?.hash === h) {
      console.log(`  skip  ${key}`);
      continue;
    }

    process.stdout.write(`  make  ${key} ... `);
    const data = await synth(text, backend, voiceId);
    writeClip(path, data);
    manifest[key] = { text, hash: h, backend, voiceId };
    written++;
    firstWritten ??= path;
    console.log(`${(data.length / 1024).toFixed(0)} KB`);
  }

  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\n${written} clip(s) written. manifest: ${MANIFEST}`);

  if (firstWritten) {
    console.log(`playing ${firstWritten}`);
    play(firstWritten);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
