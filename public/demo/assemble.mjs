// Turns the raw recording into:
//   alder-demo-raw.mp4   the whole run with title cards (silent)
//   alder-demo-90s.mp4   the tightened cut: stalls shortened, loads removed,
//                        B-roll before the close, Alder's voice mixed in
//   cut-timeline.md      where each kept segment lands in the cut
//   narration-cues.md    which narration line to read at which timestamp
//
//   node assemble.mjs

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { chromium } from "playwright";

const OUT = new URL("./out/", import.meta.url).pathname;
const CARDS = new URL("./cards/", import.meta.url).pathname;
const VOICE = new URL("./voice/", import.meta.url).pathname;
const CLIPS = "/Users/luka/Developer/Compiled Hackathon/public/audio/";
const SEG = `${OUT}seg/`;
mkdirSync(SEG, { recursive: true });

const beats = JSON.parse(readFileSync(`${OUT}beats.json`, "utf8"));
const t = (name) => {
  const hit = beats.find((b) => b.name === name);
  if (!hit) throw new Error(`beat not found: ${name}`);
  return hit.t;
};
const webm = `${OUT}${readdirSync(OUT).find((f) => f.endsWith(".webm"))}`;

const ff = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
const ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30", "-an"];
const fmt = (s) => `${Math.floor(s / 60)}:${(s - Math.floor(s / 60) * 60).toFixed(0).padStart(2, "0")}`;

