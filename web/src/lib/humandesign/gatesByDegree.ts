// src/lib/humandesign/gatesByDegree.ts
// Human Design Gate-Degree Mapping
// Each gate spans 5.625° (360° / 64 gates)
// Gates are mapped to tropical zodiac in the traditional Human Design wheel order

export type GateRange = {
  gate: number;
  startDeg: number;
  endDeg: number;
};

// Gate span in degrees
export const GATE_SPAN = 5.625;
export const LINE_SPAN = GATE_SPAN / 6; // 0.9375° per line

/**
 * Floating-point epsilon for line boundary stability.
 * Values within EPS of a line boundary snap to the higher line,
 * preventing non-deterministic results from floating-point subtraction.
 * 1e-9° ≈ 0.004 milliarcseconds — astronomically negligible.
 */
export const LINE_EPS = 1e-9;

/**
 * Canonical Human Design mandala offset.
 * The HD wheel starts Gate 25 Line 1 at 358°07'30" tropical (1°52'30" before 0° Aries).
 * This 1.875° offset aligns the gate/line boundaries with the Jovian Archive standard.
 * Applied by adding this value to the raw tropical longitude before gate lookup.
 */
export const MANDALA_OFFSET = 1.875;

/**
 * Complete gate-degree mapping for Human Design
 * Ordered by zodiac position (0° Aries = 0°)
 * Each entry shows: gate number, start degree, end degree
 */
export const GATE_RANGES: GateRange[] = [
  // Aries (0° - 30°)
  { gate: 25, startDeg: 0.0, endDeg: 5.625 },
  { gate: 17, startDeg: 5.625, endDeg: 11.25 },
  { gate: 21, startDeg: 11.25, endDeg: 16.875 },
  { gate: 51, startDeg: 16.875, endDeg: 22.5 },
  { gate: 42, startDeg: 22.5, endDeg: 28.125 },
  { gate: 3, startDeg: 28.125, endDeg: 33.75 },

  // Taurus (30° - 60°)
  { gate: 27, startDeg: 33.75, endDeg: 39.375 },
  { gate: 24, startDeg: 39.375, endDeg: 45.0 },
  { gate: 2, startDeg: 45.0, endDeg: 50.625 },
  { gate: 23, startDeg: 50.625, endDeg: 56.25 },
  { gate: 8, startDeg: 56.25, endDeg: 61.875 },

  // Gemini (60° - 90°)
  { gate: 20, startDeg: 61.875, endDeg: 67.5 },
  { gate: 16, startDeg: 67.5, endDeg: 73.125 },
  { gate: 35, startDeg: 73.125, endDeg: 78.75 },
  { gate: 45, startDeg: 78.75, endDeg: 84.375 },
  { gate: 12, startDeg: 84.375, endDeg: 90.0 },

  // Cancer (90° - 120°)
  { gate: 15, startDeg: 90.0, endDeg: 95.625 },
  { gate: 52, startDeg: 95.625, endDeg: 101.25 },
  { gate: 39, startDeg: 101.25, endDeg: 106.875 },
  { gate: 53, startDeg: 106.875, endDeg: 112.5 },
  { gate: 62, startDeg: 112.5, endDeg: 118.125 },
  { gate: 56, startDeg: 118.125, endDeg: 123.75 },

  // Leo (120° - 150°)
  { gate: 31, startDeg: 123.75, endDeg: 129.375 },
  { gate: 33, startDeg: 129.375, endDeg: 135.0 },
  { gate: 7, startDeg: 135.0, endDeg: 140.625 },
  { gate: 4, startDeg: 140.625, endDeg: 146.25 },
  { gate: 29, startDeg: 146.25, endDeg: 151.875 },
  { gate: 59, startDeg: 151.875, endDeg: 157.5 },

  // Virgo (150° - 180°)
  { gate: 40, startDeg: 157.5, endDeg: 163.125 },
  { gate: 64, startDeg: 163.125, endDeg: 168.75 },
  { gate: 47, startDeg: 168.75, endDeg: 174.375 },
  { gate: 6, startDeg: 174.375, endDeg: 180.0 },

  // Libra (180° - 210°)
  { gate: 46, startDeg: 180.0, endDeg: 185.625 },
  { gate: 18, startDeg: 185.625, endDeg: 191.25 },
  { gate: 48, startDeg: 191.25, endDeg: 196.875 },
  { gate: 57, startDeg: 196.875, endDeg: 202.5 },
  { gate: 32, startDeg: 202.5, endDeg: 208.125 },
  { gate: 50, startDeg: 208.125, endDeg: 213.75 },

  // Scorpio (210° - 240°)
  { gate: 28, startDeg: 213.75, endDeg: 219.375 },
  { gate: 44, startDeg: 219.375, endDeg: 225.0 },
  { gate: 1, startDeg: 225.0, endDeg: 230.625 },
  { gate: 43, startDeg: 230.625, endDeg: 236.25 },
  { gate: 14, startDeg: 236.25, endDeg: 241.875 },
  { gate: 34, startDeg: 241.875, endDeg: 247.5 },

  // Sagittarius (240° - 270°)
  { gate: 9, startDeg: 247.5, endDeg: 253.125 },
  { gate: 5, startDeg: 253.125, endDeg: 258.75 },
  { gate: 26, startDeg: 258.75, endDeg: 264.375 },
  { gate: 11, startDeg: 264.375, endDeg: 270.0 },

  // Capricorn (270° - 300°)
  { gate: 10, startDeg: 270.0, endDeg: 275.625 },
  { gate: 58, startDeg: 275.625, endDeg: 281.25 },
  { gate: 38, startDeg: 281.25, endDeg: 286.875 },
  { gate: 54, startDeg: 286.875, endDeg: 292.5 },
  { gate: 61, startDeg: 292.5, endDeg: 298.125 },
  { gate: 60, startDeg: 298.125, endDeg: 303.75 },

  // Aquarius (300° - 330°)
  { gate: 41, startDeg: 303.75, endDeg: 309.375 },
  { gate: 19, startDeg: 309.375, endDeg: 315.0 },
  { gate: 13, startDeg: 315.0, endDeg: 320.625 },
  { gate: 49, startDeg: 320.625, endDeg: 326.25 },
  { gate: 30, startDeg: 326.25, endDeg: 331.875 },
  { gate: 55, startDeg: 331.875, endDeg: 337.5 },

  // Pisces (330° - 360°)
  { gate: 37, startDeg: 337.5, endDeg: 343.125 },
  { gate: 63, startDeg: 343.125, endDeg: 348.75 },
  { gate: 22, startDeg: 348.75, endDeg: 354.375 },
  { gate: 36, startDeg: 354.375, endDeg: 360.0 },
];

