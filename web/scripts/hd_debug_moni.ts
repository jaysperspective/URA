#!/usr/bin/env tsx
// scripts/hd_debug_moni.ts
// Debug / reproduction script for Moni's Human Design profile.
// Usage: npm run hd:debug:moni
// Requires the astro service at ASTRO_SERVICE_URL (default http://127.0.0.1:3002)

import {
  normalizeDeg,
  getGateAndLine,
  gateForDeg,
  MANDALA_OFFSET,
  LINE_SPAN,
  LINE_EPS,
} from "../src/lib/humandesign/gatesByDegree";
import {
  birthToUtcDate,
  extractLongitudes,
  longitudesToActivations,
  findDesignTime,
  getDefinedGates,
  getDefinedChannels,
  getDefinedCenters,
  getDefinitionType,
  determineType,
  determineStrategy,
  determineAuthority,
  determineProfile,
  HD_VERSION,
} from "../src/lib/humandesign/compute";
import type { BirthData } from "../src/lib/humandesign/types";
import { fetchChart } from "../src/lib/astro/client";

// ── Moni test profile ──────────────────────────────────────────────
const MONI_BIRTH: BirthData = {
  year: 1995,
  month: 5,
  day: 15,
  hour: 11,
  minute: 9,
  lat: 35.7796,
  lon: -78.6382,
  timezone: "America/New_York",
};

// Expected values from trusted external calculator
const EXPECTED = {
  type: "Generator", // external says "Alchemist (Generator)"
  strategy: "Wait to respond",
  authority: "Emotional",
  definition: "split",
  profile: "6/2",
  personalitySunLine: 6,
  designSunLine: 2,
};

function mappingDebug(label: string, rawLon: number) {
  const norm = normalizeDeg(rawLon);
  const shifted = normalizeDeg(rawLon + MANDALA_OFFSET);
  const range = gateForDeg(rawLon);
  const result = getGateAndLine(rawLon);
  const degIntoGate = range ? shifted - range.startDeg : null;
  const lineFloat = degIntoGate !== null ? degIntoGate / LINE_SPAN : null;

  return {
    label,
    rawLon: Math.round(rawLon * 1e6) / 1e6,
    normalizedLon: Math.round(norm * 1e6) / 1e6,
    shiftedLon: Math.round(shifted * 1e6) / 1e6,
    gate: result?.gate,
    line: result?.line,
    gateRange: range ? `${range.startDeg}–${range.endDeg}` : "?",
    degIntoGate: degIntoGate !== null ? Math.round(degIntoGate * 1e6) / 1e6 : null,
    lineFloat: lineFloat !== null ? Math.round(lineFloat * 1e6) / 1e6 : null,
    lineEps: LINE_EPS,
  };
}

