// src/app/api/asc-year/route.ts
import { NextResponse } from "next/server";

function normDeg(v: number) {
  const x = v % 360;
  return x < 0 ? x + 360 : x;
}

function safeNum(v: any) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function degDeltaForward(fromLon: number, toLon: number) {
  const a = normDeg(fromLon);
  const b = normDeg(toLon);
  const d = b - a;
  return d >= 0 ? d : d + 360;
}

function estimateDaysUntil(deltaDeg: number) {
  // avg Sun speed ~0.9856°/day (good enough for a UI ETA)
  return deltaDeg / 0.9856;
}

const SEASONS = ["Spring", "Summer", "Fall", "Winter"] as const;

// 8 phases, 45° each
function phaseIndexFromCyclePos(cyclePos: number) {
  const idx = Math.floor(normDeg(cyclePos) / 45); // 0..7
  return Math.max(0, Math.min(7, idx));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Expected payload (same as /seasons): birth + as_of + tz + lat/lon or resolved
    // This route should already be working in your app; we’re just enhancing output.

    // ---- Your existing pipeline should compute these at minimum:
    // natalAscLon, transitingSunLon, cyclePosition
    // and maybe season/modality from prior model
    //
    // NOTE: Since I don’t have your full current code here, preserve your existing
    // computations above this line and then plug these derived fields in right before returning.
    //
    // For this template, we assume you already computed:
    const natalAscLon = safeNum(body?.natalAscLon) ?? null; // (placeholder if your code sets it elsewhere)
    const transitingSunLon = safeNum(body?.transitingSunLon) ?? null; // (placeholder)
    const cyclePosition = safeNum(body?.cyclePosition) ?? null; // (placeholder)

    // ⚠️ IMPORTANT:
    // Replace the 3 placeholders above with your existing actual variables.
    // Example (if your current code has these already):
    // const natalAscLon = result.natalAscLon;
    // const transitingSunLon = result.transitingSunLon;
    // const cyclePosition = result.cyclePosition;

    if (natalAscLon == null || transitingSunLon == null || cyclePosition == null) {
      return NextResponse.json(
        { ok: false, error: "asc-year missing natalAscLon/transitingSunLon/cyclePosition" },
        { status: 400 }
      );
    }

    // --- 45° Phase model ---
    const cyclePos = normDeg(cyclePosition);
    const phaseIndex = phaseIndexFromCyclePos(cyclePos); // 0..7
    const phaseLabel = `P${phaseIndex + 1}`;
    const phaseDegInto = cyclePos - phaseIndex * 45; // 0..45
    const phaseProgress01 = phaseDegInto / 45;

    const nextPhaseIndex = (phaseIndex + 1) % 8;
    const nextPhaseLabel = `P${nextPhaseIndex + 1}`;

    // next boundary is the next multiple of 45° from ASC anchor (in cycle-space)
    // Convert that to an ecliptic longitude boundary:
    // boundaryLon = natalAscLon + boundaryCycleDeg
    const nextBoundaryCycleDeg = nextPhaseIndex * 45; // 0..315
    const nextPhaseBoundaryLon = normDeg(natalAscLon + nextBoundaryCycleDeg);

    const deltaToNext = degDeltaForward(transitingSunLon, nextPhaseBoundaryLon);
    const daysUntilNextPhase = estimateDaysUntil(deltaToNext);

    // Seasons still operate as 0–90 quarters (2 phases per season)
    const seasonIndex = Math.floor(phaseIndex / 2); // 0..3
    const season = SEASONS[seasonIndex] ?? "Spring";

    // Where are we inside the season’s 90° arc?
    const seasonDegInto = cyclePos % 90; // 0..90
    const seasonProgress01 = seasonDegInto / 90;

    // --- Return shape: keep your existing fields, add the new ones ---
    const ascYear = {
      // keep any existing output you already provide:
      natalAscLon,
      transitingSunLon,
      cyclePosition: cyclePos,

      // 8-phase ontology
      phaseIndex,
      phaseLabel,
      phaseDegInto,
      phaseProgress01,
      nextPhaseLabel,
      nextPhaseBoundaryLon,
      daysUntilNextPhase,

      // season arc (still valid)
      season,
      seasonDegInto,
      seasonProgress01,
    };

    return NextResponse.json({ ok: true, ascYear });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

