import { describe, it, expect } from "vitest";
import { buildHdSummary, computeChartHash } from "../hdSummary";
import type { HumanDesignProfile } from "../types";

// ═══════════════════════════════════════════════════════════════════
// Mock HumanDesignProfile fixture
// ═══════════════════════════════════════════════════════════════════

function makeMockHD(overrides?: Partial<HumanDesignProfile>): HumanDesignProfile {
  return {
    version: 2,
    birth: { iso: "1990-05-15T12:00:00Z", tz: "America/New_York", lat: 40.7, lon: -74.0 },
    design: { iso: "1990-02-16T00:00:00Z", sunTargetDeg: 234.5, method: "solarArc88" },
    personality: {
      Sun: { deg: 54.3, gate: 2, line: 4 },
      Earth: { deg: 234.3, gate: 33, line: 4 },
      Moon: { deg: 120.0, gate: 15, line: 2 },
      Mercury: { deg: 60.0, gate: 16, line: 1 },
      Venus: { deg: 80.0, gate: 23, line: 3 },
      Mars: { deg: 200.0, gate: 57, line: 5 },
      Jupiter: { deg: 100.0, gate: 47, line: 1 },
      Saturn: { deg: 290.0, gate: 54, line: 4 },
      Uranus: { deg: 280.0, gate: 58, line: 3 },
      Neptune: { deg: 282.0, gate: 38, line: 2 },
      Pluto: { deg: 240.0, gate: 34, line: 6 },
      NorthNode: { deg: 300.0, gate: 41, line: 1 },
      SouthNode: { deg: 120.0, gate: 15, line: 2 },
    },
    designActivations: {
      Sun: { deg: 215.0, gate: 28, line: 5 },
      Earth: { deg: 35.0, gate: 27, line: 3 },
      Moon: { deg: 150.0, gate: 45, line: 4 },
      Mercury: { deg: 70.0, gate: 12, line: 2 },
      Venus: { deg: 90.0, gate: 4, line: 1 },
      Mars: { deg: 210.0, gate: 50, line: 6 },
      Jupiter: { deg: 110.0, gate: 11, line: 3 },
      Saturn: { deg: 300.0, gate: 41, line: 5 },
      Uranus: { deg: 275.0, gate: 53, line: 1 },
      Neptune: { deg: 285.0, gate: 54, line: 6 },
      Pluto: { deg: 245.0, gate: 14, line: 2 },
      NorthNode: { deg: 310.0, gate: 60, line: 3 },
      SouthNode: { deg: 130.0, gate: 46, line: 5 },
    },
    defined: {
      gates: [2, 33, 28, 27, 15, 16, 23, 57, 47, 54, 58, 38, 34, 41],
      channels: [
        { name: "28-38", gates: [28, 38], centers: ["Spleen", "Root"], displayName: "Struggle" },
        { name: "54-32", gates: [54, 32], centers: ["Root", "Spleen"] },
      ],
      centers: [
        { name: "Head", defined: false },
        { name: "Ajna", defined: false },
        { name: "Throat", defined: false },
        { name: "G", defined: true },
        { name: "Heart", defined: false },
        { name: "Sacral", defined: false },
        { name: "Spleen", defined: true },
        { name: "SolarPlexus", defined: false },
        { name: "Root", defined: true },
      ],
      definitionType: "single",
    },
    type: "Projector",
    strategy: "Wait for the invitation",
    authority: "Splenic",
    profile: "4/5",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════
// buildHdSummary
// ═══════════════════════════════════════════════════════════════════

describe("buildHdSummary", () => {
  const hd = makeMockHD();
  const summary = buildHdSummary(hd);

  it("extracts type, strategy, authority, profile", () => {
    expect(summary.type).toBe("Projector");
    expect(summary.strategy).toBe("Wait for the invitation");
    expect(summary.authority).toBe("Splenic");
    expect(summary.profile).toBe("4/5");
  });

  it("extracts definition type", () => {
    expect(summary.definitionType).toBe("single");
  });

  it("extracts channels with display names", () => {
    expect(summary.channels).toHaveLength(2);
    expect(summary.channels[0]).toEqual({ name: "28-38", displayName: "Struggle" });
    // Channel without displayName should not have the key
    expect(summary.channels[1]).toEqual({ name: "54-32" });
    expect("displayName" in summary.channels[1]).toBe(false);
  });

  it("separates defined and undefined centers", () => {
    expect(summary.definedCenters).toEqual(["G", "Spleen", "Root"]);
    expect(summary.undefinedCenters).toEqual([
      "Head", "Ajna", "Throat", "Heart", "Sacral", "SolarPlexus",
    ]);
  });

  it("extracts personality Sun/Earth activations", () => {
    expect(summary.personalitySun).toEqual({ gate: 2, line: 4 });
    expect(summary.personalityEarth).toEqual({ gate: 33, line: 4 });
  });

  it("extracts design Sun/Earth activations", () => {
    expect(summary.designSun).toEqual({ gate: 28, line: 5 });
    expect(summary.designEarth).toEqual({ gate: 27, line: 3 });
  });

  it("builds crossGates tuple", () => {
    expect(summary.crossGates).toEqual([2, 33, 28, 27]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// computeChartHash
// ═══════════════════════════════════════════════════════════════════

describe("computeChartHash", () => {
  it("returns same hash for same input (stability)", () => {
    const hd = makeMockHD();
    const s = buildHdSummary(hd);
    const h1 = computeChartHash(s);
    const h2 = computeChartHash(s);
    expect(h1).toBe(h2);
  });

  it("returns a 64-char hex string (sha256)", () => {
    const s = buildHdSummary(makeMockHD());
    const h = computeChartHash(s);
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes when type changes", () => {
    const a = computeChartHash(buildHdSummary(makeMockHD()));
    const b = computeChartHash(buildHdSummary(makeMockHD({ type: "Generator" })));
    expect(a).not.toBe(b);
  });

  it("changes when profile changes", () => {
    const a = computeChartHash(buildHdSummary(makeMockHD()));
    const b = computeChartHash(buildHdSummary(makeMockHD({ profile: "1/3" })));
    expect(a).not.toBe(b);
  });

  it("changes when channels change", () => {
    const a = computeChartHash(buildHdSummary(makeMockHD()));
    const modified = makeMockHD({
      defined: {
        ...makeMockHD().defined,
        channels: [
          { name: "20-34", gates: [20, 34], centers: ["Sacral", "Throat"], displayName: "Charisma" },
        ],
      },
    });
    const b = computeChartHash(buildHdSummary(modified));
    expect(a).not.toBe(b);
  });

  it("changes when authority changes", () => {
    const a = computeChartHash(buildHdSummary(makeMockHD()));
    const b = computeChartHash(buildHdSummary(makeMockHD({ authority: "Emotional" })));
    expect(a).not.toBe(b);
  });
});
