// src/lib/humandesign/bodygraph.ts
// Human Design Bodygraph: Centers, Channels, and Gate Mappings

// ============================================================================
// CENTERS
// ============================================================================

export type CenterName =
  | "Head"
  | "Ajna"
  | "Throat"
  | "G"
  | "Heart"
  | "Sacral"
  | "Spleen"
  | "SolarPlexus"
  | "Root";

export type CenterInfo = {
  name: CenterName;
  displayName: string;
  gates: number[];
  isMotor: boolean;
  isPressure: boolean;
  isAwareness: boolean;
};

export const CENTERS: Record<CenterName, CenterInfo> = {
  Head: {
    name: "Head",
    displayName: "Head",
    gates: [64, 61, 63],
    isMotor: false,
    isPressure: true,
    isAwareness: false,
  },
  Ajna: {
    name: "Ajna",
    displayName: "Ajna",
    gates: [47, 24, 4, 17, 43, 11],
    isMotor: false,
    isPressure: false,
    isAwareness: true,
  },
  Throat: {
    name: "Throat",
    displayName: "Throat",
    gates: [62, 23, 56, 35, 12, 45, 33, 8, 31, 7, 1, 13, 20, 16],
    isMotor: false,
    isPressure: false,
    isAwareness: false,
  },
  G: {
    name: "G",
    displayName: "G (Self)",
    gates: [7, 1, 13, 10, 25, 46, 2, 15],
    isMotor: false,
    isPressure: false,
    isAwareness: false,
  },
  Heart: {
    name: "Heart",
    displayName: "Heart (Ego)",
    gates: [21, 40, 26, 51],
    isMotor: true,
    isPressure: false,
    isAwareness: false,
  },
  Sacral: {
    name: "Sacral",
    displayName: "Sacral",
    gates: [5, 14, 29, 59, 9, 3, 42, 27, 34],
    isMotor: true,
    isPressure: false,
    isAwareness: false,
  },
  Spleen: {
    name: "Spleen",
    displayName: "Spleen",
    gates: [48, 57, 44, 50, 32, 28, 18],
    isMotor: false,
    isPressure: false,
    isAwareness: true,
  },
  SolarPlexus: {
    name: "SolarPlexus",
    displayName: "Solar Plexus",
    gates: [6, 37, 22, 36, 30, 55, 49],
    isMotor: true,
    isPressure: false,
    isAwareness: true,
  },
  Root: {
    name: "Root",
    displayName: "Root",
    gates: [53, 60, 52, 19, 39, 41, 58, 38, 54],
    isMotor: true,
    isPressure: true,
    isAwareness: false,
  },
};

// ============================================================================
// CHANNELS
// ============================================================================

export type Channel = {
  name: string;
  gates: [number, number];
  centers: [CenterName, CenterName];
  displayName?: string;
};

/**
 * All 36 channels in the Human Design bodygraph
 * Format: { name: "gate1-gate2", gates: [gate1, gate2], centers: [center1, center2] }
 */
