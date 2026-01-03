// src/lib/phaseMicrocopy.ts

export type SeasonAbbrev = "SPRG" | "SUMR" | "FALL" | "WNTR";

export type OrishaKey =
  | "Obatala"
  | "Yemoja"
  | "Oshun"
  | "Shango"
  | "Ogun"
  | "Ochosi"
  | "Oya"
  | "Egungun";

export type PhaseId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type PhaseMicrocopy = {
  id: PhaseId;
  season: SeasonAbbrev;
  orisha: OrishaKey;

  header: string;
  oneLine: string;

  description: string;

  journalPrompt: string;
  journalHelper: string;

  actionHint?: string;
  footer?: string;
};

export const PHASE_COPY: Record<PhaseId, PhaseMicrocopy> = {
  1: {
    id: 1,
    season: "SPRG",
    orisha: "Obatala",
    header: "SPRG · Phase 1 — Obatala",
    oneLine: "Stillness restores correct form.",
    description:
      "This phase is about clarity and correct orientation. Reduce excess. Align decisions with principle rather than urgency.",
    journalPrompt: "What needs clarification or simplification right now?",
    journalHelper: "Write plainly. No performance required.",
    actionHint: "Reduce noise before deciding.",
    footer: "You are here in the cycle.",
  },
  2: {
    id: 2,
    season: "SPRG",
    orisha: "Yemoja",
    header: "SPRG · Phase 2 — Yemoja",
    oneLine: "What is forming needs care, not force.",
    description:
      "Movement begins internally. Emotional awareness matters more than action right now.",
    journalPrompt: "What is quietly forming in my life?",
    journalHelper: "Write plainly. No performance required.",
    actionHint: "Tend feelings before moving forward.",
    footer: "You are here in the cycle.",
  },
  3: {
    id: 3,
    season: "SUMR",
    orisha: "Oshun",
    header: "SUMR · Phase 3 — Oshun",
    oneLine: "Value attracts what belongs.",
    description:
      "Desire becomes visible here. Notice what feels nourishing, mutual, and worth choosing.",
    journalPrompt: "What do I genuinely value at this moment?",
    journalHelper: "Write plainly. No performance required.",
    actionHint: "Choose what feels reciprocal.",
    footer: "You are here in the cycle.",
  },
  4: {
    id: 4,
    season: "SUMR",
    orisha: "Shango",
    header: "SUMR · Phase 4 — Shango",
    oneLine: "Truth asks to be expressed.",
    description:
      "This is a moment for expression and leadership. What is true must be spoken or acted on.",
    journalPrompt: "What truth needs expression or action?",
    journalHelper: "Write plainly. No performance required.",
    actionHint: "Commit publicly or decisively.",
    footer: "You are here in the cycle.",
  },
  5: {
    id: 5,
    season: "FALL",
    orisha: "Ogun",
    header: "FALL · Phase 5 — Ogun",
    oneLine: "What exists must be worked.",
    description:
      "Reality sets in. Effort, discipline, and follow-through shape what lasts.",
    journalPrompt: "What work can no longer be avoided?",
    journalHelper: "Precision matters more than length.",
    actionHint: "Work steadily. Repair what’s broken.",
    footer: "You are here in the cycle.",
  },
  6: {
    id: 6,
    season: "FALL",
    orisha: "Ochosi",
    header: "FALL · Phase 6 — Ochosi",
    oneLine: "Accuracy restores alignment.",
    description:
      "Review your direction. Small corrections now prevent larger consequences later.",
    journalPrompt: "Where has my aim drifted off course?",
    journalHelper: "Precision matters more than length.",
    actionHint: "Adjust direction, not intention.",
    footer: "You are here in the cycle.",
  },
  7: {
    id: 7,
    season: "WNTR",
    orisha: "Oya",
    header: "WNTR · Phase 7 — Oya",
    oneLine: "What cannot change must end.",
    description:
      "Release what has reached its limit. Endings clear space for the next cycle.",
    journalPrompt: "What am I holding onto that is already over?",
    journalHelper: "Write plainly. No performance required.",
    actionHint: "Release without negotiation.",
    footer: "You are here in the cycle.",
  },
  8: {
    id: 8,
    season: "WNTR",
    orisha: "Egungun",
    header: "WNTR · Phase 8 — Egungun",
    oneLine: "Wisdom is what remains.",
    description:
      "Reflect on what this cycle revealed. Meaning is gathered, not forced.",
    journalPrompt: "What lesson does this cycle leave behind?",
    journalHelper: "Precision matters more than length.",
    actionHint: "Record what you’ve learned.",
    footer: "You are here in the cycle.",
  },
};

function norm360(deg: number) {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

/** 0–44.999 => 1 ... 315–359.999 => 8 */
export function phaseFromDegrees(deg: number): PhaseId {
  const d = norm360(deg);
  const idx = Math.floor(d / 45) + 1;
  return Math.min(8, Math.max(1, idx)) as PhaseId;
}

export function microcopyForPhase(phase: PhaseId): PhaseMicrocopy {
  return PHASE_COPY[phase];
}

export function microcopyFromDegrees(deg: number): PhaseMicrocopy {
  return microcopyForPhase(phaseFromDegrees(deg));
}
