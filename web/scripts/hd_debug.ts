#!/usr/bin/env tsx
// scripts/hd_debug.ts
// Local reproduction script for Human Design computation debugging.
// Usage: npm run hd:debug
// Requires the astro service to be running at ASTRO_SERVICE_URL (default http://127.0.0.1:3002)

import {
  normalizeDeg,
  getGateAndLine,
  gateForDeg,
  MANDALA_OFFSET,
  LINE_SPAN,
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

// ── Asun test profile ──────────────────────────────────────────────
const ASUN_BIRTH: BirthData = {
  year: 1990,
  month: 1,
  day: 24,
  hour: 1,
  minute: 39,
  lat: 36.586,
  lon: -79.393,
  timezone: "America/New_York",
};

// Expected values from trusted external calculator
const EXPECTED = {
  type: "Generator",
  authority: "Sacral",
  definition: "split",
  profile: "3/5",
  anchors: {
    personalitySun: { gate: 41, line: 3 },
    personalityEarth: { gate: 31, line: 3 },
    designSun: { gate: 28, line: 5 },
    designEarth: { gate: 27, line: 5 },
  },
  channels: ["7-31", "27-50", "32-54", "28-38"],
  notChannels: ["26-44"],
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
    rawLon: Math.round(rawLon * 10000) / 10000,
    norm: Math.round(norm * 10000) / 10000,
    shifted: Math.round(shifted * 10000) / 10000,
    gate: result?.gate,
    line: result?.line,
    gateRange: range ? `${range.startDeg}-${range.endDeg}` : "?",
    degIntoGate: degIntoGate !== null ? Math.round(degIntoGate * 10000) / 10000 : null,
    lineFloat: lineFloat !== null ? Math.round(lineFloat * 10000) / 10000 : null,
  };
}

