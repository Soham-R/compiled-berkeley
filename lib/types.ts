/**
 * Unified type definitions for Wren frontend.
 */

export * from "./types/profile";
export * from "./types/telemetry";
export * from "./types/tutor";

// Backward compatibility types for existing hackathon routes
export type Question = {
  prompt: string;
  options: string[];
};

export type Passage = {
  day: number;
  passage: string;
  targetWords: string[];
  question: Question;
  source?: "claude" | "fallback";
};

export type NextPageRequest = {
  day: number;
  stumbledWords: string[]; // legacy shape; treated as hintLevel 2 when `words` is absent
  flagged: boolean;
  words?: WordResult[]; // preferred: carries hintLevel per word
  previousPassage?: string; // the page just read, so the story continues
  childId?: string; // sent by the kid site; used only when WREN_BACKEND_URL is set
};

// Age-dependent knobs. Live in content/profile.json so /read and the parent
// summary read the same numbers; a session record itself is age-agnostic.
export type Thresholds = {
  stumbleTimeoutSec: number; // no match for the current word -> stumbled
  silenceFlagSec: number; // silence mid-passage -> flagged
  stumblesToFlag: number; // stumbles in one passage -> flagged
  expectedAttentionMin: number; // what "normal" time-to-break looks like at this age
};

export type Profile = {
  name: string;
  age: number;
  band: string;
  interests: string[];
  hard: string[];
  thresholds: Thresholds;
};

// 0 none, 1 chunks shown, 2 first chunk sounded out, 3 whole word modeled.
export type HintLevel = 0 | 1 | 2 | 3;

export type WordResult = {
  word: string;
  status: "clean" | "stumbled";
  hintLevel: HintLevel;
};

// One record per page read. /read writes these (raw facts only);
// the parent summary interprets them. Never shown to the kid.
export type Session = {
  day: number; // session number since account start; drives the 1/3/7/weekly cadence
  date: string; // ISO date, YYYY-MM-DD
  passageDay: number; // which entry in content/passages.json was read
  durationSec: number;
  words: WordResult[]; // target words plus any stumbles, not every "the"
  flagged: boolean;
  flagReason: "stumbles" | "silence" | null;
  secondsUntilFlag: number | null; // the "how long before she needed a break" number
  breakAnswer: string | null; // what she picked on the Biscuit card
};

export type SensoryResponse = "Typical" | "Over_Responsive" | "Under_Responsive";

export type CommunicationMode =
  | "Non_Verbal"
  | "Single_Words"
  | "Verbal_Phrases"
  | "Sentences";

export type ReportCadence = "weekly" | "daily";

export type ParentProfile = {
  name: string;
  age: string;
  primary_diagnoses: string[];
  communication_mode: CommunicationMode;
  known_triggers: string[];
  hyperfixations: string[];
  sensory_profile: {
    auditory: SensoryResponse;
    visual: SensoryResponse;
  };
  parent_goals: string[];
  report_cadence: ReportCadence;
};
