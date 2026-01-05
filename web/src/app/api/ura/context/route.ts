// src/app/api/ura/context/route.ts

import { NextResponse } from "next/server";
import { fetchSunMoonLongitudesUTC } from "@/lib/calendar/astro";
import { solarPhaseFromSunLon } from "@/lib/ura/solarPhase";
import { metaForPhase } from "@/lib/ura/ontology";

function parseAsOf(searchParams: URLSearchParams) {
  const asOf = searchParams.get("asOf");
  if (!asOf) return new Date();
  const d = new Date(asOf);
  return Number.isFinite(d.getTime()) ? d : new Date();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const asOf = parseAsOf(url.searchParams);

    const { sunLon, moonLon } = await fetchSunMoonLongitudesUTC(asOf);

    const solar = solarPhaseFromSunLon(sunLon);
    const meta = metaForPhase(solar.phaseId);

    return NextResponse.json({
      ok: true,
      asOfUTC: asOf.toISOString(),
      astro: {
        sunLon,
        moonLon,
      },
      solar: {
        phaseId: solar.phaseId,
        phaseIndex0: solar.phaseIndex0,
        degIntoPhase: solar.degIntoPhase,
        progress01: solar.progress01,
        startDeg: solar.startDeg,
        endDeg: solar.endDeg,
      },
      ontology: meta, // may be null if something is off
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
