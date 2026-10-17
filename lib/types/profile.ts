/**
 * Profile types combining parent intake priors and dynamic behavioral observations.
 */

export interface ParentPriors {
  name: string;
  age: number;
  grade_band: string;
  diagnoses: string[];
  iep_accommodations: string[];
  interests: string[];
  sensitivities: string[];
  known_difficulties: string[];
}

export interface BehavioralProfile {
  baseline_latency_ms: number;
  attention_window_minutes: number;
  preferred_modality: "story" | "visual_micro_game" | "audio_co_regulation" | string;
  mastered_words: string[];
  struggled_words: string[];
  accepted_presentation_offers: string[];
  frustration_index: number;
}

export interface ChildProfile {
  id: string;
  priors: ParentPriors;
  behavioral: BehavioralProfile;
  created_at?: string;
  updated_at?: string;
}
