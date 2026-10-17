// Narrator lines for the 90-second demo video. Each id becomes
// public/audio/vo/<id>.mp3 via scripts/record-voiceover.ts.
// The full shot list lives in content/demo-script.md (written in the video step).

export type VoiceoverLine = { id: string; text: string };

export const VOICEOVER: VoiceoverLine[] = [
  { id: "01-open", text: "One-on-one tutoring was always for the few." },
  { id: "99-close", text: "She never typed a word. The book learned her. Built for the kids one-size-fits-most already failed." },
];
