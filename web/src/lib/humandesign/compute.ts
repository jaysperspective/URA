// src/lib/humandesign/compute.ts
// Human Design computation functions

import { fetchChart } from "../astro/client";
import type { ChartData } from "../astro/mockData";
import { normalizeDeg, getGateAndLine } from "./gatesByDegree";
import {
  BODYGRAPH_CHANNELS,
  CENTERS,
  GATE_TO_CENTER,
  MOTOR_CENTERS,
  type CenterName,
  type Channel,
} from "./bodygraph";
import type {
  HumanDesignProfile,
  BirthData,
  PlanetaryLongitudes,
  Activation,
  ActivationSet,
  DefinedChannel,
  DefinedCenter,
  DefinitionType,
  HDType,
  HDStrategy,
  HDAuthority,
  PlanetKey,
} from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

const SOLAR_ARC_DEGREES = 88.0;
const DESIGN_SEARCH_START_DAYS = -110; // Start search ~110 days before birth
const DESIGN_SEARCH_END_DAYS = -70; // End search ~70 days before birth
const DESIGN_SEARCH_TOLERANCE_DEG = 0.0001; // 0.0001° tolerance (~0.01% of a line)
const DESIGN_SEARCH_MIN_INTERVAL_MS = 1000; // 1 second minimum interval

// Current version for cache invalidation
// v2: Fixed mandala offset (1.875°), added missing channels 10-34, 20-57
// v3: Fixed design-time solver precision (fractional minutes, tighter tolerance)
// v4: Fixed MANDALA_OFFSET from 1.875° to 1.75° (Gate 41.1 = 2°00' Aquarius)
export const HD_VERSION = 4;

// ============================================================================
// TIMEZONE CONVERSION HELPERS
// ============================================================================

/**
 * Convert local birth time to UTC Date
 */
