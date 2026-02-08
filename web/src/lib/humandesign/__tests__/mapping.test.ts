import { describe, it, expect } from "vitest";
import {
  getGateAndLine,
  gateForDeg,
  normalizeDeg,
  GATE_RANGES,
  MANDALA_OFFSET,
  GATE_SPAN,
  LINE_SPAN,
  LINE_EPS,
  validateGateRanges,
} from "../gatesByDegree";
import {
  BODYGRAPH_CHANNELS,
  validateBodygraph,
} from "../bodygraph";
import {
  longitudesToActivations,
  getDefinedGates,
  getDefinedChannels,
  determineType,
  determineStrategy,
  determineAuthority,
  determineProfile,
  getDefinedCenters,
  getDefinitionType,
} from "../compute";
import type { PlanetaryLongitudes } from "../types";

// ═══════════════════════════════════════════════════════════════════
// Static data validation
// ═══════════════════════════════════════════════════════════════════

describe("gate range table", () => {
  it("has exactly 64 entries covering 360°", () => {
    const result = validateGateRanges();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("MANDALA_OFFSET is 1.75°", () => {
    expect(MANDALA_OFFSET).toBe(1.75);
  });
});

describe("bodygraph channels", () => {
  it("has exactly 36 unique channels", () => {
    expect(BODYGRAPH_CHANNELS.length).toBe(36);
  });

  it("passes structural validation", () => {
    const result = validateBodygraph();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("includes channel 10-34 (Exploration)", () => {
    const found = BODYGRAPH_CHANNELS.find((c) => c.name === "10-34");
    expect(found).toBeDefined();
    expect(found!.displayName).toBe("Exploration");
  });

  it("includes channel 20-57 (The Brain Wave)", () => {
    const found = BODYGRAPH_CHANNELS.find((c) => c.name === "20-57");
    expect(found).toBeDefined();
    expect(found!.displayName).toBe("The Brain Wave");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Degree → gate/line mapping with mandala offset
// ═══════════════════════════════════════════════════════════════════

describe("getGateAndLine", () => {
  it("maps 0° tropical to Gate 25 (mandala offset shifts into Gate 25)", () => {
    // 0° + 1.75° offset = 1.75°, which is inside Gate 25 (0-5.625)
    const result = getGateAndLine(0);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(25);
  });

  it("maps a degree just before offset boundary to correct gate", () => {
    // Gate 25 starts at mandala 0°. raw = 0 - 1.75 = -1.75 → 358.25° tropical
    // 358.25 + 1.75 = 360 → normalized to 0° → Gate 25 line 1
    const result = getGateAndLine(358.25);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(25);
    expect(result!.line).toBe(1);
  });

  it("correctly computes lines within a gate", () => {
    // Gate 25 spans 0-5.625 in the table.
    // raw = 0 → shifted = 1.75 → degIntoGate = 1.75 → lineFloat = 1.867 → line 2
    const result = getGateAndLine(0.0);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(25);
    expect(result!.line).toBe(2);
  });

  it("line 1 at the very start of a gate", () => {
    // Gate 25 starts at 0° in table. Need shifted deg right at 0°.
    // raw + 1.75 = 0 (mod 360) → raw = 358.25
    const result = getGateAndLine(358.25);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(25);
    expect(result!.line).toBe(1);
  });

  it("line 6 at the end of a gate", () => {
    // Gate 25 ends at 5.625° in table. Line 6 = degIntoGate in [4.6875, 5.625).
    // midpoint degIntoGate = 5.15625, shifted = 5.15625, raw = 5.15625 - 1.75 = 3.40625
    const result = getGateAndLine(3.40625);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(25);
    expect(result!.line).toBe(6);
  });

  it("handles wrap-around at 360°", () => {
    const result = getGateAndLine(359.999);
    expect(result).not.toBeNull();
    // 359.999 + 1.75 = 361.749 → normalized 1.749 → Gate 25
    // degIntoGate = 1.749, lineFloat = 1.866 → line 2
    expect(result!.gate).toBe(25);
    expect(result!.line).toBe(2);
  });

  it("handles negative degrees", () => {
    const result = getGateAndLine(-1);
    expect(result).not.toBeNull();
    // -1 + 1.75 = 0.75 → Gate 25, degIntoGate = 0.75 → line 1
    expect(result!.gate).toBe(25);
    expect(result!.line).toBe(1);
  });

  // Specific known gate boundaries
  it("maps early Aquarius degrees to Gate 41", () => {
    // Gate 41 in table: 303.75-309.375
    // Gate 41.1 starts at 2°00' Aquarius = 302° tropical
    // raw = 302 → shifted = 303.75 → at gate start → Gate 41 line 1
    const result = getGateAndLine(302);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(41);
    expect(result!.line).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Asun fixture test (deterministic — no API calls)
// Uses pre-determined longitudes that would produce the expected results.
// ═══════════════════════════════════════════════════════════════════

describe("Asun profile fixture", () => {
  // Anchor gate.line expectations (verified at MANDALA_OFFSET=1.75):
  //   P Sun:   Gate 41, Line 3
  //   P Earth: Gate 31, Line 3
  //   D Sun:   Gate 28, Line 5
  //   D Earth: Gate 27, Line 5

  const pSunLon = 303.875;
  const pEarthLon = normalizeDeg(pSunLon + 180); // 123.875

  const dSunLon = 215.875;
  const dEarthLon = normalizeDeg(dSunLon + 180); // 35.875

  const personalityLongs: PlanetaryLongitudes = {
    sun: pSunLon,
    moon: 135.625,     // → gate 7
    mercury: 209.0625, // → gate 50
    venus: 203.4375,   // → gate 32
    mars: 287.8125,    // → gate 54
    jupiter: 100.0,    // → some gate not 26/44
    saturn: 290.0,     // → gate 54 (dup, fine)
    uranus: 280.0,     // → gate 58
    neptune: 282.1875, // → gate 38
    pluto: 240.0,      // → gate 14 (at offset 1.75)
    northNode: 200.0,  // → gate 57
    southNode: 20.0,   // → gate 51
  };

  const designLongs: PlanetaryLongitudes = {
    sun: dSunLon,
    moon: 135.625,     // → gate 7
    mercury: 209.0625, // → gate 50
    venus: 203.4375,   // → gate 32
    mars: 287.8125,    // → gate 54
    jupiter: 100.0,
    saturn: 290.0,
    uranus: 280.0,
    neptune: 282.1875, // → gate 38
    pluto: 240.0,
    northNode: 200.0,
    southNode: 20.0,
  };

  const pAct = longitudesToActivations(personalityLongs);
  const dAct = longitudesToActivations(designLongs);

  it("computes profile as 3/5", () => {
    const profile = determineProfile(pAct.Sun.line, dAct.Sun.line);
    expect(profile).toBe("3/5");
  });

  it("computes correct anchor activations", () => {
    expect(pAct.Sun.gate).toBe(41);
    expect(pAct.Sun.line).toBe(3);
    expect(pAct.Earth.gate).toBe(31);
    expect(pAct.Earth.line).toBe(3);
    expect(dAct.Sun.gate).toBe(28);
    expect(dAct.Sun.line).toBe(5);
    expect(dAct.Earth.gate).toBe(27);
    expect(dAct.Earth.line).toBe(5);
  });

  it("defines expected channels (7-31, 27-50, 32-54, 28-38)", () => {
    const gates = getDefinedGates(pAct, dAct);
    const channels = getDefinedChannels(new Set(gates));
    const channelNames = channels.map((c) => c.name);
    expect(channelNames).toContain("7-31");
    expect(channelNames).toContain("27-50");
    expect(channelNames).toContain("32-54");
    expect(channelNames).toContain("28-38");
  });

  it("does NOT define channel 26-44", () => {
    const gates = getDefinedGates(pAct, dAct);
    const channels = getDefinedChannels(new Set(gates));
    const channelNames = channels.map((c) => c.name);
    expect(channelNames).not.toContain("26-44");
  });

  it("computes type as Generator", () => {
    const gates = getDefinedGates(pAct, dAct);
    const channels = getDefinedChannels(new Set(gates));
    const centers = getDefinedCenters(channels);
    const hdType = determineType(channels, centers);
    expect(hdType).toBe("Generator");
  });

  it("computes authority as Sacral", () => {
    const gates = getDefinedGates(pAct, dAct);
    const channels = getDefinedChannels(new Set(gates));
    const centers = getDefinedCenters(channels);
    const authority = determineAuthority(centers);
    expect(authority).toBe("Sacral");
  });

  it("computes split definition", () => {
    const gates = getDefinedGates(pAct, dAct);
    const channels = getDefinedChannels(new Set(gates));
    const centers = getDefinedCenters(channels);
    const defType = getDefinitionType(channels, centers);
    expect(defType).toBe("split");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Moni golden fixture (deterministic — no API calls)
// Uses the ACTUAL longitudes from the debug output (astro service).
// This is the regression test for the MANDALA_OFFSET / line-drift bug.
// ═══════════════════════════════════════════════════════════════════

describe("Moni golden fixture (6/2 regression)", () => {
  // Real Moni longitudes from astro service debug output
  const pSunLon = 54.325850;  // → Gate 23 Line 6
  const dSunLon = 326.325783; // → Gate 30 Line 2

  // At MANDALA_OFFSET = 1.75:
  // P.Sun: shifted=56.07585, Gate 23 [50.625,56.25), degInto=5.45085, lineFloat=5.814 → line 6 ✓
  // D.Sun: shifted=328.07578, Gate 30 [326.25,331.875), degInto=1.82578, lineFloat=1.948 → line 2 ✓

  it("personality Sun is Gate 23 Line 6", () => {
    const result = getGateAndLine(pSunLon);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(23);
    expect(result!.line).toBe(6);
  });

  it("design Sun is Gate 30 Line 2", () => {
    const result = getGateAndLine(dSunLon);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(30);
    expect(result!.line).toBe(2);
  });

  it("design Earth is Gate 29 Line 2", () => {
    const dEarthLon = normalizeDeg(dSunLon + 180); // 146.325783
    const result = getGateAndLine(dEarthLon);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(29);
    expect(result!.line).toBe(2);
  });

  it("computes profile as 6/2", () => {
    const pAct = longitudesToActivations({
      sun: pSunLon, moon: 100, mercury: 100, venus: 100, mars: 100,
      jupiter: 100, saturn: 100, uranus: 100, neptune: 100,
      pluto: 100, northNode: 100, southNode: 280,
    });
    const dAct = longitudesToActivations({
      sun: dSunLon, moon: 100, mercury: 100, venus: 100, mars: 100,
      jupiter: 100, saturn: 100, uranus: 100, neptune: 100,
      pluto: 100, northNode: 100, southNode: 280,
    });
    const profile = determineProfile(pAct.Sun.line, dAct.Sun.line);
    expect(profile).toBe("6/2");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Line boundary stability tests
// Ensures LINE_EPS prevents floating-point jitter at exact boundaries.
// ═══════════════════════════════════════════════════════════════════

describe("line boundary stability", () => {
  it("LINE_EPS is defined and positive", () => {
    expect(LINE_EPS).toBeGreaterThan(0);
    expect(LINE_EPS).toBeLessThan(1e-6);
  });

  it("exact line boundary (degIntoGate = 0.9375) maps to line 2", () => {
    // Gate 25 starts at mandala 0°. Line 2 starts at degIntoGate 0.9375.
    // shifted = 0.9375 → raw = 0.9375 - MANDALA_OFFSET = 0.9375 - 1.75 = -0.8125 → 359.1875
    const result = getGateAndLine(359.1875);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(25);
    expect(result!.line).toBe(2);
  });

  it("exact line boundary (degIntoGate = 1.875) maps to line 3", () => {
    // Gate 25: line 3 starts at degIntoGate 1.875.
    // shifted = 1.875 → raw = 1.875 - 1.75 = 0.125
    const result = getGateAndLine(0.125);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(25);
    expect(result!.line).toBe(3);
  });

  it("value infinitesimally below line boundary stays stable", () => {
    // degIntoGate = 1.875 - 1e-14 → should still map to line 3 with EPS guard
    // shifted = 1.875 - 1e-14 → raw ≈ 0.125 - 1e-14
    const rawDeg = 0.125 - 1e-14;
    const result = getGateAndLine(rawDeg);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(25);
    // With LINE_EPS, values within 1e-9 of boundary snap to higher line
    expect(result!.line).toBe(3);
  });

  it("all six lines are reachable within a gate", () => {
    // Gate 25 spans 0-5.625 in table. Test each line midpoint.
    for (let line = 1; line <= 6; line++) {
      const midOffset = (line - 1) * LINE_SPAN + LINE_SPAN / 2; // midpoint of line
      const shifted = 0 + midOffset; // gate 25 starts at 0
      const raw = shifted - MANDALA_OFFSET; // undo offset
      const result = getGateAndLine(raw);
      expect(result).not.toBeNull();
      expect(result!.gate).toBe(25);
      expect(result!.line).toBe(line);
    }
  });
});