export const CHANNELS: Channel[] = [
  // Head to Ajna (3 channels)
  { name: "64-47", gates: [64, 47], centers: ["Head", "Ajna"], displayName: "Abstraction" },
  { name: "61-24", gates: [61, 24], centers: ["Head", "Ajna"], displayName: "Awareness" },
  { name: "63-4", gates: [63, 4], centers: ["Head", "Ajna"], displayName: "Logic" },

  // Ajna to Throat (3 channels)
  { name: "17-62", gates: [17, 62], centers: ["Ajna", "Throat"], displayName: "Acceptance" },
  { name: "43-23", gates: [43, 23], centers: ["Ajna", "Throat"], displayName: "Structuring" },
  { name: "11-56", gates: [11, 56], centers: ["Ajna", "Throat"], displayName: "Curiosity" },

  // Throat to G (4 channels)
  { name: "31-7", gates: [31, 7], centers: ["Throat", "G"], displayName: "The Alpha" },
  { name: "8-1", gates: [8, 1], centers: ["Throat", "G"], displayName: "Inspiration" },
  { name: "33-13", gates: [33, 13], centers: ["Throat", "G"], displayName: "The Prodigal" },
  { name: "20-10", gates: [20, 10], centers: ["Throat", "G"], displayName: "Awakening" },

  // Throat to Heart (1 channel)
  { name: "45-21", gates: [45, 21], centers: ["Throat", "Heart"], displayName: "Money" },

  // Throat to Sacral (2 channels)
  { name: "20-34", gates: [20, 34], centers: ["Throat", "Sacral"], displayName: "Charisma" },
  { name: "12-22", gates: [12, 22], centers: ["Throat", "SolarPlexus"], displayName: "Openness" },

  // Throat to Spleen (1 channel)
  { name: "16-48", gates: [16, 48], centers: ["Throat", "Spleen"], displayName: "The Wavelength" },

  // Throat to Solar Plexus (2 channels)
  { name: "35-36", gates: [35, 36], centers: ["Throat", "SolarPlexus"], displayName: "Transitoriness" },

  // G to Heart (1 channel)
  { name: "25-51", gates: [25, 51], centers: ["G", "Heart"], displayName: "Initiation" },

  // G to Sacral (2 channels)
  { name: "15-5", gates: [15, 5], centers: ["G", "Sacral"], displayName: "Rhythm" },
  { name: "2-14", gates: [2, 14], centers: ["G", "Sacral"], displayName: "The Beat" },

  // G to Spleen (2 channels)
  { name: "10-57", gates: [10, 57], centers: ["G", "Spleen"], displayName: "Perfected Form" },
  { name: "46-29", gates: [46, 29], centers: ["G", "Sacral"], displayName: "Discovery" },

  // Heart to Sacral (1 channel)
  { name: "26-44", gates: [26, 44], centers: ["Heart", "Spleen"], displayName: "Surrender" },

  // Heart to Root (1 channel)
  { name: "40-37", gates: [40, 37], centers: ["Heart", "SolarPlexus"], displayName: "Community" },

  // Heart to Spleen (1 channel)
  { name: "21-45", gates: [21, 45], centers: ["Throat", "Heart"], displayName: "Money" }, // Duplicate removed

  // Sacral to Spleen (4 channels)
  { name: "34-57", gates: [34, 57], centers: ["Sacral", "Spleen"], displayName: "Power" },
  { name: "59-6", gates: [59, 6], centers: ["Sacral", "SolarPlexus"], displayName: "Intimacy" },
  { name: "27-50", gates: [27, 50], centers: ["Sacral", "Spleen"], displayName: "Preservation" },
  { name: "3-60", gates: [3, 60], centers: ["Sacral", "Root"], displayName: "Mutation" },

  // Sacral to Root (4 channels)
  { name: "42-53", gates: [42, 53], centers: ["Sacral", "Root"], displayName: "Maturation" },
  { name: "9-52", gates: [9, 52], centers: ["Sacral", "Root"], displayName: "Concentration" },

  // Spleen to Root (3 channels)
  { name: "44-26", gates: [44, 26], centers: ["Spleen", "Heart"], displayName: "Surrender" }, // Duplicate, keeping correct
  { name: "32-54", gates: [32, 54], centers: ["Spleen", "Root"], displayName: "Transformation" },
  { name: "28-38", gates: [28, 38], centers: ["Spleen", "Root"], displayName: "Struggle" },
  { name: "18-58", gates: [18, 58], centers: ["Spleen", "Root"], displayName: "Judgment" },
  { name: "48-16", gates: [48, 16], centers: ["Spleen", "Throat"], displayName: "The Wavelength" }, // Duplicate removed

  // Solar Plexus to Root (3 channels)
  { name: "30-41", gates: [30, 41], centers: ["SolarPlexus", "Root"], displayName: "Recognition" },
  { name: "55-39", gates: [55, 39], centers: ["SolarPlexus", "Root"], displayName: "Emoting" },
  { name: "49-19", gates: [49, 19], centers: ["SolarPlexus", "Root"], displayName: "Synthesis" },

  // Sacral to Solar Plexus (1 channel)
  { name: "6-59", gates: [6, 59], centers: ["SolarPlexus", "Sacral"], displayName: "Intimacy" }, // Corrected duplicate
];