export function birthToUtcDate(birth: BirthData): Date {
  // Create a date string in the user's timezone
  const localStr = `${birth.year}-${String(birth.month).padStart(2, "0")}-${String(birth.day).padStart(2, "0")}T${String(birth.hour).padStart(2, "0")}:${String(birth.minute).padStart(2, "0")}:00`;

  // Parse in the user's timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: birth.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Get the offset for the user's timezone at the birth date
  const parts = formatter.formatToParts(new Date(localStr));
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";

  // Create UTC date by parsing the local time as UTC then adjusting
  const localDate = new Date(localStr + "Z");

  // Calculate timezone offset
  const tzDate = new Date(
    localDate.toLocaleString("en-US", { timeZone: birth.timezone })
  );
  const utcDate = new Date(localDate.toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMs = utcDate.getTime() - tzDate.getTime();

  return new Date(localDate.getTime() + offsetMs);
}

/**
 * Get minute value with fractional seconds for precise chart fetches.
 * Date.getUTCMinutes() returns integer 0-59, dropping seconds/ms.
 * This preserves sub-minute precision critical for design-time accuracy.
 */
function getMinuteWithFraction(date: Date): number {
  return (
    date.getUTCMinutes() +
    date.getUTCSeconds() / 60 +
    date.getUTCMilliseconds() / 60000
  );
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setTime(result.getTime() + days * 24 * 60 * 60 * 1000);
  return result;
}

// ============================================================================
// DESIGN TIME CALCULATION
// ============================================================================

/**
 * Calculate the shortest angular distance between two angles
 */
function angularDistance(a: number, b: number): number {
  const diff = normalizeDeg(a - b);
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Calculate signed angular distance from a to b (positive = counterclockwise)
 */
function signedAngularDistance(from: number, to: number): number {
  const diff = normalizeDeg(to - from);
  return diff > 180 ? diff - 360 : diff;
}

/**
 * Fetch Sun longitude for a given UTC datetime
 */
async function fetchSunLongitude(
  utcDate: Date,
  lat: number,
  lon: number
): Promise<number | null> {
  try {
    const response = await fetchChart({
      year: utcDate.getUTCFullYear(),
      month: utcDate.getUTCMonth() + 1,
      day: utcDate.getUTCDate(),
      hour: utcDate.getUTCHours(),
      minute: getMinuteWithFraction(utcDate),
      latitude: lat,
      longitude: lon,
    });

    if (!response.ok || !response.data?.planets?.sun) {
      return null;
    }

    return response.data.planets.sun.lon;
  } catch {
    return null;
  }
}

/**
 * Find the design time using binary search
 * Design time is when the transiting Sun was 88° behind the natal Sun
 */
export async function findDesignTime(
  birthUtc: Date,
  natalSunLon: number,
  lat: number,
  lon: number
): Promise<{ iso: string; sunTargetDeg: number } | null> {
  // Target: Sun at natal Sun - 88°
  const targetLon = normalizeDeg(natalSunLon - SOLAR_ARC_DEGREES);

  // Search window: approximately 88 days before birth (Sun moves ~1°/day)
  let startDate = addDays(birthUtc, DESIGN_SEARCH_START_DAYS);
  let endDate = addDays(birthUtc, DESIGN_SEARCH_END_DAYS);

  // Binary search — only fetch midpoint Sun each iteration (1 API call, not 3)
  let iterations = 0;
  const maxIterations = 50;

  while (iterations < maxIterations) {
    iterations++;

    const midDate = new Date((startDate.getTime() + endDate.getTime()) / 2);
    const midSunLon = await fetchSunLongitude(midDate, lat, lon);

    if (midSunLon === null) {
      console.error("[HD compute] Failed to fetch Sun longitude during design search");
      return null;
    }

    const distToTarget = angularDistance(midSunLon, targetLon);

    if (distToTarget < DESIGN_SEARCH_TOLERANCE_DEG) {
      // Found it with sufficient precision
      return {
        iso: midDate.toISOString(),
        sunTargetDeg: targetLon,
      };
    }

    // Determine which half to search
    // Sun moves forward (increasing longitude) over time.
    // If target is ahead of mid Sun, search later (closer to birth).
    const midDist = signedAngularDistance(midSunLon, targetLon);

    if (midDist > 0) {
      startDate = midDate;
    } else {
      endDate = midDate;
    }

    // Safety: stop if time interval collapses below 1 second
    if (endDate.getTime() - startDate.getTime() < DESIGN_SEARCH_MIN_INTERVAL_MS) {
      return {
        iso: midDate.toISOString(),
        sunTargetDeg: targetLon,
      };
    }
  }

  console.warn("[HD compute] Design time search did not converge");
  return null;
}

// ============================================================================
// PLANETARY ACTIVATIONS
// ============================================================================

/**
 * Extract planetary longitudes from ChartData
 */
export function extractLongitudes(chart: ChartData): PlanetaryLongitudes {
  return {
    sun: chart.planets.sun.lon,
    moon: chart.planets.moon.lon,
    mercury: chart.planets.mercury.lon,
    venus: chart.planets.venus.lon,
    mars: chart.planets.mars.lon,
    jupiter: chart.planets.jupiter.lon,
    saturn: chart.planets.saturn.lon,
    uranus: chart.planets.uranus.lon,
    neptune: chart.planets.neptune.lon,
    pluto: chart.planets.pluto.lon,
    northNode: chart.planets.northNode.lon,
    southNode: chart.planets.southNode.lon,
  };
}

/**
 * Convert a longitude to gate/line activation
 */
function longitudeToActivation(lon: number): Activation {
  const result = getGateAndLine(lon);
  if (!result) {
    // Fallback - should never happen with valid data
    return { deg: normalizeDeg(lon), gate: 1, line: 1 };
  }
  return {
    deg: normalizeDeg(lon),
    gate: result.gate,
    line: result.line,
  };
}

/**
 * Convert planetary longitudes to full activation set
 * Earth is always opposite Sun (+ 180°)
 */
export function longitudesToActivations(longs: PlanetaryLongitudes): ActivationSet {
  const earthLon = normalizeDeg(longs.sun + 180);

  return {
    Sun: longitudeToActivation(longs.sun),
    Earth: longitudeToActivation(earthLon),
    Moon: longitudeToActivation(longs.moon),
    Mercury: longitudeToActivation(longs.mercury),
    Venus: longitudeToActivation(longs.venus),
    Mars: longitudeToActivation(longs.mars),
    Jupiter: longitudeToActivation(longs.jupiter),
    Saturn: longitudeToActivation(longs.saturn),
    Uranus: longitudeToActivation(longs.uranus),
    Neptune: longitudeToActivation(longs.neptune),
    Pluto: longitudeToActivation(longs.pluto),
    NorthNode: longitudeToActivation(longs.northNode),
    SouthNode: longitudeToActivation(longs.southNode),
  };
}

// ============================================================================
// DEFINED GATES, CHANNELS, CENTERS
// ============================================================================

/**
 * Get all unique defined gates from both personality and design
 */
export function getDefinedGates(
  personality: ActivationSet,
  design: ActivationSet
): number[] {
  const gateSet = new Set<number>();

  for (const key of Object.keys(personality) as PlanetKey[]) {
    gateSet.add(personality[key].gate);
    gateSet.add(design[key].gate);
  }

  return Array.from(gateSet).sort((a, b) => a - b);
}

/**
 * Get all defined channels (both gates active)
 */
export function getDefinedChannels(activeGates: Set<number>): DefinedChannel[] {
  const defined: DefinedChannel[] = [];

  for (const channel of BODYGRAPH_CHANNELS) {
    const [g1, g2] = channel.gates;
    if (activeGates.has(g1) && activeGates.has(g2)) {
      defined.push({
        name: channel.name,
        gates: channel.gates,
        centers: channel.centers,
        displayName: channel.displayName,
      });
    }
  }

  return defined;
}

/**
 * Get defined centers (participate in at least one defined channel)
 */
export function getDefinedCenters(definedChannels: DefinedChannel[]): DefinedCenter[] {
  const definedCenterNames = new Set<CenterName>();

  for (const channel of definedChannels) {
    definedCenterNames.add(channel.centers[0]);
    definedCenterNames.add(channel.centers[1]);
  }

  const allCenters: CenterName[] = [
    "Head",
    "Ajna",
    "Throat",
    "G",
    "Heart",
    "Sacral",
    "Spleen",
    "SolarPlexus",
    "Root",
  ];

  return allCenters.map((name) => ({
    name,
    defined: definedCenterNames.has(name),
  }));
}

/**
 * Determine definition type by counting connected components
 */
export function getDefinitionType(
  definedChannels: DefinedChannel[],
  definedCenters: DefinedCenter[]
): DefinitionType {
  const definedCenterNames = definedCenters
    .filter((c) => c.defined)
    .map((c) => c.name);

  if (definedCenterNames.length === 0) {
    return "none";
  }

  // Build adjacency list for defined centers
  const adjacency = new Map<CenterName, Set<CenterName>>();
  for (const name of definedCenterNames) {
    adjacency.set(name, new Set());
  }

  for (const channel of definedChannels) {
    const [c1, c2] = channel.centers;
    if (adjacency.has(c1) && adjacency.has(c2)) {
      adjacency.get(c1)!.add(c2);
      adjacency.get(c2)!.add(c1);
    }
  }

  // Count connected components using BFS
  const visited = new Set<CenterName>();
  let componentCount = 0;

  for (const center of definedCenterNames) {
    if (visited.has(center)) continue;

    componentCount++;
    const queue: CenterName[] = [center];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = adjacency.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }
    }
  }

  switch (componentCount) {
    case 0:
      return "none";
    case 1:
      return "single";
    case 2:
      return "split";
    case 3:
      return "tripleSplit";
    default:
      return "quadSplit";
  }
}

