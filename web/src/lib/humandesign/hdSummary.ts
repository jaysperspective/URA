// src/lib/humandesign/hdSummary.ts
// Build a canonical HD summary object and compute a stable chart hash.

import crypto from "crypto";
import type { HumanDesignProfile } from "./types";

export type HdSummary = {
  type: string;
  strategy: string;
  authority: string;
  profile: string;
  definitionType: string;
  channels: { name: string; displayName?: string }[];
  definedCenters: string[];
  undefinedCenters: string[];
  personalitySun: { gate: number; line: number };
  personalityEarth: { gate: number; line: number };
  designSun: { gate: number; line: number };
  designEarth: { gate: number; line: number };
  crossGates: [number, number, number, number]; // P Sun, P Earth, D Sun, D Earth
};

/**
 * Extract the fields the LLM needs from a full HumanDesignProfile.
 */
export function buildHdSummary(hd: HumanDesignProfile): HdSummary {
  const definedCenters = hd.defined.centers
    .filter((c) => c.defined)
    .map((c) => c.name);

  const undefinedCenters = hd.defined.centers
    .filter((c) => !c.defined)
    .map((c) => c.name);

  const channels = hd.defined.channels.map((ch) => ({
    name: ch.name,
    ...(ch.displayName ? { displayName: ch.displayName } : {}),
  }));

  const pSun = hd.personality.Sun;
  const pEarth = hd.personality.Earth;
  const dSun = hd.designActivations.Sun;
  const dEarth = hd.designActivations.Earth;

  return {
    type: hd.type,
    strategy: hd.strategy,
    authority: hd.authority,
    profile: hd.profile,
    definitionType: hd.defined.definitionType,
    channels,
    definedCenters,
    undefinedCenters,
    personalitySun: { gate: pSun.gate, line: pSun.line },
    personalityEarth: { gate: pEarth.gate, line: pEarth.line },
    designSun: { gate: dSun.gate, line: dSun.line },
    designEarth: { gate: dEarth.gate, line: dEarth.line },
    crossGates: [pSun.gate, pEarth.gate, dSun.gate, dEarth.gate],
  };
}

/**
 * Compute a stable SHA-256 hash of the summary using sorted-key JSON.
 * Any change to the HD chart produces a different hash → cache invalidation.
 */
export function computeChartHash(summary: HdSummary): string {
  const canonical = JSON.stringify(summary, Object.keys(summary).sort());
  return crypto.createHash("sha256").update(canonical).digest("hex");
}
