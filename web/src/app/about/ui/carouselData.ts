// ============================================
// PHASES DATA (LOCKED - DO NOT MODIFY)
// ============================================

export type Phase = {
  id: number;
  name: string;
  range: string;
  gist: string;
  functionLine: string;
  ecology: string;
  psyche: string;
  distortion: string;
  participation: string;
};

export const PHASES: Phase[] = [
  {
    id: 1,
    name: "Emergence",
    range: "0\u00B0\u201345\u00B0",
    gist: "Energy rises from dormancy. Direction returns before clarity. Movement precedes certainty.",
    functionLine: "Initiation",
    ecology: "Threshold crossing, first motion",
    psyche: "Curiosity, responsiveness",
    distortion: "Stagnation, anxiety",
    participation: "Begin lightly; let clarity follow action",
  },
  {
    id: 2,
    name: "Establishment",
    range: "45\u00B0\u201390\u00B0",
    gist: "Structure forms. Boundaries are set. Ethics emerge. This phase determines whether the cycle can endure.",
    functionLine: "Stabilization",
    ecology: "Grounding, skeletal order, soil formation",
    psyche: "Regulation, restraint",
    distortion: "Fragility, future collapse",
    participation: "Build simple, sustainable structure",
  },
  {
    id: 3,
    name: "Differentiation",
    range: "90\u00B0\u2013135\u00B0",
    gist: "Life is refined through subtle care. Attention matters. This phase sustains systems through invisible labor.",
    functionLine: "Tending",
    ecology: "Micro-life, medicinal systems",
    psyche: "Discernment, maintenance",
    distortion: "Burnout, neglect",
    participation: "Improve quality, not scale",
  },
  {
    id: 4,
    name: "Bonding",
    range: "135\u00B0\u2013180\u00B0",
    gist: "Containment precedes independence. Safety enables growth.",
    functionLine: "Belonging",
    ecology: "Nurseries, water systems",
    psyche: "Attachment, co-regulation",
    distortion: "Isolation, insecurity",
    participation: "Strengthen support systems",
  },
  {
    id: 5,
    name: "Assertion",
    range: "180\u00B0\u2013225\u00B0",
    gist: "Presence becomes visible. Authority carries consequence.",
    functionLine: "Execution",
    ecology: "Apex regulation",
    psyche: "Responsibility, leadership",
    distortion: "Collapse, indecision",
    participation: "Act decisively and accountably",
  },
  {
    id: 6,
    name: "Transformation",
    range: "225\u00B0\u2013270\u00B0",
    gist: "Decay renews systems. Endings are necessary.",
    functionLine: "Release",
    ecology: "Compost, storms, scavenging",
    psyche: "Grief, surrender",
    distortion: "Stagnation, decay without renewal",
    participation: "Let go cleanly",
  },
  {
    id: 7,
    name: "Dissolution",
    range: "270\u00B0\u2013315\u00B0",
    gist: "Individual edges soften. Context expands.",
    functionLine: "Return to scale",
    ecology: "Deep ocean cycles",
    psyche: "Ego softening",
    distortion: "Nihilism, escapism",
    participation: "Widen the frame",
  },
  {
    id: 8,
    name: "Witnessing",
    range: "315\u00B0\u2013360\u00B0",
    gist: "Experience converts into guidance. Wisdom emerges.",
    functionLine: "Integration",
    ecology: "Migration, pattern recognition",
    psyche: "Reflection",
    distortion: "Repetition without learning",
    participation: "Extract meaning",
  },
];

// ============================================
// SLIDE CONTENT (LOCKED - DO NOT MODIFY)
// ============================================

export type SlideContent = {
  id: number;
  title?: string;
  headline: string;
  body: string[];
};

export const SLIDES: SlideContent[] = [
  {
    id: 1,
    title: "URA",
    headline: "A Seasonal Orientation System",
    body: ["Knowing where you are changes how you move."],
  },
  {
    id: 2,
    headline: "The Problem of Modern Time",
    body: [
      "Modern life treats all moments the same.",
      "Living systems require different modes at different times.",
      "Constant effort produces incoherence.",
    ],
  },
  {
    id: 3,
    headline: "What URA Is",
    body: [
      "URA is a Seasonal Orientation System.",
      "It helps you recognize what phase you are moving through.",
      "Orientation precedes action.",
    ],
  },
  {
    id: 4,
    headline: "What Orientation Changes",
    body: [
      "Orientation changes how effort lands.",
      "The same action produces different results at different times.",
      "Timing determines coherence.",
    ],
  },
  {
    id: 5,
    headline: "Time as a Living Process",
    body: [
      "Time is not uniform.",
      "It moves through recurring phases of change.",
      "Living systems operate in cycles.",
    ],
  },
  {
    id: 6,
    headline: "The Ascendant Year",
    body: [
      "Your personal year begins at a precise moment.",
      "When the Sun returns to the degree rising on the eastern horizon at your birth.",
      "This is astronomical, not symbolic.",
    ],
  },
  {
    id: 7,
    headline: "Chart as Clock + Compass",
    body: [
      "The chart is a clock and a compass.",
      "It shows where you are in a cycle and how energy is oriented.",
      "It maps timing and psychological direction.",
    ],
  },
  {
    id: 8,
    headline: "The Eight Phases",
    body: [
      "The year unfolds through eight distinct phases.",
      "Each phase describes a different mode of participation.",
      "No phase is optional. Suppression creates distortion.",
    ],
  },
  {
    id: 9,
    headline: "Ecology & Psyche",
    body: [
      "Human psychology is ecological.",
      "Mental states evolved in relationship with natural cycles.",
      "Coherence depends on phase-appropriate behavior.",
    ],
  },
  {
    id: 10,
    headline: "Symbolic Interface",
    body: [
      "Symbols are tools for perception.",
      "They help the nervous system recognize patterns.",
      "Symbols are not beliefs. They are interfaces.",
    ],
  },
  {
    id: 11,
    headline: "Planetary Overlay",
    body: [
      "Planets introduce pressure.",
      "Phase context determines whether pressure builds, releases, or integrates.",
      "Pressure without context becomes distortion.",
    ],
  },
  {
    id: 12,
    headline: "Long-Form Development",
    body: [
      "Not all change happens quickly.",
      "Some inner shifts unfold across years, not days.",
      "URA tracks long-form developmental timing.",
    ],
  },
  {
    id: 13,
    headline: "Integration",
    body: [
      "Knowing what time it is changes how you move.",
      "Orientation reduces friction.",
      "Timing restores meaning.",
      "URA exists to restore temporal literacy.",
    ],
  },
];