// ============================================================================
// TYPE, STRATEGY, AUTHORITY
// ============================================================================

/**
 * Check if there's a motor-to-throat connection
 */
function hasMotorToThroatConnection(definedChannels: DefinedChannel[]): boolean {
  // Direct motor to throat channels
  const motorToThroat: string[] = [
    "20-34", // Sacral to Throat
    "21-45", // Heart to Throat
    "12-22", // Solar Plexus to Throat
    "35-36", // Solar Plexus to Throat
  ];

  for (const ch of definedChannels) {
    if (motorToThroat.includes(ch.name)) {
      return true;
    }
  }

  // Also check indirect connections through the G center
  // This requires path-finding through defined channels
  // For MVP, we'll check direct connections only
  return false;
}

/**
 * Check if Sacral is connected to Throat (directly or indirectly)
 */
function hasSacralToThroatPath(
  definedChannels: DefinedChannel[],
  definedCenters: DefinedCenter[]
): boolean {
  // Build adjacency for path-finding
  const adjacency = new Map<CenterName, Set<CenterName>>();
  const definedCenterNames = new Set(
    definedCenters.filter((c) => c.defined).map((c) => c.name)
  );

  for (const name of definedCenterNames) {
    adjacency.set(name, new Set());
  }

  for (const channel of definedChannels) {
    const [c1, c2] = channel.centers;
    if (adjacency.has(c1) && adjacency.has(c2)) {
      adjacency.get(c1)!.add(c2);
      adjacency.get(c2)!.add(c1);
    }
  }

  // BFS from Sacral to find Throat
  if (!adjacency.has("Sacral") || !adjacency.has("Throat")) {
    return false;
  }

  const visited = new Set<CenterName>();
  const queue: CenterName[] = ["Sacral"];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === "Throat") return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = adjacency.get(current);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
  }

  return false;
}

