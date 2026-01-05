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
    oneLine: "Initiation and entry. The threshold opens through motion.",
    description:
      "Begin without demanding certainty. Name the doorway, take the first real step, and let clarity arrive after movement. This phase governs access.",
    actionHint: "Start the smallest true action that proves you’ve begun.",
    journalPrompt: "What is trying to begin through me today?",
    journalHelper: "One sentence: the start. One sentence: the next step.",
    footer: "You are here in the cycle.",
  },

  2: {
    id: 2,
    season: "SPRG",
    orisha: "Obatala",
    header: "SPRG · Phase 2 — Stabilization (Obatala)",
    oneLine: "Form and ethics. Structure that can actually last.",
    description:
      "Ground what started. Set the clean constraint: boundaries, rhythm, and a pace you can sustain. This phase determines whether the system can hold.",
    actionHint: "Strengthen one core structure. Remove one unstable element.",
    journalPrompt: "What structure would protect the truth of this beginning?",
    journalHelper: "Name one boundary or rule you’ll keep for the next 45°.",
    footer: "You are here in the cycle.",
  },

  3: {
    id: 3,
    season: "SUMR",
    orisha: "Oshun",
    header: "SUMR · Phase 3 — Differentiation (Oshun)",
    oneLine: "Tending and refinement. Care that makes the system bloom.",
    description:
      "This phase rewards attention. Refine what you’re building, calibrate value, and nurture what responds. Differentiation happens through quality, not force.",
    actionHint: "Improve one detail that increases clarity, beauty, or ease.",
    journalPrompt: "What deserves more care — and what deserves less?",
    journalHelper: "Name one thing to nurture and one thing to stop feeding.",
    footer: "You are here in the cycle.",
  },

  4: {
    id: 4,
    season: "SUMR",
    orisha: "Yemoja",
    header: "SUMR · Phase 4 — Bonding (Yemoja)",
    oneLine: "Containment and belonging. Safety before independence.",
    description:
      "Strengthen the nursery: support systems, emotional safety, and the container that holds growth. Bonding is co-regulation—life held gently until it’s ready.",
    actionHint: "Reinforce the one support that helps you stay steady.",
    journalPrompt: "Where do I need support, safety, or steadier belonging?",
    journalHelper: "Name the container (who/what), and what you need from it.",
    footer: "You are here in the cycle.",
  },

  5: {
    id: 5,
    season: "FALL",
    orisha: "Shango",
    header: "FALL · Phase 5 — Assertion (Shango)",
    oneLine: "Presence and authority. Lead with consequence and clarity.",
    description:
      "Execution has teeth here. Make the call, ship the thing, say the truth out loud. This phase prevents collapse through decisive, accountable action.",
    actionHint: "Pick the decision you’ve been avoiding and decide—cleanly.",
    journalPrompt: "Where am I being asked to lead instead of wait?",
    journalHelper: "State the decision in one sentence. No justification needed.",
    footer: "You are here in the cycle.",
  },

  6: {
    id: 6,
    season: "FALL",
    orisha: "Oya ⇄ Ogun",
    header: "FALL · Phase 6 — Transformation (Oya ⇄ Ogun)",
    oneLine: "Clear what’s done. Forge what’s next.",
    description:
      "Transformation has two necessary motions: Oya clears stagnation and ends what’s over; Ogun rebuilds through tools, discipline, and new form. Same phase, two mechanisms.",
    actionHint: "Choose your mode: clear (Oya) or forge (Ogun). Do the clear first.",
    journalPrompt: "What must end — and what must be rebuilt in its place?",
    journalHelper: "Write 1 ending (Oya) + 1 rebuild step (Ogun). Start with the ending.",
    footer: "You are here in the cycle.",
  },

  7: {
    id: 7,
    season: "WNTR",
    orisha: "Olokun",
    header: "WNTR · Phase 7 — Dissolution (Olokun)",
    oneLine: "Return to scale. Ego softens; context expands.",
    description:
      "Deep water. Widen the frame beyond the personal story. Let what can’t be carried dissolve. Reconnect to the larger system you’re part of.",
    actionHint: "Widen the frame: one act that reconnects you to scale.",
    journalPrompt: "What am I holding onto that is already over?",
    journalHelper: "Write plainly. No performance required. Let it loosen.",
    footer: "You are here in the cycle.",
  },

  8: {
    id: 8,
    season: "WNTR",
    orisha: "Orunmila",
    header: "WNTR · Phase 8 — Witnessing (Orunmila)",
    oneLine: "Meaning and integration. Convert experience into guidance.",
    description:
      "Review the pattern and extract the lesson. This phase converts what happened into orientation for the next turn. Wisdom is the output.",
    actionHint: "Write the lesson as a rule you’ll carry into the next cycle.",
    journalPrompt: "What did this cycle teach me that I can carry forward?",
    journalHelper: "Pattern → lesson → one practical rule for next cycle.",
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
    oneLine: "Storm-clearing. Release, sever, and let endings be clean.",
    description:
      "Oya ends what’s over. Grief, honesty, severance, liberation. Do not negotiate with completion—clear the space so the cycle can continue.",
    actionHint: "Name the ending. Make the clean cut.",
    journalPrompt: "What is over — even if I’m still holding it?",
    journalHelper: "Write the truth. Then write the boundary that proves it’s done.",
    footer: "You are here in the cycle.",
  },
  ogun: {
    id: 6,
    season: "FALL",
    orisha: "Ogun",
    header: "FALL · Phase 6 — Transformation (Ogun)",
    oneLine: "Forge-rebuild. Tools, discipline, and new form.",
    description:
      "Ogun rebuilds. Use tools, craft, reps, and structure to form the next version. Transformation becomes real when the new system is constructed.",
    actionHint: "Do the hardest 30 minutes first. Use tools, not mood.",
    journalPrompt: "What must be rebuilt now that the old version can’t hold?",
    journalHelper: "List one cut (remove) and one forge step (build). Start with the cut.",
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