async function main() {
  console.log("=".repeat(70));
  console.log("Human Design Debug — Asun Test Profile");
  console.log(`HD_VERSION: ${HD_VERSION}  |  MANDALA_OFFSET: ${MANDALA_OFFSET}°`);
  console.log("=".repeat(70));

  // 1. UTC conversion
  const birthUtc = birthToUtcDate(ASUN_BIRTH);
  console.log(`\nBirth local: ${ASUN_BIRTH.year}-${ASUN_BIRTH.month}-${ASUN_BIRTH.day} ${ASUN_BIRTH.hour}:${String(ASUN_BIRTH.minute).padStart(2, "0")} ${ASUN_BIRTH.timezone}`);
  console.log(`Birth UTC:   ${birthUtc.toISOString()}`);

  // 2. Personality chart
  const pChart = await fetchChart({
    year: birthUtc.getUTCFullYear(),
    month: birthUtc.getUTCMonth() + 1,
    day: birthUtc.getUTCDate(),
    hour: birthUtc.getUTCHours(),
    minute: birthUtc.getUTCMinutes(),
    latitude: ASUN_BIRTH.lat,
    longitude: ASUN_BIRTH.lon,
  });

  if (!pChart.ok || !pChart.data) {
    console.error("FAILED to fetch personality chart:", pChart.error);
    console.log("(Is the astro service running? ASTRO_SERVICE_URL =", process.env.ASTRO_SERVICE_URL || "http://127.0.0.1:3002", ")");
    process.exit(1);
  }

  const pLongs = extractLongitudes(pChart.data);
  const pActivations = longitudesToActivations(pLongs);
  const pEarthLon = normalizeDeg(pLongs.sun + 180);

  console.log("\n── Personality Chart ─────────────────────────────────────");
  console.log(`  Sun lon:   ${pLongs.sun.toFixed(4)}°`);
  console.log(`  Earth lon: ${pEarthLon.toFixed(4)}°`);

  // 3. Design time
  const designResult = await findDesignTime(birthUtc, pLongs.sun, ASUN_BIRTH.lat, ASUN_BIRTH.lon);
  if (!designResult) {
    console.error("FAILED to find design time");
    process.exit(1);
  }

  const designUtc = new Date(designResult.iso);
  const daysBack = (birthUtc.getTime() - designUtc.getTime()) / (1000 * 60 * 60 * 24);
  console.log(`\n── Design Time ──────────────────────────────────────────`);
  console.log(`  Design UTC:     ${designResult.iso}`);
  console.log(`  Days before:    ${daysBack.toFixed(2)}`);
  console.log(`  Target Sun lon: ${designResult.sunTargetDeg.toFixed(4)}°`);

  // 4. Design chart
  const dChart = await fetchChart({
    year: designUtc.getUTCFullYear(),
    month: designUtc.getUTCMonth() + 1,
    day: designUtc.getUTCDate(),
    hour: designUtc.getUTCHours(),
    minute: designUtc.getUTCMinutes(),
    latitude: ASUN_BIRTH.lat,
    longitude: ASUN_BIRTH.lon,
  });

  if (!dChart.ok || !dChart.data) {
    console.error("FAILED to fetch design chart");
    process.exit(1);
  }

  const dLongs = extractLongitudes(dChart.data);
  const dActivations = longitudesToActivations(dLongs);
  const dEarthLon = normalizeDeg(dLongs.sun + 180);
  const angDiff = normalizeDeg(pLongs.sun - dLongs.sun);

  console.log(`  Design Sun lon: ${dLongs.sun.toFixed(4)}°`);
  console.log(`  Angular diff:   ${angDiff.toFixed(4)}° (target 88°)`);

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
  console.log("\n── All Personality Activations ──────────────────────────");
  for (const [planet, act] of Object.entries(pActivations)) {
    console.log(`  ${planet.padEnd(12)} ${act.gate}.${act.line}  (${act.deg.toFixed(2)}°)`);
  }
  console.log("\n── All Design Activations ──────────────────────────────");
  for (const [planet, act] of Object.entries(dActivations)) {
    console.log(`  ${planet.padEnd(12)} ${act.gate}.${act.line}  (${act.deg.toFixed(2)}°)`);
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
  const profile = determineProfile(pActivations.Sun.line, dActivations.Sun.line);

  console.log("\n── Computed Results ─────────────────────────────────────");
  console.log(`  Type:       ${hdType}`);
  console.log(`  Authority:  ${authority}`);
  console.log(`  Strategy:   ${strategy}`);
  console.log(`  Profile:    ${profile}`);
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

  check("Type", hdType, EXPECTED.type);
  check("Authority", authority, EXPECTED.authority);
  check("Definition", definitionType, EXPECTED.definition);
  check("Profile", profile, EXPECTED.profile);
  check("P.Sun", `${pActivations.Sun.gate}.${pActivations.Sun.line}`, `${EXPECTED.anchors.personalitySun.gate}.${EXPECTED.anchors.personalitySun.line}`);
  check("P.Earth", `${pActivations.Earth.gate}.${pActivations.Earth.line}`, `${EXPECTED.anchors.personalityEarth.gate}.${EXPECTED.anchors.personalityEarth.line}`);
  check("D.Sun", `${dActivations.Sun.gate}.${dActivations.Sun.line}`, `${EXPECTED.anchors.designSun.gate}.${EXPECTED.anchors.designSun.line}`);
  check("D.Earth", `${dActivations.Earth.gate}.${dActivations.Earth.line}`, `${EXPECTED.anchors.designEarth.gate}.${EXPECTED.anchors.designEarth.line}`);

  const channelNames = definedChannels.map((c) => c.name);
  for (const ch of EXPECTED.channels) {
    check(`Channel ${ch} present`, channelNames.includes(ch), true);
  }
  for (const ch of EXPECTED.notChannels) {
    check(`Channel ${ch} absent`, channelNames.includes(ch), false);
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(pass ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED");
  console.log("=".repeat(70));

  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