// Create a sorted copy for binary search
const SORTED_GATES = [...GATE_RANGES].sort((a, b) => a.startDeg - b.startDeg);

/**
 * Normalize a degree value to [0, 360)
 */
export function normalizeDeg(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/**
 * Check if a degree is within a range (handles wrap-around at 360°)
 */
export function inRange(deg: number, start: number, end: number): boolean {
  const d = normalizeDeg(deg);
  if (start <= end) {
    // Normal range
    return d >= start && d < end;
  } else {
    // Wrap-around range (crosses 0°)
    return d >= start || d < end;
  }
}

/**
 * Find the gate for a given zodiac degree.
 * Applies the canonical HD mandala offset before lookup.
 */
export function gateForDeg(deg: number): { gate: number; startDeg: number; endDeg: number } | null {
  const d = normalizeDeg(deg + MANDALA_OFFSET);

  // Binary search for the gate
  let low = 0;
  let high = SORTED_GATES.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const range = SORTED_GATES[mid];

    if (d >= range.startDeg && d < range.endDeg) {
      return range;
    }

    if (d < range.startDeg) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  // Handle edge case at exactly 360° (should map to gate at 0°)
  if (d >= 359.99) {
    return SORTED_GATES[0];
  }

  // Shouldn't reach here with valid data
  return null;
}

/**
 * Calculate the line (1-6) for a degree within a gate
 * Line 1 starts at the beginning of the gate, Line 6 at the end.
 * Applies the canonical HD mandala offset before calculation.
 */
export function lineForDegWithinGate(
  deg: number,
  gateStart: number,
  gateEnd: number
): number {
  const d = normalizeDeg(deg + MANDALA_OFFSET);

  // Calculate offset from gate start (handle wrap-around)
  let offset: number;
  if (gateStart <= gateEnd) {
    offset = d - gateStart;
  } else {
    // Gate crosses 0°
    if (d >= gateStart) {
      offset = d - gateStart;
    } else {
      offset = 360 - gateStart + d;
    }
  }

  // Calculate line (1-6)
  // EPS guards against floating-point jitter at exact line boundaries:
  // e.g., offset=0.93749999999999 (should be 0.9375) → without EPS gives line 1, with EPS gives line 2
  const lineIndex = Math.floor((offset + LINE_EPS) / LINE_SPAN);
  const line = Math.min(Math.max(lineIndex + 1, 1), 6);

  return line;
}

/**
 * Get gate and line for a tropical zodiac degree.
 * The mandala offset is applied internally by gateForDeg and lineForDegWithinGate.
 */
export function getGateAndLine(deg: number): { gate: number; line: number } | null {
  const range = gateForDeg(deg);
  if (!range) return null;

  const line = lineForDegWithinGate(deg, range.startDeg, range.endDeg);
  return { gate: range.gate, line };
}

/**
 * Validate that the gate ranges cover the full 360° without gaps or overlaps
 */
export function validateGateRanges(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check we have exactly 64 gates
  if (GATE_RANGES.length !== 64) {
    errors.push(`Expected 64 gates, found ${GATE_RANGES.length}`);
  }

  // Check all gates 1-64 are present
  const gateNumbers = new Set(GATE_RANGES.map((r) => r.gate));
  for (let i = 1; i <= 64; i++) {
    if (!gateNumbers.has(i)) {
      errors.push(`Missing gate ${i}`);
    }
  }

  // Check total coverage
  const totalDegrees = GATE_RANGES.reduce((sum, r) => {
    const span = r.endDeg > r.startDeg ? r.endDeg - r.startDeg : 360 - r.startDeg + r.endDeg;
    return sum + span;
  }, 0);

  if (Math.abs(totalDegrees - 360) > 0.01) {
    errors.push(`Total coverage is ${totalDegrees}°, expected 360°`);
  }

  // Check for gaps/overlaps in sorted order
  const sorted = [...GATE_RANGES].sort((a, b) => a.startDeg - b.startDeg);
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (Math.abs(current.endDeg - next.startDeg) > 0.001) {
      errors.push(`Gap/overlap between gates ${current.gate} and ${next.gate}: ${current.endDeg} vs ${next.startDeg}`);
    }
  }

  // Check wrap-around (last gate end should match first gate start)
  const lastGate = sorted[sorted.length - 1];
  const firstGate = sorted[0];
  if (Math.abs(lastGate.endDeg - 360) > 0.001 && Math.abs(lastGate.endDeg - firstGate.startDeg) > 0.001) {
    errors.push(`Wrap-around mismatch: last gate ends at ${lastGate.endDeg}, first starts at ${firstGate.startDeg}`);
  }

  return { valid: errors.length === 0, errors };
}
