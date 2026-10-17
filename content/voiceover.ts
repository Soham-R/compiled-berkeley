// Narrator lines for the 90-second demo video. Each id becomes
// public/audio/vo/<id>.mp3 via scripts/record-voiceover.ts.
// The full shot list lives in content/demo-script.md. One entry per
// narration line, in order. 01-open and 99-close are fixed; do not edit them.
// 164 words total (169 spoken with the hyphenated compounds split).

export type VoiceoverLine = { id: string; text: string };

export const VOICEOVER: VoiceoverLine[] = [
  { id: "01-open", text: "One-on-one tutoring was always for the few." },
  {
    id: "02-day1-intro",
    text: "Maya is seven. Decoding is slow; attention fades by minute eight. For kids like her, the bottleneck isn't explanation. It's state.",
  },
  { id: "03-day1-marked", text: "Nothing is marked. Alder shows the pieces, says them once, moves on." },
  {
    id: "04-day1-flag",
    text: "Three stumbles: working memory is full. Alder downshifts before the meltdown. Any answer continues.",
  },
  {
    id: "05-day2-intro",
    text: "One Claude call writes her next page: the missed words twice each, in a Biscuit story. Shorter, after yesterday's break.",
  },
  { id: "06-day2-pieces", text: "Just the pieces this time. She does the rest." },
  {
    id: "07-day2-roadmap",
    text: "Today's signal is a word two and a half seconds late. Prosody, frustration in her voice, is the roadmap, not this demo.",
  },
  { id: "08-day5-clean", text: "Day five. Same three words, clean. Two new ones sit beside words she owns." },
  {
    id: "09-parent",
    text: "For the parent: what clicked, what's next, how long before a break. Six minutes Monday. Eleven today.",
  },
  { id: "10-why-now", text: "Edtech never did this. It couldn't hear the kid. Now it can." },
  { id: "99-close", text: "She never typed a word. The book learned her. Built for the kids one-size-fits-most already failed." },
];
