// src/app/api/human-design/debug/route.ts
// Dev-only debug endpoint for Human Design computation diagnostics
// Returns 404 in production

import { NextRequest, NextResponse } from "next/server";
import { fetchChart } from "@/lib/astro/client";
import {
  normalizeDeg,
  getGateAndLine,
  gateForDeg,
  MANDALA_OFFSET,
  LINE_SPAN,
} from "@/lib/humandesign/gatesByDegree";
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
} from "@/lib/humandesign/compute";
import type { BirthData } from "@/lib/humandesign/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mappingDebug(rawLon: number) {
  const norm = normalizeDeg(rawLon);
  const shifted = normalizeDeg(rawLon + MANDALA_OFFSET);
  const range = gateForDeg(rawLon); // offset applied internally
  const result = getGateAndLine(rawLon);
  const degIntoGate = range ? shifted - range.startDeg : null;
  const lineFloat = degIntoGate !== null ? degIntoGate / LINE_SPAN : null;

  return {
    rawLongitude: rawLon,
    normalizedLongitude: norm,
    shiftedLongitude: shifted,
    mandalaOffset: MANDALA_OFFSET,
    gate: result?.gate ?? null,
    line: result?.line ?? null,
    gateStartDeg: range?.startDeg ?? null,
    gateEndDeg: range?.endDeg ?? null,
    degIntoGate,
    lineFloat,
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Only available in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sp = req.nextUrl.searchParams;
  const year = Number(sp.get("year") || "1990");
  const month = Number(sp.get("month") || "1");
  const day = Number(sp.get("day") || "24");
  const hour = Number(sp.get("hour") || "1");
  const minute = Number(sp.get("minute") || "39");
  const lat = Number(sp.get("lat") || "36.5860");
  const lon = Number(sp.get("lon") || "-79.3930");
  const timezone = sp.get("tz") || "America/New_York";

  const birth: BirthData = { year, month, day, hour, minute, lat, lon, timezone };

  try {
    // 1. UTC conversion
    const birthUtc = birthToUtcDate(birth);

    // 2. Personality chart
    const pChart = await fetchChart({
      year: birthUtc.getUTCFullYear(),
      month: birthUtc.getUTCMonth() + 1,
      day: birthUtc.getUTCDate(),
      hour: birthUtc.getUTCHours(),
      minute: birthUtc.getUTCMinutes(),
      latitude: lat,
      longitude: lon,
    });

    if (!pChart.ok || !pChart.data) {
      return NextResponse.json({ error: "Failed to fetch personality chart", details: pChart.error }, { status: 500 });
    }

    const pLongs = extractLongitudes(pChart.data);
    const pActivations = longitudesToActivations(pLongs);

    // 3. Design time
    const designResult = await findDesignTime(birthUtc, pLongs.sun, lat, lon);
    if (!designResult) {
      return NextResponse.json({ error: "Failed to find design time" }, { status: 500 });
    }

    const designUtc = new Date(designResult.iso);
    const daysBeforeBirth = (birthUtc.getTime() - designUtc.getTime()) / (1000 * 60 * 60 * 24);

    // 4. Design chart
    const dChart = await fetchChart({
      year: designUtc.getUTCFullYear(),
      month: designUtc.getUTCMonth() + 1,
      day: designUtc.getUTCDate(),
      hour: designUtc.getUTCHours(),
      minute: designUtc.getUTCMinutes(),
      latitude: lat,
      longitude: lon,
    });

    if (!dChart.ok || !dChart.data) {
      return NextResponse.json({ error: "Failed to fetch design chart" }, { status: 500 });
    }

    const dLongs = extractLongitudes(dChart.data);
    const dActivations = longitudesToActivations(dLongs);

    // Fetch design Sun longitude for verification
    const designSunLon = dChart.data.planets.sun.lon;
    const angularDiff = normalizeDeg(pLongs.sun - designSunLon);

    // 5. Defined structures
    const definedGates = getDefinedGates(pActivations, dActivations);
    const activeGatesSet = new Set(definedGates);
    const definedChannels = getDefinedChannels(activeGatesSet);
    const definedCenters = getDefinedCenters(definedChannels);
    const definitionType = getDefinitionType(definedChannels, definedCenters);

    const hdType = determineType(definedChannels, definedCenters);
    const strategy = determineStrategy(hdType);
    const authority = determineAuthority(definedCenters);
    const profile = determineProfile(pActivations.Sun.line, dActivations.Sun.line);

    // Earth longitudes
    const pEarthLon = normalizeDeg(pLongs.sun + 180);
    const dEarthLon = normalizeDeg(dLongs.sun + 180);

    return NextResponse.json({
      hdVersion: HD_VERSION,
      input: {
        birthLocal: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        timezone,
        lat,
        lon,
        birthUTC: birthUtc.toISOString(),
      },
      personalityChart: {
        sunLon: pLongs.sun,
        earthLon: pEarthLon,
        moonLon: pLongs.moon,
        mercuryLon: pLongs.mercury,
        venusLon: pLongs.venus,
        marsLon: pLongs.mars,
        jupiterLon: pLongs.jupiter,
        saturnLon: pLongs.saturn,
        uranusLon: pLongs.uranus,
        neptuneLon: pLongs.neptune,
        plutoLon: pLongs.pluto,
        northNodeLon: pLongs.northNode,
        southNodeLon: pLongs.southNode,
      },
      designTime: {
        designTimeUTC: designResult.iso,
        daysBeforeBirth: Math.round(daysBeforeBirth * 100) / 100,
        targetSunLongitude: designResult.sunTargetDeg,
        transitingSunLongitude: designSunLon,
        angularDiff: Math.round(angularDiff * 1000) / 1000,
      },
      mappingDebug: {
        personalitySun: mappingDebug(pLongs.sun),
        personalityEarth: mappingDebug(pEarthLon),
        designSun: mappingDebug(dLongs.sun),
        designEarth: mappingDebug(dEarthLon),
      },
      computed: {
        personalityActivations: Object.fromEntries(
          Object.entries(pActivations).map(([k, v]) => [k, `${v.gate}.${v.line}`])
        ),
        designActivations: Object.fromEntries(
          Object.entries(dActivations).map(([k, v]) => [k, `${v.gate}.${v.line}`])
        ),
        activeGates: {
          personality: Object.fromEntries(
            Object.entries(pActivations).map(([k, v]) => [k, v.gate])
          ),
          design: Object.fromEntries(
            Object.entries(dActivations).map(([k, v]) => [k, v.gate])
          ),
          combined: definedGates,
        },
        completedChannels: definedChannels.map((c) => ({
          name: c.name,
          displayName: c.displayName,
          centers: c.centers,
        })),
        definedCenters: definedCenters.filter((c) => c.defined).map((c) => c.name),
        type: hdType,
        authority,
        strategy,
        profile,
        definitionType,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