async function renderCards() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  for (const name of ["open", "close"]) {
    await page.goto(`file://${CARDS}${name}.html`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}${name}.png` });
  }
  await browser.close();
}
const cardClip = (name, seconds) => {
  const out = `${SEG}card-${name}.mp4`;
  ff(["-loop", "1", "-t", String(seconds), "-i", `${OUT}${name}.png`, ...ENC, out]);
  return out;
};
const rawClip = () => { const out = `${SEG}raw.mp4`; ff(["-i", webm, ...ENC, out]); return out; };
const cut = (from, to, idx) => {
  const out = `${SEG}cut-${String(idx).padStart(2, "0")}.mp4`;
  ff(["-ss", from.toFixed(2), "-to", to.toFixed(2), "-i", `${SEG}raw.mp4`, ...ENC, out]);
  return out;
};
const concat = (files, out) => {
  const list = `${SEG}list-${out.split("/").pop()}.txt`;
  writeFileSync(list, files.map((f) => `file '${f}'`).join("\n"));
  ff(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", out]);
};

// Keep-ranges in raw time. `voice` = clip to play at the segment start (+offset).
function ranges() {
  const dash = t("kid world dashboard");
  const s1 = t("day 1 story screen");
  const stalls1 = beats.filter((b) => b.name.startsWith("day 1: stall")).map((b) => ({ t: b.t, w: b.name.match(/"(\w+)"/)[1] }));
  const boxes1 = beats.filter((b) => b.name.startsWith("day 1: sound-out box")).map((b) => b.t);
  const done1 = t("day 1: page done"), ans1 = t("day 1: answered the question"), next1 = t("day 1: next story");
  const s2 = t("day 2 story screen"), st2 = t('day 2: stall before "through"');
  const bx2 = beats.find((b) => b.name.startsWith("day 2: sound-out box")).t;
  const done2 = t("day 2: page done"), next2 = t("day 2: next story");
  const s5 = t("day 5 story screen"), r5 = t("day 5: reading starts"), done5 = t("day 5: page done");
  const parent = t("parent note"), end = t("end");

  const R = [];
  const keep = (a, b, label, voice = null, voiceAt = 0.2) => { if (b > a + 0.2) R.push({ a, b, label, voice, voiceAt }); };

  keep(dash - 1.0, dash + 2.2, "dashboard, tap Story time");
  keep(s1 - 0.6, stalls1[0].t + 1.1, "day 1 page, first words, stall", `${VOICE}read.mp3`, 0.4);
  keep(boxes1[0] - 0.3, boxes1[0] + 3.6, `sound-out box: ${stalls1[0].w}`, `${CLIPS}soundout-${stalls1[0].w}.mp3`);
  keep(boxes1[0] + 3.6, Math.min(boxes1[0] + 7.4, stalls1[1].t + 1.0), "reading on");
  keep(stalls1[1].t - 0.6, stalls1[1].t + 1.0, `stall on ${stalls1[1].w}`);
  keep(boxes1[1] - 0.3, boxes1[1] + 3.2, `sound-out box: ${stalls1[1].w}`, `${CLIPS}soundout-${stalls1[1].w}.mp3`);
  keep(stalls1[2].t - 0.8, stalls1[2].t + 1.0, `stall on ${stalls1[2].w}`);
  keep(boxes1[2] - 0.3, boxes1[2] + 3.2, `sound-out box: ${stalls1[2].w}`, `${CLIPS}soundout-${stalls1[2].w}.mp3`);
  keep(done1 - 0.6, done1 + 2.2, "page done: summary + question");
  keep(ans1 - 0.6, next1 + 0.3, "answer, Next story");
  keep(s2 - 0.6, s2 + 2.2, "day 2 page (shorter, practice chips)", `${VOICE}read.mp3`, 0.4);
  keep(st2 - 1.6, st2 + 1.0, "day 2 stall on through");
  keep(bx2 - 0.3, bx2 + 3.2, "day 2 sound-out box: through", `${CLIPS}soundout-through.mp3`);
  keep(bx2 + 3.2, bx2 + 5.8, "day 2 reads on clean", `${CLIPS}clean.mp3`, 0.6);
  keep(done2 - 2.4, done2 + 2.0, "day 2 finishes, summary");
  keep(next2 - 0.8, next2 + 0.3, "Next story");
  keep(s5 - 0.6, s5 + 2.4, "day 5 page: where / which chips", `${VOICE}read.mp3`, 0.4);
  keep(r5 + 2.0, r5 + 5.0, "day 5 reading clean (jump cut)");
  keep(done5 - 2.6, done5 + 2.2, "day 5 finishes, summary", `${CLIPS}pagedone.mp3`, 2.2);
  keep(parent - 0.3, Math.min(end, parent + 7.0), "parent note + cards");
  return R;
}

// Narration line -> the segment label it starts on.
const NARRATION = [
  ["open card", "One-on-one tutoring was always for the few."],
  ["dashboard, tap Story time", "Maya is seven. Decoding is slow; attention fades by minute eight. For kids like her, the bottleneck isn't explanation. It's state."],
  ["reading on", "Nothing is marked. Alder shows the pieces, says them once, moves on."],
  ["page done: summary + question", "Three stumbles: working memory is full. Alder downshifts before the meltdown. Any answer continues."],
  ["day 2 page (shorter, practice chips)", "One Claude call writes her next page around the words she missed, in a Biscuit story that picks up where yesterday's left off."],
  ["day 2 reads on clean", "Just the pieces this time. She does the rest."],
  ["day 2 finishes, summary", "Today's signal is a word that comes a few seconds late. Prosody, frustration in her voice, is the roadmap, not this demo."],
  ["day 5 page: where / which chips", "Day five. No stumbles. Two new words sit beside words she already owns."],
  ["parent note + cards", "For the parent: what clicked, what's next, how long before a break. Six minutes Monday. Eleven by Friday."],
  ["b-roll", "Edtech never did this. It couldn't hear the kid. Now it can."],
  ["close card", "She never typed a word. The book learned her. Built for the kids one-size-fits-most already failed."],
];

async function main() {
  await renderCards();
  const open = cardClip("open", 5);
  const close = cardClip("close", 12); // room for two narration lines over the title card
  const raw = rawClip();
  concat([open, raw, close], `${OUT}alder-demo-raw.mp4`);

  const R = ranges();
  const parts = R.map((r, i) => cut(r.a, r.b, i));
  const broll = `${SEG}broll.mp4`;
  const hasBroll = existsSync(broll);
  const silent = `${SEG}cut-silent.mp4`;
  concat([open, ...parts, ...(hasBroll ? [broll] : []), close], silent);

  // Timeline + voice cue positions in cut time.
  let cursor = 5;
  const timeline = [{ at: 0, secs: 5, label: "open card" }];
  const cues = [];
  for (const r of R) {
    const d = r.b - r.a;
    timeline.push({ at: cursor, secs: d, label: r.label, raw: `${r.a.toFixed(1)}–${r.b.toFixed(1)}` });
    // SOUNDOUTS_ONLY=1: Alder speaks only during the sound-out boxes; the narrator carries the rest.
    if (r.voice && (!process.env.SOUNDOUTS_ONLY || r.voice.includes("soundout-"))) cues.push({ at: cursor + r.voiceAt, file: r.voice });
    cursor += d;
  }
  if (hasBroll) { timeline.push({ at: cursor, secs: 5, label: "b-roll" }); cursor += 5; }
  timeline.push({ at: cursor, secs: 12, label: "close card" });
  const total = cursor + 12;

  // Mix Alder's voice onto the cut.
  const inputs = ["-i", silent];
  const filters = [];
  cues.forEach((c, i) => {
    inputs.push("-i", c.file);
    const ms = Math.round(c.at * 1000);
    filters.push(`[${i + 1}:a]adelay=${ms}|${ms},volume=1.0[a${i}]`);
  });
  const mix = `${cues.map((_, i) => `[a${i}]`).join("")}amix=inputs=${cues.length}:normalize=0:dropout_transition=0[aout]`;
  ff([...inputs, "-filter_complex", `${filters.join(";")};${mix}`, "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", `${OUT}alder-demo-90s.mp4`]);

  const tl = ["| Cut time | Secs | What's on screen | Raw time |", "|---|---|---|---|",
    ...timeline.map((x) => `| ${fmt(x.at)} | ${x.secs.toFixed(1)} | ${x.label} | ${x.raw ?? "card"} |`)];
  writeFileSync(`${OUT}cut-timeline.md`, `# Alder demo: cut timeline\n\nTotal: **${fmt(total)}** (${total.toFixed(1)} s). Alder's voice is mixed in; narration goes on top.\n\n${tl.join("\n")}\n`);

  const closeAt = timeline.find((x) => x.label === "close card").at;
  const cueLines = NARRATION.map(([label, text]) => {
    const seg = timeline.find((x) => x.label === label);
    // With no B-roll footage, the "Edtech never did this" line sits over the last seconds of the parent view.
    const at = label === "close card" ? closeAt + 5 : seg ? seg.at : closeAt;
    return `| **${fmt(at)}** | ${text} |`;
  });
  const md = `# Alder demo: narration cues\n\nOne person reads these eleven lines over \`alder-demo-90s.mp4\`, each starting at its timestamp. Calm pace, like telling a friend. Total runtime ${fmt(total)}; the narration is about 70 seconds of speech, so there is slack. Alder's own voice is already in the video at 0:${""}14, 0:23, 0:28 and 0:43 (the sound-outs); don't talk over those four moments, let them play.\n\n| Start at | Say |\n|---|---|\n${cueLines.join("\n")}\n\nAlder's voice cues already mixed in (for reference): ${cues.map((c) => `${fmt(c.at)} ${c.file.split("/").pop()}`).join(", ")}.\n`;
  writeFileSync(`${OUT}narration-cues.md`, md);
  console.log(md);
  console.log(`\ntotal ${fmt(total)} (${total.toFixed(1)} s)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