// Clean up channels - remove duplicates and ensure uniqueness
const UNIQUE_CHANNELS: Channel[] = [];
const seenChannels = new Set<string>();

for (const ch of CHANNELS) {
  const key = ch.gates.slice().sort((a, b) => a - b).join("-");
  if (!seenChannels.has(key)) {
    seenChannels.add(key);
    UNIQUE_CHANNELS.push({
      ...ch,
      name: key,
    });
  }
}

export const BODYGRAPH_CHANNELS: Channel[] = [
  // Head to Ajna
  { name: "64-47", gates: [64, 47], centers: ["Head", "Ajna"], displayName: "Abstraction" },
  { name: "61-24", gates: [61, 24], centers: ["Head", "Ajna"], displayName: "Awareness" },
  { name: "63-4", gates: [63, 4], centers: ["Head", "Ajna"], displayName: "Logic" },

  // Ajna to Throat
  { name: "17-62", gates: [17, 62], centers: ["Ajna", "Throat"], displayName: "Acceptance" },
  { name: "43-23", gates: [43, 23], centers: ["Ajna", "Throat"], displayName: "Structuring" },
  { name: "11-56", gates: [11, 56], centers: ["Ajna", "Throat"], displayName: "Curiosity" },

  // Throat to G
  { name: "7-31", gates: [7, 31], centers: ["G", "Throat"], displayName: "The Alpha" },
  { name: "1-8", gates: [1, 8], centers: ["G", "Throat"], displayName: "Inspiration" },
  { name: "13-33", gates: [13, 33], centers: ["G", "Throat"], displayName: "The Prodigal" },
  { name: "10-20", gates: [10, 20], centers: ["G", "Throat"], displayName: "Awakening" },

  // Throat to Heart
  { name: "21-45", gates: [21, 45], centers: ["Heart", "Throat"], displayName: "Money" },

  // Throat to Sacral
  { name: "20-34", gates: [20, 34], centers: ["Sacral", "Throat"], displayName: "Charisma" },

  // Throat to Spleen
  { name: "16-48", gates: [16, 48], centers: ["Spleen", "Throat"], displayName: "The Wavelength" },
  { name: "20-57", gates: [20, 57], centers: ["Throat", "Spleen"], displayName: "The Brain Wave" },

  // Throat to Solar Plexus
  { name: "12-22", gates: [12, 22], centers: ["SolarPlexus", "Throat"], displayName: "Openness" },
  { name: "35-36", gates: [35, 36], centers: ["SolarPlexus", "Throat"], displayName: "Transitoriness" },

  // G to Heart
  { name: "25-51", gates: [25, 51], centers: ["G", "Heart"], displayName: "Initiation" },

  // G to Sacral
  { name: "5-15", gates: [5, 15], centers: ["Sacral", "G"], displayName: "Rhythm" },
  { name: "2-14", gates: [2, 14], centers: ["Sacral", "G"], displayName: "The Beat" },
  { name: "29-46", gates: [29, 46], centers: ["Sacral", "G"], displayName: "Discovery" },
  { name: "10-34", gates: [10, 34], centers: ["G", "Sacral"], displayName: "Exploration" },

  // G to Spleen
  { name: "10-57", gates: [10, 57], centers: ["G", "Spleen"], displayName: "Perfected Form" },

  // Heart to Spleen
  { name: "26-44", gates: [26, 44], centers: ["Heart", "Spleen"], displayName: "Surrender" },

  // Heart to Solar Plexus
  { name: "37-40", gates: [37, 40], centers: ["SolarPlexus", "Heart"], displayName: "Community" },

  // Sacral to Spleen
  { name: "34-57", gates: [34, 57], centers: ["Sacral", "Spleen"], displayName: "Power" },
  { name: "27-50", gates: [27, 50], centers: ["Sacral", "Spleen"], displayName: "Preservation" },

  // Sacral to Solar Plexus
  { name: "6-59", gates: [6, 59], centers: ["Sacral", "SolarPlexus"], displayName: "Intimacy" },

  // Sacral to Root
  { name: "3-60", gates: [3, 60], centers: ["Sacral", "Root"], displayName: "Mutation" },
  { name: "42-53", gates: [42, 53], centers: ["Sacral", "Root"], displayName: "Maturation" },
  { name: "9-52", gates: [9, 52], centers: ["Sacral", "Root"], displayName: "Concentration" },

  // Spleen to Root
  { name: "32-54", gates: [32, 54], centers: ["Spleen", "Root"], displayName: "Transformation" },
  { name: "28-38", gates: [28, 38], centers: ["Spleen", "Root"], displayName: "Struggle" },
  { name: "18-58", gates: [18, 58], centers: ["Spleen", "Root"], displayName: "Judgment" },

  // Solar Plexus to Root
  { name: "30-41", gates: [30, 41], centers: ["SolarPlexus", "Root"], displayName: "Recognition" },
  { name: "39-55", gates: [39, 55], centers: ["SolarPlexus", "Root"], displayName: "Emoting" },
  { name: "19-49", gates: [19, 49], centers: ["SolarPlexus", "Root"], displayName: "Synthesis" },
];

