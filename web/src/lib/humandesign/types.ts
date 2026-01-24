// src/lib/humandesign/types.ts
// Human Design type definitions

import type { CenterName } from "./bodygraph";

// ============================================================================
// ACTIVATION TYPES
// ============================================================================

export type PlanetKey =
  | "Sun"
  | "Earth"
  | "Moon"
  | "Mercury"
  | "Venus"
  | "Mars"
  | "Jupiter"
  | "Saturn"
  | "Uranus"
  | "Neptune"
  | "Pluto"
  | "NorthNode"
  | "SouthNode";

export type Activation = {
  deg: number;
  gate: number;
  line: number;
};

export type ActivationSet = Record<PlanetKey, Activation>;

// ============================================================================
// DEFINED STRUCTURES
// ============================================================================

export type DefinedChannel = {
  name: string;
  gates: [number, number];
  centers: [CenterName, CenterName];
  displayName?: string;
};

export type DefinedCenter = {
  name: CenterName;
  defined: boolean;
};

export type DefinitionType =
  | "single"
  | "split"
  | "tripleSplit"
  | "quadSplit"
  | "none";

// ============================================================================
// HD TYPE, STRATEGY, AUTHORITY
// ============================================================================

export type HDType =
  | "Generator"
  | "Manifesting Generator"
  | "Projector"
  | "Manifestor"
  | "Reflector";

export type HDStrategy =
  | "Wait to respond"
  | "Wait for the invitation"
  | "Inform and initiate"
  | "Wait a lunar cycle";

export type HDAuthority =
  | "Emotional"
  | "Sacral"
  | "Splenic"
  | "Ego"
  | "Self-Projected"
  | "Mental"
  | "Lunar"
  | "None";

// ============================================================================
// FULL HD PROFILE
// ============================================================================

export type HumanDesignProfile = {
  version: number;

  birth: {
    iso: string;
    tz: string;
    lat: number;
    lon: number;
  };

  design: {
    iso: string;
    sunTargetDeg: number;
    method: "solarArc88";
  };

  personality: ActivationSet;
  designActivations: ActivationSet;

  defined: {
    gates: number[];
    channels: DefinedChannel[];
    centers: DefinedCenter[];
    definitionType: DefinitionType;
  };

  type: HDType;
  strategy: HDStrategy;
  authority: HDAuthority;
  profile: string; // e.g., "2/4"
};

// ============================================================================
// COMPUTATION INPUT TYPES
// ============================================================================

export type BirthData = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  lat: number;
  lon: number;
  timezone: string;
};

export type PlanetaryLongitudes = {
  sun: number;
  moon: number;
  mercury: number;
  venus: number;
  mars: number;
  jupiter: number;
  saturn: number;
  uranus: number;
  neptune: number;
  pluto: number;
  northNode: number;
  southNode: number;
};
