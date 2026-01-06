// src/app/api/asc-year/route.ts
import { NextResponse } from "next/server";

function norm360(v: number) {
  const x = v % 360;
  return x < 0 ? x + 360 : x;
}

function safeNum(v: any): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function degDeltaForward(fromLon: number, toLon: number) {
  const a = norm360(fromLon);
  const b = norm360(toLon);
  const d = b - a;
  return d >= 0 ? d : d + 360;
}

function estimateDaysUntil(deltaDeg: number) {
  // avg Sun speed ~0.9856°/day
  return deltaDeg / 0.9856;
}

const SEASONS = ["Spring", "Summer", "Fall", "Winter"] as const;
const MODALITIES = ["Cardinal", "Fixed", "Mutable"] as const;

// 8 phases, 45° each
function phaseIndexFromCyclePos45(cyclePosDeg: number) {
  const idx = Math.floor(norm360(cyclePosDeg) / 45); // 0..7
  return Math.max(0, Math.min(7, idx));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as any;
    if (!body) {
      return NextResponse.json({ ok: false, error: "Missing JSON body." }, { status: 400 });
    }

    // ✅ Prefer authoritative inputs from caches:
    // - natalAscLon should come from cached natal chart (correct, Scorpio ~13° in your case)
    // - transitingSunLon should come from lunation summary (as-of Sun lon)
    const natalAscLon = safeNum(body?.natalAscLon);
    const transitingSunLon =
      safeNum(body?.transitingSunLon) ??
      safeNum(body?.asOfSunLon) ??
      safeNum(body?.sunLon) ??
      safeNum(body?.transitSunLon);

    if (natalAscLon == null || transitingSunLon == null) {
      return NextResponse.json(
        {
          ok: false,
          error: "asc-year missing natalAscLon/transitingSunLon",
          got: { natalAscLon, transitingSunLon },
        },
        { status: 400 }
      );
    }

    // ✅ core math (this is the “truth” for Asc-Year orientation)
    const cyclePositionDeg = norm360(transitingSunLon - natalAscLon);

    // ---- Phase 45° model ----
    const phaseIndex = phaseIndexFromCyclePos45(cyclePositionDeg); // 0..7
    const phaseId = phaseIndex + 1; // 1..8
    const phaseLabel = `Phase ${phaseId}`;
    const phaseDegInto = cyclePositionDeg - phaseIndex * 45; // 0..45
    const phaseProgress01 = phaseDegInto / 45;

    const nextPhaseIndex = (phaseIndex + 1) % 8;
    const nextPhaseId = nextPhaseIndex + 1;
    const nextPhaseLabel = `Phase ${nextPhaseId}`;

    // next boundary in cycle space: (nextPhaseIndex * 45)
    const nextBoundaryCycleDeg = nextPhaseIndex * 45; // 0..315
    const nextPhaseBoundaryLon = norm360(natalAscLon + nextBoundaryCycleDeg);

    const deltaToNext = degDeltaForward(transitingSunLon, nextPhaseBoundaryLon);
    const daysUntilNextPhase = estimateDaysUntil(deltaToNext);

    // ---- Season + Modality (12 segments: 4 seasons * 3 modalities) ----
    // Seasons: 0–90 Spring, 90–180 Summer, 180–270 Fall, 270–360 Winter
    const seasonIndex = Math.floor(cyclePositionDeg / 90); // 0..3
    const season = SEASONS[Math.max(0, Math.min(3, seasonIndex))];

    const withinSeasonDeg = cyclePositionDeg % 90; // 0..90
    const seasonProgress01 = withinSeasonDeg / 90;

    // Modality segments within each 90° season: 0–30 Cardinal, 30–60 Fixed, 60–90 Mutable
    const modalityIndex = Math.floor(withinSeasonDeg / 30); // 0..2
    const modality = MODALITIES[Math.max(0, Math.min(2, modalityIndex))];

    const withinModalityDeg = withinSeasonDeg % 30; // 0..30
    const modalityProgress01 = withinModalityDeg / 30;

    return NextResponse.json({
      ok: true,
      ascYear: {
        natalAscLon,
        transitingSunLon,

        cyclePositionDeg,

        // 8×45°
        phaseIndex, // 0..7
        phaseId, // 1..8
        phaseLabel,
        phaseDegInto,
        phaseProgress01,
        nextPhaseLabel,
        nextPhaseBoundaryLon,
        daysUntilNextPhase,

        // 4×90 + 3×30
        season,
        seasonDegInto: withinSeasonDeg,
        seasonProgress01,

        modality,
        degreesIntoModality: withinModalityDeg,
        modalityProgress01,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
