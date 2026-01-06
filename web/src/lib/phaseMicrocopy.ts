// src/lib/phaseMicrocopy.ts

export type PhaseId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Optional selector for Phase 6 (non-breaking)
export type Phase6Aspect = "oya" | "ogun";

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

// Keep this aligned to the URA ontology canon.
// IMPORTANT: Phase 7 is Olokun (not Oya).
// Canon: 1 Eshu, 2 Obatala, 3 Oshun, 4 Yemoja, 5 Shango, 6 Oya ⇄ Ogun, 7 Olokun, 8 Orunmila
const PHASES: Record<PhaseId, PhaseMicrocopy> = {
  1: {
    id: 1,
    season: "SPRG",
    orisha: "Eshu",
    header: "SPRG · Phase 1 — Emergence (Eshu)",
    oneLine: "Personal spring. Motion returns before clarity does.",
    description:
      "0°–45°. Energy rises from dormancy and identity begins to re-form. This is not a personality state—it’s a mode of engagement: starting again, even if circumstances look the same. Don’t demand certainty. Begin moving in a clean direction and let clarity arrive through motion.",
    actionHint: "Start one real step that proves you’ve begun.",
    journalPrompt: "What is starting again—quietly, but for real?",
    journalHelper:
      "Name the beginning in one sentence. Then write the smallest next step that creates motion.",
    footer: "You are here in the cycle.",
  },

  2: {
    id: 2,
    season: "SPRG",
    orisha: "Obatala",
    header: "SPRG · Phase 2 — Establishment (Obatala)",
    oneLine: "Structure forms so the beginning can hold.",
    description:
      "45°–90°. Energy strengthens and structure forms. This is the season of establishment: commitment, orientation, and testing your direction against reality. Posture, habits, boundaries, and pace take shape so what has begun can actually last.",
    actionHint: "Strengthen one core structure. Remove one unstable element.",
    journalPrompt: "What structure would protect the truth of this beginning?",
    journalHelper:
      "Name one boundary, rule, or rhythm you will keep for the next 45°.",
    footer: "You are here in the cycle.",
  },

  
  3: {
    id: 3,
    season: "SUMR",
    orisha: "Oshun",
    header: "SUMR · Phase 3 — Differentiation (Oshun)",
    oneLine: "Attention and refinement. Quality becomes the signal.",
    description:
      "90°–135°. Momentum becomes visible and refinement matters. This phase is about tending: adjusting what you’re building through attention, calibration, and care. Differentiation happens through quality, not force—what you nurture responds, what you neglect decays.",
    actionHint: "Improve one detail that increases clarity, beauty, or ease.",
    journalPrompt: "What deserves more care—and what deserves less?",
    journalHelper:
      "Name one thing to nurture. Name one thing to stop feeding. Keep both practical.",
    footer: "You are here in the cycle.",
  },

  4: {
    id: 4,
    season: "SUMR",
    orisha: "Yemoja",
    header: "SUMR · Phase 4 — Bonding (Yemoja)",
    oneLine: "Containment and belonging. Safety before independence.",
    description:
      "135°–180°. The container becomes the work. Strengthen support systems, emotional safety, and the structures that hold growth. Bonding here is co-regulation: life held steadily until it can stand on its own without breaking.",
    actionHint: "Reinforce the one support that keeps you steady.",
    journalPrompt: "Where do I need steadier support, safety, or belonging?",
    journalHelper:
      "Name the container (who/what). Then name what you need from it in clear terms.",
    footer: "You are here in the cycle.",
  },

  5: {
    id: 5,
    season: "FALL",
    orisha: "Shango",
    header: "FALL · Phase 5 — Assertion (Shango)",
    oneLine: "Presence and consequence. Decide and act cleanly.",
    description:
      "180°–225°. This is the beginning of autumn: meaning and consequence rise. You lead with clarity, ship what’s real, and say what’s true. This phase prevents collapse through decisive, accountable action—no drifting, no hiding behind analysis.",
    actionHint: "Pick the decision you’ve been avoiding and decide—cleanly.",
    journalPrompt: "Where am I being asked to lead instead of wait?",
    journalHelper:
      "State the decision in one sentence. Then write the next action that makes it real.",
    footer: "You are here in the cycle.",
  },

  6: {
    id: 6,
    season: "FALL",
    orisha: "Oya ⇄ Ogun",
    header: "FALL · Phase 6 — Transformation (Oya ⇄ Ogun)",
    oneLine: "Correction and rebuild. End what’s over; forge what holds.",
    description:
      "225°–270°. This phase is refinement through change. Oya clears stagnation and ends what’s complete. Ogun rebuilds through tools, discipline, and new form. Same phase, two mechanisms: first the cut, then the construction. Coherence becomes the priority.",
    actionHint: "Choose your mode: clear (Oya) or forge (Ogun). Do the clear first.",
    journalPrompt: "What must end—and what must be rebuilt in its place?",
    journalHelper:
      "Write 1 ending (Oya) + 1 rebuild step (Ogun). Start with the ending, then name the tool for the rebuild.",
    footer: "You are here in the cycle.",
  },

  7: {
    id: 7,
    season: "WNTR",
    orisha: "Olokun",
    header: "WNTR · Phase 7 — Dissolution (Olokun)",
    oneLine: "Return to scale. Ego softens; context expands.",
    description:
      "270°–315°. Winter threshold: energy turns inward and external validation loses power. This is not decline—it’s conservation and widening of context. Let what can’t be carried dissolve. Reconnect to the larger system you’re part of and return to essentials.",
    actionHint: "Widen the frame: one act that reconnects you to scale.",
    journalPrompt: "What am I holding onto that is already over?",
    journalHelper:
      "Write plainly: what it is, why you’re holding it, and what release would look like this week.",
    footer: "You are here in the cycle.",
  },

  8: {
    id: 8,
    season: "WNTR",
    orisha: "Orunmila",
    header: "WNTR · Phase 8 — Witnessing (Orunmila)",
    oneLine: "Meaning and integration. Convert experience into guidance.",
    description:
      "315°–360°. The clearing space before renewal. Review the pattern and extract the lesson. This phase turns what happened into orientation for the next turn. Wisdom is the output: a practical rule you can carry forward so the next spring starts clean.",
    actionHint: "Write the lesson as a rule you’ll carry into the next cycle.",
    journalPrompt: "What did this cycle teach me that I can carry forward?",
    journalHelper:
      "Pattern → lesson → one practical rule. Keep it short enough to remember and real enough to use.",
    footer: "You are here in the cycle.",
  },
};

