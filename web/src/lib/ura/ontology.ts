// src/lib/ura/ontology.ts

export type PhaseId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type OrishaKey =
  | "Eshu"
  | "Obatala"
  | "Oshun"
  | "Yemoja"
  | "Shango"
  | "Oya"
  | "Ogun"
  | "Olokun"
  | "Orunmila";

export type PlanetKey =
  | "Mercury"
  | "Saturn"
  | "Venus"
  | "Moon"
  | "Sun"
  | "Mars"
  | "Neptune"
  | "Jupiter";

export type URAPhaseMeta = {
  id: PhaseId;
  title: string; // internal (does not replace your labels)
  function: string;
  ecology: string;
  psyche: string;

  orisha: {
    // Primary key (for Phase 6, Oya is the "clear" lead)
    key: OrishaKey;

    // Optional secondary key (used only when a phase is canonically dual)
    secondaryKey?: OrishaKey;

    // Optional flag for clarity in UI/LLM
    dual?: boolean;

    modality: string;
    distortion: string;
    practice: string;
  };

  planet: {
    key: PlanetKey;
    force: string;
    distortion: string;
  };
};

export const URA_PHASES: Record<PhaseId, URAPhaseMeta> = {
  1: {
    id: 1,
    title: "Emergence",
    function: "Initiation / Entry",
    ecology: "Threshold crossing, first motion, openings in the system.",
    psyche: "Choice before certainty; curiosity and responsiveness.",
    orisha: {
      key: "Eshu",
      modality: "Opens pathways; governs beginnings, gates, and crossings.",
      distortion: "Anxious starting, scattered urgency, false alarms.",
      practice: "Name the doorway: one clear beginning, one clear next step.",
    },
    planet: {
      key: "Mercury",
      force: "Signal + selection: noticing, orienting, switching states.",
      distortion: "Overthinking the start; mental loops before movement.",
    },
  },

  2: {
    id: 2,
    title: "Stabilization",
    function: "Form / Structure",
    ecology: "Grounding, settling, integrity of containers and systems.",
    psyche: "Self-regulation; boundaries; ethics that hold.",
    orisha: {
      key: "Obatala",
      modality: "Shapes form; establishes constraint that protects life.",
      distortion: "Rigidity, moralizing, brittle control.",
      practice: "Reduce complexity: strengthen one core structure today.",
    },
    planet: {
      key: "Saturn",
      force: "Boundaries + time discipline: what lasts, what fails.",
      distortion: "Hardness without care; fear of change becomes law.",
    },
  },

  3: {
    id: 3,
    title: "Differentiation",
    function: "Tending / Refinement",
    ecology: "Micro-life maintenance: medicine, subtle repair, unseen labor.",
    psyche: "Discernment; care through accurate adjustment.",
    orisha: {
      key: "Oshun",
      modality: "Refines value through care; calibrates what is nourished and sustained.",
      distortion: "Over-attachment to aesthetics; pleasing over truth; perfectionism.",
      practice: "Make one small refinement that improves function—then stop.",
    },
    planet: {
      key: "Venus",
      force: "Valuation + refinement: what deserves care and continuity.",
      distortion: "Perfectionism; aesthetic control over living function.",
    },
  },

  4: {
    id: 4,
    title: "Bonding",
    function: "Containment / Belonging",
    ecology: "Nursery systems; emotional buffering; relational safety.",
    psyche: "Attachment, trust, co-regulation before autonomy.",
    orisha: {
      key: "Yemoja",
      modality: "Holds life; nurtures until stability is internalized.",
      distortion: "Dependency, rescue loops, fear of separation.",
      practice: "Ask: ‘What support is enough to build independence?’",
    },
    planet: {
      key: "Moon",
      force: "Rhythm + emotional memory: safety, bonding, regulation.",
      distortion: "Mood becomes authority; clinging replaces connection.",
    },
  },

  5: {
    id: 5,
    title: "Assertion",
    function: "Presence / Authority",
    ecology: "Visibility, apex regulation, decisive correction of imbalance.",
    psyche: "Confidence with accountability; coherent identity expression.",
    orisha: {
      key: "Shango",
      modality: "Commands presence; brings consequence and clarity.",
      distortion: "Performative dominance; force without responsibility.",
      practice: "Take one decisive action that reduces disorder.",
    },
    planet: {
      key: "Sun",
      force: "Vitality + coherence: rightful occupying of space.",
      distortion: "Identity inflation; spotlight addiction.",
    },
  },

  6: {
    id: 6,
    title: "Transformation",
    function: "Release / Death / Rebuild",
    ecology: "Compost, decay, storms, cutting and reforging; renewal through removal and reconstruction.",
    psyche: "Grief, surrender, identity shedding; endings done cleanly, then rebuilt with discipline.",
    orisha: {
      key: "Oya",
      secondaryKey: "Ogun",
      dual: true,
      modality:
        "Dual mechanism: Oya clears stagnation through endings and liberation; Ogun forges the next form through tools, craft, and disciplined rebuilding.",
      distortion:
        "Avoiding endings; chaos without purpose; cutting without rebuilding; rebuilding without releasing what’s over.",
      practice:
        "Do it in order: (1) end one thing cleanly (Oya), then (2) build one small replacement system (Ogun).",
    },
    planet: {
      key: "Mars",
      force: "Severance + action: cutting away what blocks the cycle; initiating necessary change.",
      distortion: "Conflict without aim; rage replacing direction; heat without repair.",
    },
  },

  7: {
    id: 7,
    title: "Dissolution",
    function: "Return / Scale",
    ecology: "Deep time; oceanic systems; scale beyond the personal.",
    psyche: "Ego softening; collective awareness; surrender to context.",
    orisha: {
      key: "Olokun",
      modality: "Governs depth and the unknowable; restores humility and scale.",
      distortion: "Escapism; synthetic unity; fear of depth.",
      practice: "Widen the frame: one act that reconnects you to scale.",
    },
    planet: {
      key: "Neptune",
      force: "Boundary dissolution: re-immersion into the whole.",
      distortion: "Fog; avoidance through fantasy; blurred responsibility.",
    },
  },

  8: {
    id: 8,
    title: "Witnessing",
    function: "Meaning / Integration",
    ecology: "Pattern recognition across cycles; migration; aerial perspective.",
    psyche: "Reflection; wisdom; converting experience into orientation.",
    orisha: {
      key: "Orunmila",
      modality: "Time-intelligence; reads cycles and extracts guidance.",
      distortion: "Dogma; repeating cycles blindly; data without wisdom.",
      practice: "Write the lesson: what did this phase teach you?",
    },
    planet: {
      key: "Jupiter",
      force: "Sense-making + perspective: integration into a larger story.",
      distortion: "Certainty addiction; belief without grounding.",
    },
  },
};

export function metaForPhase(id: number | null | undefined): URAPhaseMeta | null {
  if (typeof id !== "number") return null;
  if (id < 1 || id > 8) return null;
  return URA_PHASES[id as PhaseId];
}