/**
 * Determine Human Design Type
 */
export function determineType(
  definedChannels: DefinedChannel[],
  definedCenters: DefinedCenter[]
): HDType {
  const centerMap = new Map(definedCenters.map((c) => [c.name, c.defined]));
  const sacralDefined = centerMap.get("Sacral") ?? false;
  const throatDefined = centerMap.get("Throat") ?? false;

  // Count defined centers
  const definedCount = definedCenters.filter((c) => c.defined).length;

  // Reflector: No defined centers
  if (definedCount === 0) {
    return "Reflector";
  }

  // Generator types: Sacral defined
  if (sacralDefined) {
    // Manifesting Generator: Sacral + connection to Throat
    if (hasSacralToThroatPath(definedChannels, definedCenters)) {
      return "Manifesting Generator";
    }
    return "Generator";
  }

  // Manifestor: Throat defined with motor connection, Sacral undefined
  if (throatDefined && hasMotorToThroatConnection(definedChannels)) {
    return "Manifestor";
  }

  // Projector: Not Reflector, not Generator type, not Manifestor
  return "Projector";
}

/**
 * Determine Strategy based on Type
 */
export function determineStrategy(type: HDType): HDStrategy {
  switch (type) {
    case "Generator":
    case "Manifesting Generator":
      return "Wait to respond";
    case "Projector":
      return "Wait for the invitation";
    case "Manifestor":
      return "Inform and initiate";
    case "Reflector":
      return "Wait a lunar cycle";
  }
}

/**
 * Determine Authority based on defined centers
 */
export function determineAuthority(definedCenters: DefinedCenter[]): HDAuthority {
  const centerMap = new Map(definedCenters.map((c) => [c.name, c.defined]));

  // Priority order
  if (centerMap.get("SolarPlexus")) return "Emotional";
  if (centerMap.get("Sacral")) return "Sacral";
  if (centerMap.get("Spleen")) return "Splenic";
  if (centerMap.get("Heart")) return "Ego";
  if (centerMap.get("G")) return "Self-Projected";
  if (centerMap.get("Ajna") || centerMap.get("Head")) return "Mental";

  // No centers defined (Reflector)
  const anyDefined = definedCenters.some((c) => c.defined);
  if (!anyDefined) return "Lunar";

  return "None";
}

/**
 * Determine Profile from Sun lines
 */
export function determineProfile(
  personalitySunLine: number,
  designSunLine: number
): string {
  return `${personalitySunLine}/${designSunLine}`;
}

