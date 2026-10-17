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
