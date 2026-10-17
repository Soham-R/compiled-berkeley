/**
 * Tutor engine types: presentation, active recall scaffolding, and story beats.
 */

export type FontChoice =
  | "Lexend"
  | "Atkinson Hyperlegible"
  | "OpenDyslexic"
  | "System";

export type ContrastMode =
  | "default"
  | "calm"
  | "high_contrast"
  | "dark"
  | "diegetic_script";

export interface PresentationSettings {
  font_family: FontChoice;
  font_size_px: number;
  letter_spacing_em: number;
  line_height_em: number;
  contrast_mode: ContrastMode;
  read_aloud_enabled: boolean;
  reduced_motion: boolean;
  visual_clutter_reduced: boolean;
}

export enum EscalationRung {
  UNPROMPTED = 0,
  NARRATIVE_CLUE = 1,
  SMALLER_SUB_STEP = 2,
  REPRESENTATION_FADE = 3,
  CO_REGULATION = 4,
}

export interface ScaffoldStep {
  rung: EscalationRung;
  narrative_prompt: string;
  wait_time_seconds: number;
  must_not_give_answer: boolean;
}

export interface QuestionItem {
  prompt: string;
  options: string[];
  explanation?: string;
}

export interface PassageRequest {
  day: number;
  stumbled_words: string[];
  flagged?: boolean;
  current_rung?: EscalationRung;
  session_elapsed_minutes?: number;
}

export interface PassageResponse {
  day: number;
  passage: string;
  target_words: string[];
  question: QuestionItem;
  scaffold?: ScaffoldStep;
  presentation?: PresentationSettings;
  source?: "claude" | "fallback" | string;
}
