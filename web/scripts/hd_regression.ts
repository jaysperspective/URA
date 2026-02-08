#!/usr/bin/env tsx
// scripts/hd_regression.ts
// Deterministic regression tests for Human Design mapping (no API calls).
// Usage: npm run hd:regression
// Exits non-zero on failure.

import {
  normalizeDeg,
  getGateAndLine,
  MANDALA_OFFSET,
  LINE_SPAN,
  LINE_EPS,
} from "../src/lib/humandesign/gatesByDegree";
import {
  longitudesToActivations,
  determineProfile,
} from "../src/lib/humandesign/compute";
import type { PlanetaryLongitudes } from "../src/lib/humandesign/types";

let passed = 0;
let failed = 0;

function assert(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
    failed++;
  }
}

// ── Helper: build simple PlanetaryLongitudes with just Sun set ────
function makeLongs(sunLon: number): PlanetaryLongitudes {
  return {
    sun: sunLon,
    moon: 100, mercury: 100, venus: 100, mars: 100,
    jupiter: 100, saturn: 100, uranus: 100, neptune: 100,
    pluto: 100, northNode: 100, southNode: 280,
  };
}

// ═══════════════════════════════════════════════════════════════════
console.log("Human Design Regression Tests");
console.log(`MANDALA_OFFSET=${MANDALA_OFFSET}  LINE_SPAN=${LINE_SPAN}  LINE_EPS=${LINE_EPS}`);
console.log("=".repeat(60));

// ── Test 1: Moni profile 6/2 ────────────────────────────────────
console.log("\n[Test 1] Moni profile fixture (Profile 6/2)");

// Personality Sun → Gate 23, Line 6
// raw=53.9 → shifted=55.775 → gate 23 (50.625–56.25) → degInto=5.15 → line 6
const moniPAct = longitudesToActivations(makeLongs(53.9));
assert("P.Sun gate", moniPAct.Sun.gate, 23);
assert("P.Sun line (personalitySunLine)", moniPAct.Sun.line, 6);

// Design Sun → Gate 30, Line 2
// raw=325.9 → shifted=327.775 → gate 30 (326.25–331.875) → degInto=1.525 → line 2
const moniDAct = longitudesToActivations(makeLongs(325.9));
assert("D.Sun gate", moniDAct.Sun.gate, 30);
assert("D.Sun line (designSunLine)", moniDAct.Sun.line, 2);

const moniProfile = determineProfile(moniPAct.Sun.line, moniDAct.Sun.line);
assert("Profile string", moniProfile, "6/2");

// ── Test 2: Asun profile 3/5 ────────────────────────────────────
console.log("\n[Test 2] Asun profile fixture (Profile 3/5)");

const asunPAct = longitudesToActivations(makeLongs(303.875));
assert("P.Sun gate", asunPAct.Sun.gate, 41);
assert("P.Sun line", asunPAct.Sun.line, 3);

const asunDAct = longitudesToActivations(makeLongs(215.875));
assert("D.Sun gate", asunDAct.Sun.gate, 28);
assert("D.Sun line", asunDAct.Sun.line, 5);

const asunProfile = determineProfile(asunPAct.Sun.line, asunDAct.Sun.line);
assert("Profile string", asunProfile, "3/5");

// ── Test 3: Line boundary stability ─────────────────────────────
console.log("\n[Test 3] Line boundary stability");

// Exact boundary between line 2 and line 3 in Gate 25 (offset = 1.875)
// shifted=1.875 → raw=0.0
const boundaryResult = getGateAndLine(0.0);
assert("Exact boundary (offset=1.875) → gate 25", boundaryResult?.gate, 25);
assert("Exact boundary (offset=1.875) → line 3", boundaryResult?.line, 3);

// Value infinitesimally below boundary due to floating-point
const nearBoundary = getGateAndLine(-1e-14);
assert("Near-boundary (offset≈1.875-eps) → gate 25", nearBoundary?.gate, 25);
assert("Near-boundary with EPS → line 3 (stable)", nearBoundary?.line, 3);

// All 6 lines reachable in Gate 25
for (let line = 1; line <= 6; line++) {
  const midOffset = (line - 1) * LINE_SPAN + LINE_SPAN / 2;
  const raw = midOffset - MANDALA_OFFSET;
  const result = getGateAndLine(raw);
  assert(`Gate 25 line ${line} reachable`, result?.line, line);
}

// ── Test 4: Near-boundary design sun line (simulating solver drift) ─
console.log("\n[Test 4] Near-boundary design sun (simulating old solver drift)");

// Design Sun at offset 1.87 into Gate 30 (should be solidly line 2)
// Gate 30: 326.25–331.875. offset=1.87 → shifted=328.12 → raw=326.245
const solidLine2 = getGateAndLine(326.245);
assert("offset=1.87 → line 2", solidLine2?.line, 2);

// Design Sun at offset 1.88 into Gate 30 (past boundary, should be line 3)
// shifted=328.13 → raw=326.255
const pastBoundary = getGateAndLine(326.255);
assert("offset=1.88 → line 3", pastBoundary?.line, 3);

// ═══════════════════════════════════════════════════════════════════
console.log("\n" + "=".repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error("\nREGRESSION DETECTED — some tests failed!");
  process.exit(1);
} else {
  console.log("\nAll regression tests passed.");
  process.exit(0);
}