async function main() {
  console.log("=".repeat(70));
  console.log("Human Design Debug — Moni Test Profile");
  console.log(`HD_VERSION: ${HD_VERSION}  |  MANDALA_OFFSET: ${MANDALA_OFFSET}°  |  LINE_EPS: ${LINE_EPS}`);
  console.log("=".repeat(70));

  // 1. UTC conversion
  const birthUtc = birthToUtcDate(MONI_BIRTH);
  console.log(`\nBirth local: ${MONI_BIRTH.year}-${String(MONI_BIRTH.month).padStart(2, "0")}-${String(MONI_BIRTH.day).padStart(2, "0")} ${String(MONI_BIRTH.hour).padStart(2, "0")}:${String(MONI_BIRTH.minute).padStart(2, "0")} ${MONI_BIRTH.timezone}`);
  console.log(`Birth UTC:   ${birthUtc.toISOString()}`);

  // 2. Personality chart
  const pChart = await fetchChart({
    year: birthUtc.getUTCFullYear(),
    month: birthUtc.getUTCMonth() + 1,
    day: birthUtc.getUTCDate(),
    hour: birthUtc.getUTCHours(),
    minute: birthUtc.getUTCMinutes(),
    latitude: MONI_BIRTH.lat,
    longitude: MONI_BIRTH.lon,
  });

  if (!pChart.ok || !pChart.data) {
    console.error("FAILED to fetch personality chart:", pChart.error);
    console.log("(Is the astro service running? ASTRO_SERVICE_URL =", process.env.ASTRO_SERVICE_URL || "http://127.0.0.1:3002", ")");
    if (pChart.data?._mock) {
      console.log("NOTE: Using MOCK data — results are approximate, not authoritative.");
    }
    process.exit(1);
  }

  const isMock = !!pChart.data._mock;
  if (isMock) {
    console.log("\nWARNING: Using MOCK astro data (approximate). For authoritative results, run the astro service.");
  }

  const pLongs = extractLongitudes(pChart.data);
  const pActivations = longitudesToActivations(pLongs);
  const pEarthLon = normalizeDeg(pLongs.sun + 180);

  console.log("\n── Personality Chart ─────────────────────────────────────");
  console.log(`  Sun lon:   ${pLongs.sun.toFixed(6)}°`);
  console.log(`  Earth lon: ${pEarthLon.toFixed(6)}°`);

  // 3. Design time
  const natalSunNorm = normalizeDeg(pLongs.sun);
  const targetLon = normalizeDeg(natalSunNorm - 88);
  console.log(`\n── Design Solver Inputs ─────────────────────────────────`);
  console.log(`  Natal Sun (normalized): ${natalSunNorm.toFixed(6)}°`);
  console.log(`  Target (natal - 88°):   ${targetLon.toFixed(6)}°`);

  const designResult = await findDesignTime(birthUtc, pLongs.sun, MONI_BIRTH.lat, MONI_BIRTH.lon);
  if (!designResult) {
    console.error("FAILED to find design time");
    process.exit(1);
  }

  const designUtc = new Date(designResult.iso);
  const daysBack = (birthUtc.getTime() - designUtc.getTime()) / (1000 * 60 * 60 * 24);
  console.log(`\n── Design Time ──────────────────────────────────────────`);
  console.log(`  Design UTC:     ${designResult.iso}`);
  console.log(`  Days before:    ${daysBack.toFixed(4)}`);
  console.log(`  Target Sun lon: ${designResult.sunTargetDeg.toFixed(6)}°`);

  // 4. Design chart — use fractional minutes for precision
  const designMinuteFrac =
    designUtc.getUTCMinutes() +
    designUtc.getUTCSeconds() / 60 +
    designUtc.getUTCMilliseconds() / 60000;

  const dChart = await fetchChart({
    year: designUtc.getUTCFullYear(),
    month: designUtc.getUTCMonth() + 1,
    day: designUtc.getUTCDate(),
    hour: designUtc.getUTCHours(),
    minute: designMinuteFrac,
    latitude: MONI_BIRTH.lat,
    longitude: MONI_BIRTH.lon,
  });

  if (!dChart.ok || !dChart.data) {
    console.error("FAILED to fetch design chart");
    process.exit(1);
  }

  const dLongs = extractLongitudes(dChart.data);
  const dActivations = longitudesToActivations(dLongs);
  const dEarthLon = normalizeDeg(dLongs.sun + 180);

  const designSunNorm = normalizeDeg(dLongs.sun);
  const angDiff = normalizeDeg(natalSunNorm - designSunNorm);

  console.log(`  Design Sun lon: ${dLongs.sun.toFixed(6)}° (normalized: ${designSunNorm.toFixed(6)}°)`);
  console.log(`  Angular diff:   ${angDiff.toFixed(6)}° (target 88°)`);

  // 5. Mapping debug for anchors
  console.log("\n── Anchor Mapping Debug ─────────────────────────────────");
  const anchors = [
    mappingDebug("P.Sun", pLongs.sun),
    mappingDebug("P.Earth", pEarthLon),
    mappingDebug("D.Sun", dLongs.sun),
    mappingDebug("D.Earth", dEarthLon),
  ];
  console.table(anchors);

  // 6. All activations
  console.log("\n── Personality Activations ──────────────────────────────");
  for (const [planet, act] of Object.entries(pActivations)) {
    console.log(`  ${planet.padEnd(12)} ${act.gate}.${act.line}  (${act.deg.toFixed(4)}°)`);
  }
  console.log("\n── Design Activations ──────────────────────────────────");
  for (const [planet, act] of Object.entries(dActivations)) {
    console.log(`  ${planet.padEnd(12)} ${act.gate}.${act.line}  (${act.deg.toFixed(4)}°)`);
  }

  // 7. Defined structures
  const definedGates = getDefinedGates(pActivations, dActivations);
  const activeGatesSet = new Set(definedGates);
  const definedChannels = getDefinedChannels(activeGatesSet);
  const definedCenters = getDefinedCenters(definedChannels);
  const definitionType = getDefinitionType(definedChannels, definedCenters);
  const hdType = determineType(definedChannels, definedCenters);
  const strategy = determineStrategy(hdType);
  const authority = determineAuthority(definedCenters);

  const personalitySunLine = pActivations.Sun.line;
  const designSunLine = dActivations.Sun.line;
  const profileString = determineProfile(personalitySunLine, designSunLine);

  console.log("\n── Profile Derivation ──────────────────────────────────");
  console.log(`  personalitySunLine: ${personalitySunLine}`);
  console.log(`  designSunLine:      ${designSunLine}`);
  console.log(`  profileString:      "${profileString}"`);

  console.log("\n── Computed Results ─────────────────────────────────────");
  console.log(`  Type:       ${hdType}`);
  console.log(`  Authority:  ${authority}`);
  console.log(`  Strategy:   ${strategy}`);
  console.log(`  Profile:    ${profileString}`);
  console.log(`  Definition: ${definitionType}`);
  console.log(`  Gates:      [${definedGates.join(", ")}]`);
  console.log(`  Channels:   ${definedChannels.map((c) => `${c.name} (${c.displayName})`).join(", ")}`);
  console.log(`  Centers:    ${definedCenters.filter((c) => c.defined).map((c) => c.name).join(", ")}`);

  // 8. Validation against expected
  console.log("\n── Validation ──────────────────────────────────────────");
  let pass = true;
  const check = (label: string, actual: unknown, expected: unknown) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    console.log(`  ${ok ? "PASS" : "FAIL"} ${label}: ${JSON.stringify(actual)}${ok ? "" : ` (expected ${JSON.stringify(expected)})`}`);
    if (!ok) pass = false;
  };

  check("Profile", profileString, EXPECTED.profile);
  check("personalitySunLine", personalitySunLine, EXPECTED.personalitySunLine);
  check("designSunLine", designSunLine, EXPECTED.designSunLine);

  if (!isMock) {
    // Only validate these against external calculator when using real astro data
    check("Type", hdType, EXPECTED.type);
    check("Authority", authority, EXPECTED.authority);
    check("Strategy", strategy, EXPECTED.strategy);
    check("Definition", definitionType, EXPECTED.definition);
  } else {
    console.log("  SKIP Type/Authority/Strategy/Definition checks (mock data)");
  }

  // Debug JSON dump
  console.log("\n── Debug JSON ──────────────────────────────────────────");
  console.log(JSON.stringify({
    inputs: {
      birthLocal: `${MONI_BIRTH.year}-${String(MONI_BIRTH.month).padStart(2, "0")}-${String(MONI_BIRTH.day).padStart(2, "0")} ${String(MONI_BIRTH.hour).padStart(2, "0")}:${String(MONI_BIRTH.minute).padStart(2, "0")}`,
      timezone: MONI_BIRTH.timezone,
      lat: MONI_BIRTH.lat,
      lon: MONI_BIRTH.lon,
      birthUTC: birthUtc.toISOString(),
    },
    personalitySun: mappingDebug("P.Sun", pLongs.sun),
    designSolver: {
      natalSunLongitude: natalSunNorm,
      targetLongitude: targetLon,
      designTimeUTC: designResult.iso,
      daysBeforeBirth: daysBack,
      designSunLongitude: { raw: dLongs.sun, normalized: designSunNorm },
      angularDiff: angDiff,
    },
    designSun: mappingDebug("D.Sun", dLongs.sun),
    profileDerivation: {
      personalitySunLine,
      designSunLine,
      profileString,
    },
    isMock,
  }, null, 2));

  console.log(`\n${"=".repeat(70)}`);
  console.log(pass ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED");
  console.log("=".repeat(70));

  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