// Optional: aspect microcopy for Phase 6 (non-breaking; only used if UI asks for it)
const PHASE_6_ASPECTS: Record<Phase6Aspect, PhaseMicrocopy> = {
  oya: {
    id: 6,
    season: "FALL",
    orisha: "Oya",
    header: "FALL · Phase 6 — Transformation (Oya)",
    oneLine: "Clear what’s complete. Make endings clean.",
    description:
      "Oya clears stagnation. This is severance, honesty, and release—ending what is already over so the system can breathe again. Don’t negotiate with completion. Make the cut, clear the debris, and protect the space you just opened.",
    actionHint: "Name the ending. Make one clean cut today.",
    journalPrompt: "What is over—even if I’m still holding it?",
    journalHelper:
      "Write the truth in one sentence. Then write the boundary that proves it’s done.",
    footer: "You are here in the cycle.",
  },
  ogun: {
    id: 6,
    season: "FALL",
    orisha: "Ogun",
    header: "FALL · Phase 6 — Transformation (Ogun)",
    oneLine: "Forge rebuild. Tools, discipline, and new form.",
    description:
      "Ogun rebuilds. Transformation becomes real when the new system is constructed: tools, craft, reps, and structure. Start with the cut, then build what can hold. Don’t wait for mood—use tools and time.",
    actionHint: "Do the hardest 30 minutes first. Use tools, not mood.",
    journalPrompt: "What must be rebuilt now that the old version can’t hold?",
    journalHelper:
      "List one cut (remove) and one forge step (build). Name the tool you’ll use and do the cut first.",
    footer: "You are here in the cycle.",
  },
};

export function microcopyForPhase(
  id: PhaseId,
  opts?: { phase6Aspect?: Phase6Aspect }
): PhaseMicrocopy {
  if (id === 6 && opts?.phase6Aspect) {
    return PHASE_6_ASPECTS[opts.phase6Aspect] ?? PHASES[6];
  }
  return PHASES[id] ?? PHASES[1];
}
