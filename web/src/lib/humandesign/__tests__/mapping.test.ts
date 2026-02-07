import { describe, it, expect } from "vitest";
import {
  getGateAndLine,
  gateForDeg,
  normalizeDeg,
  GATE_RANGES,
  MANDALA_OFFSET,
  GATE_SPAN,
  LINE_SPAN,
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

  it("MANDALA_OFFSET is 1.875°", () => {
    expect(MANDALA_OFFSET).toBe(1.875);
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
    // 0° + 1.875° offset = 1.875°, which is inside Gate 25 (0-5.625)
    const result = getGateAndLine(0);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(25);
  });

  it("maps a degree just before offset boundary to correct gate", () => {
    // 358.125° tropical + 1.875° = 360° → normalized to 0° → Gate 25
    const result = getGateAndLine(358.125);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(25);
    expect(result!.line).toBe(1);
  });

  it("correctly computes lines within a gate", () => {
    // Gate 25 spans 0-5.625 in the table.
    // For line 3: need shifted deg in [1.875, 2.8125) within gate 25.
    // So raw deg + 1.875 should be in [1.875, 2.8125).
    // raw deg = 0 → shifted = 1.875 → degIntoGate = 1.875 → line 3
    const result = getGateAndLine(0.0);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(25);
    expect(result!.line).toBe(3);
  });

  it("line 1 at the very start of a gate", () => {
    // Gate 25 starts at 0° in table. Need shifted deg right at 0°.
    // raw deg + 1.875 = 0 (mod 360) → raw deg = 358.125
    const result = getGateAndLine(358.125);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(25);
    expect(result!.line).toBe(1);
  });

  it("line 6 at the end of a gate", () => {
    // Gate 25 ends at 5.625° in table. Line 6 = [4.6875, 5.625).
    // Need shifted deg in [4.6875, 5.625). shifted = raw + 1.875
    // raw = 4.6875 - 1.875 = 2.8125
    const result = getGateAndLine(2.8125 + 0.5); // 3.3125 + 1.875 = 5.1875 → line 6
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(25);
    expect(result!.line).toBe(6);
  });

  it("handles wrap-around at 360°", () => {
    const result = getGateAndLine(359.999);
    expect(result).not.toBeNull();
    // 359.999 + 1.875 = 361.874 → normalized 1.874 → Gate 25
    // degIntoGate = 1.874, line = floor(1.874/0.9375)+1 = 2+1 = 3? No: floor(1.999)=1, so line 2
    expect(result!.gate).toBe(25);
    expect(result!.line).toBe(2);
  });

  it("handles negative degrees", () => {
    const result = getGateAndLine(-1);
    expect(result).not.toBeNull();
    // -1 + 1.875 = 0.875 → normalized 0.875 → Gate 25 line 1
    expect(result!.gate).toBe(25);
    expect(result!.line).toBe(1);
  });

  // Specific known gate boundaries
  it("maps early Aquarius degrees to Gate 41", () => {
    // Gate 41 in table: 303.75-309.375
    // For raw deg to land in gate 41: raw + 1.875 ∈ [303.75, 309.375)
    // raw = 302 → shifted = 303.875 → in range → gate 41
    const result = getGateAndLine(302);
    expect(result).not.toBeNull();
    expect(result!.gate).toBe(41);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Asun fixture test (deterministic — no API calls)
// Uses pre-determined longitudes that would produce the expected results.
// ═══════════════════════════════════════════════════════════════════

describe("Asun profile fixture", () => {
  // We test the mapping + downstream logic with longitudes that produce
  // the expected gate.line results:
  //   P Sun:   41.3  →  needs shifted deg in gate 41, line 3
  //   P Earth: 31.3  →  needs shifted deg in gate 31, line 3
  //   D Sun:   28.5  →  needs shifted deg in gate 28, line 5
  //   D Earth: 27.5  →  needs shifted deg in gate 27, line 5

  // Gate 41: table range 303.75-309.375. Line 3 offset: [1.875, 2.8125)
  // shifted = 303.75 + 2.0 = 305.75. raw = 305.75 - 1.875 = 303.875
  const pSunLon = 303.875;
  // Earth = Sun + 180
  const pEarthLon = normalizeDeg(pSunLon + 180); // 123.875

  // Gate 31: table range 123.75-129.375. Line 3: shifted in [125.625, 126.5625)
  // pEarthLon shifted = 123.875 + 1.875 = 125.75 → in gate 31, line 3 ✓

  // Gate 28: table range 213.75-219.375. Line 5: offset [3.75, 4.6875)
  // shifted = 213.75 + 4.0 = 217.75. raw = 217.75 - 1.875 = 215.875
  const dSunLon = 215.875;
  const dEarthLon = normalizeDeg(dSunLon + 180); // 35.875

  // Gate 27: table range 33.75-39.375. Line 5: offset [3.75, 4.6875)
  // shifted = 35.875 + 1.875 = 37.75 → 37.75 - 33.75 = 4.0 → line 5 ✓

  // Build planetary longitudes with other planets placed to NOT activate
  // gates 26 or 44 (which would create the false 26-44 channel).
  // We set planets to activate gates that form expected channels:
  //   7-31, 27-50, 32-54, 28-38

  // Required active gates: 7, 31, 27, 50, 32, 54, 28, 38
  // P Sun=41, P Earth=31, D Sun=28, D Earth=27 already provide: 41, 31, 28, 27
  // Need to activate: 7, 50, 32, 54, 38

  // For the test we position other planets to provide these gates
  // without hitting 26 or 44.

  // Gate 7: table 135.0-140.625 → shifted mid = 137.5 → raw = 137.5-1.875 = 135.625
  // Gate 50: table 208.125-213.75 → shifted mid = 210.9375 → raw = 209.0625
  // Gate 32: table 202.5-208.125 → shifted mid = 205.3125 → raw = 203.4375
  // Gate 54: table 286.875-292.5 → shifted mid = 289.6875 → raw = 287.8125
  // Gate 38: table 281.25-286.875 → shifted mid = 284.0625 → raw = 282.1875

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
    pluto: 240.0,      // → gate 34
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
