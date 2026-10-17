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
  stumbledWords: string[];
  flagged: boolean;
};