// ============================================================================
// MAIN COMPUTATION FUNCTION
// ============================================================================

/**
 * Compute complete Human Design profile for a user
 */
export async function computeHumanDesign(
  birth: BirthData
): Promise<HumanDesignProfile | null> {
  try {
    // 1. Convert birth time to UTC
    const birthUtc = birthToUtcDate(birth);
    const birthIso = birthUtc.toISOString();

    // 2. Fetch natal chart (personality)
    const personalityChart = await fetchChart({
      year: birthUtc.getUTCFullYear(),
      month: birthUtc.getUTCMonth() + 1,
      day: birthUtc.getUTCDate(),
      hour: birthUtc.getUTCHours(),
      minute: birthUtc.getUTCMinutes(),
      latitude: birth.lat,
      longitude: birth.lon,
    });

    if (!personalityChart.ok || !personalityChart.data) {
      console.error("[HD compute] Failed to fetch personality chart");
      return null;
    }

    // 3. Extract personality longitudes and activations
    const personalityLongs = extractLongitudes(personalityChart.data);
    const personalityActivations = longitudesToActivations(personalityLongs);

    // 4. Find design time (88° solar arc prior)
    const designTimeResult = await findDesignTime(
      birthUtc,
      personalityLongs.sun,
      birth.lat,
      birth.lon
    );

    if (!designTimeResult) {
      console.error("[HD compute] Failed to find design time");
      return null;
    }

    // 5. Fetch design chart (use fractional minutes to preserve sub-minute precision)
    const designUtc = new Date(designTimeResult.iso);
    const designChart = await fetchChart({
      year: designUtc.getUTCFullYear(),
      month: designUtc.getUTCMonth() + 1,
      day: designUtc.getUTCDate(),
      hour: designUtc.getUTCHours(),
      minute: getMinuteWithFraction(designUtc),
      latitude: birth.lat,
      longitude: birth.lon,
    });

    if (!designChart.ok || !designChart.data) {
      console.error("[HD compute] Failed to fetch design chart");
      return null;
    }

    // 6. Extract design longitudes and activations
    const designLongs = extractLongitudes(designChart.data);
    const designActivations = longitudesToActivations(designLongs);

    // 7. Calculate defined structures
    const definedGates = getDefinedGates(personalityActivations, designActivations);
    const activeGatesSet = new Set(definedGates);
    const definedChannels = getDefinedChannels(activeGatesSet);
    const definedCenters = getDefinedCenters(definedChannels);
    const definitionType = getDefinitionType(definedChannels, definedCenters);

    // 8. Determine Type, Strategy, Authority, Profile
    const hdType = determineType(definedChannels, definedCenters);
    const strategy = determineStrategy(hdType);
    const authority = determineAuthority(definedCenters);
    const profile = determineProfile(
      personalityActivations.Sun.line,
      designActivations.Sun.line
    );

    // 9. Build final profile
    const hdProfile: HumanDesignProfile = {
      version: HD_VERSION,
      birth: {
        iso: birthIso,
        tz: birth.timezone,
        lat: birth.lat,
        lon: birth.lon,
      },
      design: {
        iso: designTimeResult.iso,
        sunTargetDeg: designTimeResult.sunTargetDeg,
        method: "solarArc88",
      },
      personality: personalityActivations,
      designActivations,
      defined: {
        gates: definedGates,
        channels: definedChannels,
        centers: definedCenters,
        definitionType,
      },
      type: hdType,
      strategy,
      authority,
      profile,
    };

    return hdProfile;
  } catch (err) {
    console.error("[HD compute] Error computing Human Design:", err);
    return null;
  }
}

/**
 * Generate a hash for birth data to detect changes
 */
export function hashBirthData(birth: BirthData): string {
  const data = `${birth.year}|${birth.month}|${birth.day}|${birth.hour}|${birth.minute}|${birth.lat}|${birth.lon}|${birth.timezone}`;
  // Simple hash - in production you might use crypto
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash.toString(16);
}
