// src/lib/phaseTheme.ts
import type { PhaseId } from "@/lib/phaseMicrocopy";

/**
 * Calendar-style palette base.
 * Goal: all phase colors feel like they belong on /calendar:
 * wheat → linen → olive, with brown for grounded depth, and ink for text.
 */
export const BASE = {
  wheat: "#B9B07B",
  olive: "#71744F",
  linen: "#D5C0A5",
  brown: "#6B4F3A",

  ink: "#1F241A",
  inkMuted: "rgba(31,36,26,0.72)",
  inkSoft: "rgba(31,36,26,0.55)",

  surface: "rgba(244,235,221,0.88)",
  surface2: "rgba(213,192,165,0.78)",
  border: "rgba(31,36,26,0.16)",
  divider: "rgba(31,36,26,0.14)",
} as const;

export type PhaseTheme = {
  phase: PhaseId;

  // Accent set (calendar-safe)
  accent: string;      // used for highlights, markers, “phase chip”
  accentSoft: string;  // used for subtle fills / glows
  accentDeep: string;  // used for borders / emphasis (still calm)

  // Background wash for the page / hero
  pageWash: string;    // radial gradient
  heroGradient: string;// linear gradient for the main card
};

const THEMES: Record<PhaseId, PhaseTheme> = {
  1: {
    phase: 1,
    // SPRG 1: clarity / orientation — lean linen + soft olive ink
    accent: "#9FA57A",
    accentSoft: "rgba(159,165,122,0.22)",
    accentDeep: "#6E744B",
    pageWash:
      "radial-gradient(1200px 700px at 50% -10%, rgba(213,192,165,0.95) 0%, rgba(244,235,221,0.78) 45%, rgba(113,116,79,0.36) 120%)",
    heroGradient:
      "linear-gradient(180deg, rgba(244,235,221,0.94) 0%, rgba(213,192,165,0.84) 58%, rgba(185,176,123,0.52) 120%)",
  },

  2: {
    phase: 2,
    // SPRG 2: emergence / fluid — keep linen, add “cooler” olive softness
    accent: "#8FA08A",
    accentSoft: "rgba(143,160,138,0.20)",
    accentDeep: "#6A7A63",
    pageWash:
      "radial-gradient(1200px 700px at 50% -10%, rgba(244,235,221,0.92) 0%, rgba(213,192,165,0.72) 55%, rgba(113,116,79,0.42) 120%)",
    heroGradient:
      "linear-gradient(180deg, rgba(244,235,221,0.93) 0%, rgba(213,192,165,0.82) 55%, rgba(185,176,123,0.48) 120%)",
  },

  3: {
    phase: 3,
    // SUMR 3: attraction / value — wheat-forward
    accent: "#C4B06B",
    accentSoft: "rgba(196,176,107,0.22)",
    accentDeep: "#8D7B3A",
    pageWash:
      "radial-gradient(1200px 700px at 50% -10%, rgba(185,176,123,0.92) 0%, rgba(213,192,165,0.68) 55%, rgba(113,116,79,0.40) 120%)",
    heroGradient:
      "linear-gradient(180deg, rgba(244,235,221,0.90) 0%, rgba(213,192,165,0.78) 55%, rgba(185,176,123,0.60) 120%)",
  },

  4: {
    phase: 4,
    // SUMR 4: expression / presence — deepen into brown, but keep it calm + earthy
    accent: "#8B6A4E",
    accentSoft: "rgba(107,79,58,0.16)",
    accentDeep: "#6B4F3A",
    pageWash:
      "radial-gradient(1200px 700px at 50% -10%, rgba(213,192,165,0.92) 0%, rgba(185,176,123,0.62) 60%, rgba(107,79,58,0.26) 125%)",
    heroGradient:
      "linear-gradient(180deg, rgba(244,235,221,0.90) 0%, rgba(213,192,165,0.78) 55%, rgba(107,79,58,0.18) 120%)",
  },

  5: {
    phase: 5,
    // FALL 5: labor / build — brown + olive grounded
    accent: "#7A6A54",
    accentSoft: "rgba(107,79,58,0.14)",
    accentDeep: "#5D4634",
    pageWash:
      "radial-gradient(1200px 700px at 50% -10%, rgba(213,192,165,0.88) 0%, rgba(185,176,123,0.56) 60%, rgba(113,116,79,0.46) 130%)",
    heroGradient:
      "linear-gradient(180deg, rgba(244,235,221,0.88) 0%, rgba(213,192,165,0.76) 55%, rgba(113,116,79,0.38) 120%)",
  },

  6: {
    phase: 6,
    // FALL 6: correction / precision — olive sharpened
    accent: "#71744F",
    accentSoft: "rgba(113,116,79,0.20)",
    accentDeep: "#585B3E",
    pageWash:
      "radial-gradient(1200px 700px at 50% -10%, rgba(244,235,221,0.86) 0%, rgba(185,176,123,0.56) 55%, rgba(113,116,79,0.56) 125%)",
    heroGradient:
      "linear-gradient(180deg, rgba(244,235,221,0.88) 0%, rgba(213,192,165,0.74) 55%, rgba(113,116,79,0.44) 120%)",
  },

  7: {
    phase: 7,
    // WNTR 7: release — lower light, keep olive/brown dusk
    accent: "#6A6A58",
    accentSoft: "rgba(31,36,26,0.14)",
    accentDeep: "#3A3E2F",
    pageWash:
      "radial-gradient(1200px 700px at 50% -10%, rgba(244,235,221,0.78) 0%, rgba(213,192,165,0.58) 55%, rgba(31,36,26,0.32) 125%)",
    heroGradient:
      "linear-gradient(180deg, rgba(244,235,221,0.86) 0%, rgba(213,192,165,0.72) 55%, rgba(31,36,26,0.18) 120%)",
  },

  8: {
    phase: 8,
    // WNTR 8: integration — deepest, ink-forward but still linen-based
    accent: "#3A3E2F",
    accentSoft: "rgba(31,36,26,0.16)",
    accentDeep: "#1F241A",
    pageWash:
      "radial-gradient(1200px 700px at 50% -10%, rgba(213,192,165,0.80) 0%, rgba(185,176,123,0.48) 58%, rgba(31,36,26,0.44) 130%)",
    heroGradient:
      "linear-gradient(180deg, rgba(244,235,221,0.86) 0%, rgba(213,192,165,0.70) 55%, rgba(31,36,26,0.22) 120%)",
  },
};

export function themeForPhase(phase: PhaseId): PhaseTheme {
  return THEMES[phase] ?? THEMES[1];
}
