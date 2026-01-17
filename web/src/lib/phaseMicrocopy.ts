// src/lib/phaseMicrocopy.ts

export type PhaseId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Optional selector for Phase 6 (non-breaking)
export type Phase6Aspect = "oya" | "ogun";

export type PhaseMicrocopy = {
  id: PhaseId;
  season: "Spring" | "Summer" | "Fall" | "Winter";
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
    season: "Spring",
    orisha: "Eshu",
    header: "Spring · Phase 1 — Emergence (Eshu)",
    oneLine: "Energy rises from dormancy. Motion returns before clarity.",
    description:
      "0°–45°. This is personal spring. Something starts moving again, even if nothing outside has changed yet. Don’t wait for certainty—begin the smallest true action and let direction sharpen through movement.",
    actionHint: "Start the smallest true action that proves you’ve begun.",
    journalPrompt: "What is trying to begin through me today?",
    journalHelper: "One sentence: what is starting. One sentence: the next step.",
    footer: "You are here in the cycle.",
  },

  2: {
    id: 2,
    season: "Spring",
    orisha: "Obatala",
    header: "Spring · Phase 2 — Establishment (Obatala)",
    oneLine: "Structure forms so the beginning can hold.",
    description:
      "45°–90°. Energy strengthens and structure forms. This is the season of establishment: commitment, orientation, and testing your direction against reality. Posture, habits, boundaries, and pace take shape so what has begun can actually last.",
    actionHint: "Strengthen one core structure. Remove one unstable element.",
    journalPrompt: "What structure would protect the truth of this beginning?",
    journalHelper: "Name one boundary, rule, or rhythm you will keep for the next 45°.",
    footer: "You are here in the cycle.",
  },

  3: {
    id: 3,
    season: "Summer",
    orisha: "Oshun",
    header: "Summer · Phase 3 — Assertion (Oshun)",
    oneLine: "Momentum becomes visible. Participation replaces hesitation.",
    description:
      "90°–135°. Early summer heat. You’re actively engaging the world and meeting resistance. Decisions carry weight. This phase is not about perfect timing—it’s about showing up, making moves, and letting the work take up space.",
    actionHint: "Choose one move and execute it today. No extra debate.",
    journalPrompt: "Where am I being asked to participate instead of preparing?",
    journalHelper: "Name the action, the resistance, and the next push through it.",
    footer: "You are here in the cycle.",
  },

  4: {
    id: 4,
    season: "Summer",
    orisha: "Yemoja",
    header: "Summer · Phase 4 — Illumination (Yemoja)",
    oneLine: "Peak visibility. Results surface and truth becomes obvious.",
    description:
      "135°–180°. The cycle reaches maximum visibility. You can see what your movement has produced—clearly. This phase brings recognition and confrontation: what’s working, what isn’t, and what needs to be faced without denial.",
    actionHint: "Name the truth. Adjust based on what is real, not what was hoped.",
    journalPrompt: "What is becoming undeniable in the results I’m seeing?",
    journalHelper: "Write the result. Then write the truth it reveals.",
    footer: "You are here in the cycle.",
  },

  5: {
    id: 5,
    season: "Fall",
    orisha: "Shango",
    header: "Fall · Phase 5 — Integration (Shango)",
    oneLine: "Meaning becomes more important than momentum.",
    description:
      "180°–225°. Autumn begins. Energy redistributes after the peak. You integrate experience, reassess direction, and release what no longer fits. This is a phase of synthesis: turn what happened into usable understanding.",
    actionHint: "Capture the lesson and reduce the plan to what still matters.",
    journalPrompt: "What needs to be integrated — and what needs to be released?",
    journalHelper: "List: keep / change / let go. Choose one to act on today.",
    footer: "You are here in the cycle.",
  },

  6: {
    id: 6,
    season: "Fall",
    orisha: "Oya ⇄ Ogun",
    header: "Fall · Phase 6 — Reorientation (Oya ⇄ Ogun)",
    oneLine: "Refine. Correct. Rebuild what must change.",
    description:
      "225°–270°. Patterns that once worked get questioned. Roles, relationships, and responsibilities are evaluated. Oya clears what’s dead weight; Ogun rebuilds the next structure. The aim is coherence: fewer leaks, stronger form.",
    actionHint: "Cut one thing clean (Oya), then build one replacement step (Ogun).",
    journalPrompt: "What must be corrected so my life becomes coherent again?",
    journalHelper: "Name one cut and one rebuild. Start with the cut.",
    footer: "You are here in the cycle.",
  },

  7: {
    id: 7,
    season: "Winter",
    orisha: "Olokun",
    header: "Winter · Phase 7 — Withdrawal (Olokun)",
    oneLine: "Energy turns inward. Conservation replaces performance.",
    description:
      "270°–315°. Personal winter threshold. External validation loses gravity. You may feel quieter or less visible. This is not decline—it’s conservation. Attention returns to essentials, away from noise and unnecessary output.",
    actionHint: "Reduce inputs. Protect your attention. Choose essentials only.",
    journalPrompt: "What do I need to withdraw from to return to myself?",
    journalHelper: "Name one thing to step back from and one essential to protect.",
    footer: "You are here in the cycle.",
  },

  8: {
    id: 8,
    season: "Winter",
    orisha: "Orunmila",
    header: "Winter · Phase 8 — Dissolution (Orunmila)",
    oneLine: "Old identities soften. Rest clears the ground for renewal.",
    description:
      "315°–360°. Clearing space. Certainties dissolve and the system prepares to reset. Rest is not optional here; it prevents burnout and fragmentation. Let endings complete so the next emergence is clean.",
    actionHint: "Stop forcing output. Clear one unfinished thread to completion.",
    journalPrompt: "What must dissolve so the next cycle can begin clean?",
    journalHelper: "Write what is ending, then write what you will stop carrying forward.",
    footer: "You are here in the cycle.",
  },
};

// Optional: aspect microcopy for Phase 6 (non-breaking; only used if UI asks for it)
const PHASE_6_ASPECTS: Record<Phase6Aspect, PhaseMicrocopy> = {
  oya: {
    id: 6,
    season: "Fall",
    orisha: "Oya",
    header: "Fall · Phase 6 — Reorientation (Oya)",
    oneLine: "Clean endings. Remove what cannot continue.",
    description:
      "Oya clears stagnation: severance, honesty, completion. The point is not drama—it’s cleanup. End what is over so the system can move without drag.",
    actionHint: "Name the ending. Make the cut. Remove the drag.",
    journalPrompt: "What is over — even if I’m still holding it?",
    journalHelper: "Write the truth. Then write the boundary that proves it’s done.",
    footer: "You are here in the cycle.",
  },
  ogun: {
    id: 6,
    season: "Fall",
    orisha: "Ogun",
    header: "Fall · Phase 6 — Reorientation (Ogun)",
    oneLine: "Rebuild with tools. New form, real structure.",
    description:
      "Ogun rebuilds through craft: tools, discipline, reps, structure. Don’t wait for mood—construct the next system so it can hold the next season.",
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
