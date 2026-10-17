export type Question = {
  prompt: string;
  options: string[];
};

export type Passage = {
  day: number;
  passage: string;
  targetWords: string[];
  question: Question;
};

export type NextPageRequest = {
  day: number;
  stumbledWords: string[];
  flagged: boolean;
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