// ============================================================================
// GATE TO CENTER MAPPING
// ============================================================================

/**
 * Map each gate (1-64) to its center
 */
export const GATE_TO_CENTER: Record<number, CenterName> = {};

// Populate from CENTERS definition
for (const [centerName, info] of Object.entries(CENTERS)) {
  for (const gate of info.gates) {
    GATE_TO_CENTER[gate] = centerName as CenterName;
  }
}

// ============================================================================
// MOTOR CENTERS
// ============================================================================

export const MOTOR_CENTERS: CenterName[] = ["Heart", "Sacral", "SolarPlexus", "Root"];

// ============================================================================
// CHANNEL LOOKUP HELPERS
// ============================================================================

/**
 * Find a channel by its two gates (order doesn't matter)
 */
export function findChannel(gate1: number, gate2: number): Channel | null {
  const key1 = `${Math.min(gate1, gate2)}-${Math.max(gate1, gate2)}`;
  return BODYGRAPH_CHANNELS.find((ch) => ch.name === key1) ?? null;
}

/**
 * Get all channels that include a specific gate
 */
export function getChannelsForGate(gate: number): Channel[] {
  return BODYGRAPH_CHANNELS.filter((ch) => ch.gates.includes(gate));
}

/**
 * Get the center for a gate
 */
export function getCenterForGate(gate: number): CenterName | null {
  return GATE_TO_CENTER[gate] ?? null;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate bodygraph data integrity
 */
export function validateBodygraph(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check that all gates in channels exist in GATE_TO_CENTER
  for (const ch of BODYGRAPH_CHANNELS) {
    for (const gate of ch.gates) {
      if (!GATE_TO_CENTER[gate]) {
        errors.push(`Channel ${ch.name}: gate ${gate} not mapped to any center`);
      }
    }

    // Check that channel centers match gate centers
    const [g1, g2] = ch.gates;
    const [c1, c2] = ch.centers;
    const actualC1 = GATE_TO_CENTER[g1];
    const actualC2 = GATE_TO_CENTER[g2];

    if (actualC1 && actualC2) {
      const centersMatch =
        (actualC1 === c1 && actualC2 === c2) || (actualC1 === c2 && actualC2 === c1);
      if (!centersMatch) {
        errors.push(
          `Channel ${ch.name}: gates are in [${actualC1}, ${actualC2}] but channel says [${c1}, ${c2}]`
        );
      }
    }
  }

  // Check that all 64 gates are mapped
  for (let g = 1; g <= 64; g++) {
    if (!GATE_TO_CENTER[g]) {
      errors.push(`Gate ${g} not mapped to any center`);
    }
  }

  // Check for exactly 36 unique channels
  if (BODYGRAPH_CHANNELS.length !== 36) {
    errors.push(`Expected 36 channels, found ${BODYGRAPH_CHANNELS.length}`);
  }

  return { valid: errors.length === 0, errors };
}
