/**
 * Telemetry types for streaming prosody, latency, stumbles, and session dynamics.
 */

export type InteractionType =
  | "word_read"
  | "word_stumble"
  | "hesitation_pause"
  | "line_reread"
  | "prosody_spike"
  | "prosody_flatline"
  | "ui_offer_accepted"
  | "ui_offer_declined"
  | "mic_silence"
  | "question_attempt";

export interface TelemetryEvent {
  event_type: InteractionType;
  timestamp?: string;
  word?: string | null;
  duration_ms?: number | null;
  metadata?: Record<string, unknown>;
}

export interface SessionState {
  session_id: string;
  child_id: string;
  elapsed_seconds: number;
  stumble_count: number;
  consecutive_pauses: number;
  estimated_frustration: number;
  current_scaffold_tier: number;
  active_modality: string;
}

export interface TelemetryBatch {
  session_id: string;
  child_id: string;
  events: TelemetryEvent[];
}
