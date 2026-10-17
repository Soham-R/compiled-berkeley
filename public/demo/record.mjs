// Drives the Alder site through the demo flow in a scripted Chromium, records
// the screen, and logs the timestamp of every beat so narration can be laid on
// top in the edit. A fake SpeechRecognition feeds the words at a kid's pace and
// goes quiet before the target words so the real stall timer and sound-out
// box fire.
//
//   node record.mjs            # writes out/recording.webm, out/beats.json, out/shots/*.png

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = new URL("./out/", import.meta.url).pathname;
mkdirSync(`${OUT}shots`, { recursive: true });

const WORD_MS = 300; // reading pace
const STALL_WAIT_MS = 6500; // stall timer is 5.5 s on this profile; margin for the box to appear
const BOX_HOLD_MS = 3000; // how long the sound-out box stays before she says the word

const beats = [];
let t0 = 0;
const mark = (name, note = "") => {
  const t = (Date.now() - t0) / 1000;
  beats.push({ t: +t.toFixed(1), name, note });
  console.log(`${t.toFixed(1).padStart(6)}s  ${name}${note ? "  (" + note + ")" : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Injected before any page script: a controllable recognizer.
const FAKE_RECOGNIZER = `
  class FakeRecognition {
    constructor() { this.continuous = false; this.interimResults = false; this.lang = 'en-US'; this.maxAlternatives = 1; }
    start() { window.__rec = this; if (this.onstart) this.onstart(); }
    stop() { if (window.__rec === this) window.__rec = null; if (this.onend) this.onend(); }
    abort() { this.stop(); }
  }
  window.SpeechRecognition = FakeRecognition;
  window.webkitSpeechRecognition = FakeRecognition;
  window.__hear = (text, isFinal = true) => {
    const r = window.__rec; if (!r || !r.onresult) return false;
    const alt = [{ transcript: text, confidence: 0.9 }];
    const res = Object.assign(alt, { isFinal, length: 1 });
    r.onresult({ resultIndex: 0, results: [res] });
    return true;
  };
`;

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
    deviceScaleFactor: 1,
  });
  await context.addInitScript(FAKE_RECOGNIZER);
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log("page error:", e.message));

  // A brand-new child has no memory yet, so the first page would have nothing
  // to practice. Stand in for the memory engine: the first story carries the
  // three th- words, the third introduces where/which, like the seeded week.
  const PRACTICE_BY_CALL = [["through", "think", "there"], null, ["where", "which"]];
  let nextPageCalls = 0;
  await page.route("**/api/next-page", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    const forced = PRACTICE_BY_CALL[nextPageCalls++];
    if (forced) {
      body.stumbledWords = forced;
      body.words = forced.map((word) => ({ word, status: "stumbled", hintLevel: 2 }));
    }
    await route.continue({ postData: JSON.stringify(body) });
  });
  t0 = Date.now();

  const shot = (name) => page.screenshot({ path: `${OUT}shots/${name}.png` });

  // ---- onboarding: example profile, name Maya, build her world
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#fillExample");
  await page.addStyleTag({ content: "#kid { zoom: 0.86; }" });
  mark("site loaded");
  await page.locator("#start").scrollIntoViewIfNeeded();
  await sleep(1200);
  await page.click("#fillExample"); // fills the example and jumps to step 4; step 1 fields are hidden now
  await page.evaluate(() => {
    document.getElementById("childName").value = "Maya";
    document.getElementById("interests").value = "her dog Biscuit, dinosaurs, her little sister Priya";
  });
  await sleep(1500);
  await shot("01-onboarding");
  await page.click("#nextBtn");
  await page.waitForSelector("#kid:not([hidden])");
  await sleep(2500);
  mark("kid world: warm-up games");
  await shot("02a-warmup");
  const skip = page.locator("#kBenchSkip");
  if (await skip.count()) {
    await skip.click();
    await page.waitForSelector(".k-card.story", { timeout: 15000 });
    await sleep(2000);
  }
  mark("kid world dashboard");
  await shot("02-dashboard");

  // ---- Story time
  await page.click(".k-card.story");
  await page.waitForSelector("#kText", { timeout: 30000 });
  await sleep(1500);
  mark("day 1 story screen");
  await shot("03-day1-story");

  await readPage(page, { stallOn: ["through", "think", "there"], label: "day 1" }, shot);
  await answerAndNext(page, "day 1");

  await page.waitForSelector("#kText", { timeout: 30000 });
  await sleep(1500);
  mark("day 2 story screen");
  await shot("06-day2-story");
  await readPage(page, { stallOn: ["through"], stallOnce: true, label: "day 2" }, shot);
  await answerAndNext(page, "day 2");

  await page.waitForSelector("#kText", { timeout: 30000 });
  await sleep(1500);
  mark("day 5 story screen");
  await shot("08-day5-story");
  await readPage(page, { stallOn: [], label: "day 5" }, shot);
  await sleep(2500);
  await shot("09-day5-summary");

  // ---- grown-ups hold -> parent note
  const parentBtn = page.locator("#kParent");
  await parentBtn.scrollIntoViewIfNeeded();
  const box = await parentBtn.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await parentBtn.dispatchEvent("pointerdown");
  mark("holding grown-ups button");
  await sleep(1500);
  const navigated = await page.waitForURL(/\/parent/, { timeout: 4000 }).then(() => true).catch(() => false);
  if (!navigated) { console.log("  (hold did not navigate; opening /parent directly)"); await page.goto(`${BASE}/parent?day=7`); }
  await page.waitForSelector("text=From Alder", { timeout: 20000 });
  await sleep(1500);
  mark("parent note");
  await shot("10-parent-note");
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 90);
    await sleep(550);
  }
  await sleep(2500);
  await shot("11-parent-cards");
  mark("end");

  await context.close();
  await browser.close();
  writeFileSync(`${OUT}beats.json`, JSON.stringify(beats, null, 2));
  console.log("done");
}

// Feeds the page's words through the fake recognizer, going quiet before each
// word in `stallOn` so the real stall timer fires the sound-out box.
async function readPage(page, { stallOn, stallOnce = false, label }, shot) {
  const words = await page.$$eval("#kText .k-w", (els) => els.map((e) => e.textContent));
  const norm = (w) => w.toLowerCase().replace(/[^a-z']/g, "");
  // If none of the wanted words are on the page, stall on its three longest words instead.
  const present = stallOn.filter((s) => words.some((w) => norm(w) === s));
  if (stallOn.length && !present.length) {
    const longest = [...new Set(words.map(norm))].sort((a, b) => b.length - a.length).slice(0, stallOn.length);
    console.log(`  (none of ${stallOn.join(",")} on this page; stalling on ${longest.join(",")})`);
    stallOn = longest;
  }
  // The page auto-starts listening after "Read it out loud."; only tap the mic if it hasn't.
  await page.waitForTimeout(2500);
  const listening = await page.$eval("#kMic", (b) => b.classList.contains("listening"));
  if (!listening) await page.click("#kMic");
  await page.waitForSelector("#kMic.listening", { timeout: 10000 });
  await sleep(600);
  mark(`${label}: reading starts`, `${words.length} words`);
  const stalled = new Set();
  let shotN = 0;
  for (let i = 0; i < words.length; i++) {
    const w = norm(words[i]);
    const shouldStall = stallOn.includes(w) && !stalled.has(w);
    if (shouldStall) {
      stalled.add(w);
      stalled.add(`${w}#${i}`);
      mark(`${label}: stall before "${w}"`);
      await sleep(STALL_WAIT_MS);
      const boxUp = await page.$("#kHelp .k-soundout");
      if (boxUp) await page.evaluate(() => document.getElementById("kHelp").scrollIntoView({ behavior: "smooth", block: "end" }));
      await sleep(600);
      mark(`${label}: sound-out box ${boxUp ? "shown" : "NOT shown"}`, w);
      if (boxUp && shotN === 0) await shot(`${label === "day 1" ? "04" : "07"}-${label.replace(" ", "")}-stumble-${w}`);
      shotN++;
      await sleep(BOX_HOLD_MS);
      // she says the word; keep feeding until the recognizer is listening again
      for (let tries = 0; tries < 20; tries++) {
        if (await page.evaluate((t) => window.__hear(t), words[i])) break;
        await sleep(400);
      }
      await sleep(WORD_MS);
      continue;
    }
    await page.evaluate((t) => window.__hear(t), words[i]);
    await sleep(WORD_MS);
  }
  await page.waitForSelector("#kSum .k-summary", { timeout: 15000 }).catch(() => {});
  mark(`${label}: page done`);
}

async function answerAndNext(page, label) {
  await sleep(2000);
  await page.screenshot({ path: `${OUT}shots/${label === "day 1" ? "05" : "07b"}-${label.replace(" ", "")}-summary.png` });
  const opt = page.locator("#kSum .k-q .opts button").first();
  if (await opt.count()) {
    await opt.click();
    mark(`${label}: answered the question`);
    await sleep(2500);
  }
  await page.click("#kNext");
  mark(`${label}: next story`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
