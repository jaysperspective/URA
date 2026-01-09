// src/lib/sabian/uraSabian.ts
export type UraSabianEntry = {
  idx: number; // 0..359
  key: string; // e.g. "Capricorn 18"
  sign: string; // "Capricorn"
  degree: number; // 1..30
  symbol: string; // URA paraphrase image-line
  signal: string; // what’s active
  shadow: string; // what to watch
  directive: string; // what to do
  practice: string; // one concrete behavior
  journal: string; // one question
  tags?: string[];
};

// Placeholder until generated.
// After generation, this will contain 360 entries.
export const URA_SABIAN: UraSabianEntry[] = [];
