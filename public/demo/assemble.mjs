// Turns the raw recording into (a) alder-demo-raw.mp4 with title cards and
// (b) alder-demo-90s.mp4: a tightened cut built from the beat log, every stall
// shortened to about a second and the page loads between days removed.
//
//   node assemble.mjs

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const OUT = new URL("./out/", import.meta.url).pathname;
const CARDS = new URL("./cards/", import.meta.url).pathname;
const SEG = `${OUT}seg/`;
mkdirSync(SEG, { recursive: true });

const beats = JSON.parse(readFileSync(`${OUT}beats.json`, "utf8"));
const t = (name, nth = 0) => {
  const hits = beats.filter((b) => b.name === name);
  if (!hits[nth]) throw new Error(`beat not found: ${name} #${nth}`);
  return hits[nth].t;
};
const webm = `${OUT}${readdirSync(OUT).find((f) => f.endsWith(".webm"))}`;

const ff = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
const ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30", "-an"];

// ---- 1. title cards -> png -> short mp4s
async function renderCards() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  for (const name of ["open", "close"]) {
    await page.goto(`file://${CARDS}${name}.html`);
    await page.waitForTimeout(1500); // web fonts
    await page.screenshot({ path: `${OUT}${name}.png` });
  }
  await browser.close();
}
function cardClip(name, seconds) {
  const out = `${SEG}card-${name}.mp4`;
  ff(["-loop", "1", "-t", String(seconds), "-i", `${OUT}${name}.png`, ...ENC, out]);
  return out;
}

// ---- 2. raw recording -> mp4
function rawClip() {
  const out = `${SEG}raw.mp4`;
  ff(["-i", webm, ...ENC, out]);
  return out;
}
function cut(from, to, idx) {
  const out = `${SEG}cut-${String(idx).padStart(2, "0")}.mp4`;
  ff(["-ss", from.toFixed(2), "-to", to.toFixed(2), "-i", `${SEG}raw.mp4`, ...ENC, out]);
  return out;
}
function concat(files, out) {
  const list = `${SEG}list-${out.split("/").pop()}.txt`;
  writeFileSync(list, files.map((f) => `file '${f}'`).join("\n"));
  ff(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", out]);
}

// ---- 3. the 90-second cut, as keep-ranges in raw time
function ranges() {
  const dash = t("kid world dashboard");
  const s1 = t("day 1 story screen"), r1 = t("day 1: reading starts");
  const st = (day, w) => t(`${day}: stall before "${w}"`);
  const bx = (day, i) => beats.filter((b) => b.name.startsWith(`${day}: sound-out box`))[i].t;
  const d1 = "day 1", d2 = "day 2", d5 = "day 5";
  const done1 = t("day 1: page done"), ans1 = t("day 1: answered the question"), next1 = t("day 1: next story");
  const s2 = t("day 2 story screen"), done2 = t("day 2: page done"), next2 = t("day 2: next story");
  const s5 = t("day 5 story screen"), r5 = t("day 5: reading starts"), done5 = t("day 5: page done");
  const parent = t("parent note"), end = t("end");

  const stalls1 = beats.filter((b) => b.name.startsWith("day 1: stall")).map((b) => b.t);
  const boxes1 = beats.filter((b) => b.name.startsWith("day 1: sound-out box")).map((b) => b.t);

  const R = [];
  const keep = (a, b, label) => { if (b > a + 0.2) R.push([a, b, label]); };

  keep(dash - 1.0, dash + 2.2, "dashboard, tap Story time");
  keep(s1 - 0.6, stalls1[0] + 1.1, "day 1 page, first words, stall on through");
  keep(boxes1[0] - 0.3, boxes1[0] + 3.6, "sound-out box: th + rough");
  keep(boxes1[0] + 3.6, Math.min(boxes1[0] + 7.4, stalls1[1] + 1.0), "reading on");
  keep(stalls1[1] - 0.6, stalls1[1] + 1.0, "stall on second word");
  keep(boxes1[1] - 0.3, boxes1[1] + 3.0, "sound-out box 2");
  keep(stalls1[2] - 0.8, stalls1[2] + 1.0, "stall on third word");
  keep(boxes1[2] - 0.3, boxes1[2] + 2.6, "sound-out box 3");
  keep(done1 - 0.6, done1 + 2.2, "page done: summary + question");
  keep(ans1 - 0.6, next1 + 0.3, "answer, Next story");
  keep(s2 - 0.6, s2 + 2.2, "day 2 page (shorter, practice chips)");
  keep(st(d2, "through") - 1.6, st(d2, "through") + 1.0, "day 2 stall on through");
  keep(bx(d2, 0) - 0.3, bx(d2, 0) + 3.0, "day 2 sound-out box");
  keep(bx(d2, 0) + 3.0, bx(d2, 0) + 5.6, "day 2 reads on clean");
  keep(done2 - 2.4, done2 + 2.0, "day 2 finishes, summary");
  keep(next2 - 0.8, next2 + 0.3, "Next story");
  keep(s5 - 0.6, s5 + 2.4, "day 5 page: where / which chips");
  keep(r5 + 2.0, r5 + 5.0, "day 5 reading clean (jump cut)");
  keep(done5 - 2.6, done5 + 2.2, "day 5 finishes, summary");
  keep(parent - 0.3, Math.min(end, parent + 7.0), "parent note + cards");
  return R;
}

async function main() {
  await renderCards();
  const open = cardClip("open", 5);
  const close = cardClip("close", 7);
  const raw = rawClip();

  concat([open, raw, close], `${OUT}alder-demo-raw.mp4`);

  const R = ranges();
  const parts = R.map(([a, b], i) => cut(a, b, i));
  concat([open, ...parts, close], `${OUT}alder-demo-90s.mp4`);

  // timeline for the editor: where each kept segment lands in the cut
  let cursor = 5;
  const lines = ["| Cut time | Secs | What's on screen | Raw time |", "|---|---|---|---|", "| 0:00 | 5.0 | open card | card |"];
  for (const [a, b, label] of R) {
    const d = b - a;
    lines.push(`| ${fmt(cursor)} | ${d.toFixed(1)} | ${label} | ${a.toFixed(1)}–${b.toFixed(1)} |`);
    cursor += d;
  }
  lines.push(`| ${fmt(cursor)} | 7.0 | close card | card |`);
  cursor += 7;
  const md = `# Alder demo: 90-second cut timeline\n\nTotal: **${fmt(cursor)}** (${cursor.toFixed(1)} s). Silent; narration, Alder's voice and B-roll go on top in the edit.\n\n${lines.join("\n")}\n`;
  writeFileSync(`${OUT}cut-timeline.md`, md);
  console.log(md);
}
function fmt(s) { const m = Math.floor(s / 60); const r = s - m * 60; return `${m}:${r.toFixed(0).padStart(2, "0")}`; }

main().catch((e) => { console.error(e); process.exit(1); });
