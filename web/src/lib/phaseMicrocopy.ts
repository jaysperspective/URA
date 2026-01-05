// src/lib/phaseMicrocopy.ts

export type PhaseId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type PhaseMicrocopy = {
  id: PhaseId;
  season: "SPRG" | "SUMR" | "FALL" | "WNTR";
  orisha: string;

  header: string;
  oneLine: string;
  description: string;

  actionHint?: string;

  journalPrompt: string;
  journalHelper: string;

  footer?: string;
};

// Keep this aligned to your new ontology.
// IMPORTANT: Phase 7 is Olokun (not Oya).
const PHASES: Record<PhaseId, PhaseMicrocopy> = {
  1: {
    id: 1,
    season: "SPRG",
    orisha: "Obatala",
    header: "SPRG · Phase 1 — Obatala",
    oneLine: "Clean beginnings. Establish order without forcing speed.",
    description:
      "Start light. Set the simplest structure that can hold the next 45°. Remove clutter, name the goal, and build a calm baseline.",
    actionHint: "Choose one priority. Reduce it to the first clean step.",
    journalPrompt: "What does a clean beginning look like today?",
    journalHelper: "Write plainly. Focus on what is real and doable.",
    footer: "You are here in the cycle.",
  },

  2: {
    id: 2,
    season: "SPRG",
    orisha: "Oshun",
    header: "SPRG · Phase 2 — Oshun",
    oneLine: "Momentum with warmth. Let the work feel alive.",
    description:
      "This phase rewards care and attraction: the things you nurture respond. Increase output gently while keeping quality high.",
    actionHint: "Add one improvement that makes the process sweeter.",
    journalPrompt: "What deserves more care — and what deserves less?",
    journalHelper: "Name the one thing you can nurture without overextending.",
    footer: "You are here in the cycle.",
  },

  3: {
    id: 3,
    season: "SUMR",
    orisha: "Shango",
    header: "SUMR · Phase 3 — Shango",
    oneLine: "Visibility and power. Commit to decisive action.",
    description:
      "Execution has teeth here. Make the call, ship the thing, say the truth out loud. Lead the energy instead of negotiating with it.",
    actionHint: "Pick the decision you’ve been avoiding and decide.",
    journalPrompt: "Where am I being asked to lead instead of wait?",
    journalHelper: "State the decision in one sentence. No justification needed.",
    footer: "You are here in the cycle.",
  },

  4: {
    id: 4,
    season: "SUMR",
    orisha: "Ogun",
    header: "SUMR · Phase 4 — Ogun",
    oneLine: "Build and cut. Strength through discipline.",
    description:
      "Deep work. Tools. Craft. Put in the reps and remove what blocks the path. Progress comes from commitment to the work itself.",
    actionHint: "Do the hardest 30 minutes first.",
    journalPrompt: "What needs to be built — and what needs to be cut away?",
    journalHelper: "List one build action and one cut action.",
    footer: "You are here in the cycle.",
  },

  5: {
    id: 5,
    season: "FALL",
    orisha: "Yemaya",
    header: "FALL · Phase 5 — Yemaya",
    oneLine: "Harvest and hold. Protect what matters.",
    description:
      "Consolidate gains. Strengthen your container, your boundaries, and your support. Keep what’s nourishing; release what isn’t.",
    actionHint: "Reinforce the one system that keeps you stable.",
    journalPrompt: "What am I responsible for preserving right now?",
    journalHelper: "Name what you’re protecting and why it matters.",
    footer: "You are here in the cycle.",
  },

  6: {
    id: 6,
    season: "FALL",
    orisha: "Orunmila",
    header: "FALL · Phase 6 — Orunmila",
    oneLine: "Refine and interpret. Wisdom through pattern.",
    description:
      "Make meaning from what happened. Review, edit, and distill lessons. The right next move becomes obvious when you see the pattern clearly.",
    actionHint: "Reduce complexity: keep the signal, drop the noise.",
    journalPrompt: "What pattern is repeating — and what is it teaching me?",
    journalHelper: "Write the pattern. Then write the lesson.",
    footer: "You are here in the cycle.",
  },

  7: {
    id: 7,
    season: "WNTR",
    orisha: "Olokun",
    header: "WNTR · Phase 7 — Olokun",
    oneLine: "Return to scale. Dissolve the ego’s tight grip.",
    description:
      "This is deep water. Widen the frame beyond the personal story. Let what can’t be carried dissolve. Reconnect to the larger system you’re part of.",
    actionHint: "Widen the frame: one act that reconnects you to scale.",
    journalPrompt: "What am I holding onto that is already over?",
    journalHelper: "Write plainly. No performance required.",
    footer: "You are here in the cycle.",
  },

  8: {
    id: 8,
    season: "WNTR",
    orisha: "Eshu",
    header: "WNTR · Phase 8 — Eshu",
    oneLine: "Reset the crossroads. Prepare the new turn.",
    description:
      "Clear the path for what comes next. Close loops, clean the space, and set the next intention. The smallest ritual counts.",
    actionHint: "Close one loop today. Even a small one.",
    journalPrompt: "What needs to be released so the next cycle starts clean?",
    journalHelper: "Name it. Release it. Replace it with one simple intention.",
    footer: "You are here in the cycle.",
  },
};

export function microcopyForPhase(id: PhaseId): PhaseMicrocopy {
  return PHASES[id] ?? PHASES[1];
}
