// web/src/app/api/lunation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withComputeRateLimit } from "@/lib/withRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/lunation
 * - Returns lunation + derived summary by proxying into /api/core.
 *
 * OPTION A (resolved):
 * - Accept BOTH contracts:
 *   A) Legacy/proxy: { birth_datetime, tz_offset, as_of_date, lat?, lon? }
 *   B) URA structured: { year, month, day, hour, minute, lat/lon, timezone, asOfDate }
 * - Normalize input -> send JSON to /api/core (which already supports both).
 */

function getAppBaseUrlFromReq(req: NextRequest) {
  const url = new URL(req.url);

  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    url.host;

  const proto =
    req.headers.get("x-forwarded-proto") ||
    url.protocol.replace(":", "") ||
    "http";

  return `${proto}://${host}`.replace(/\/$/, "");
}

function angleToSign(lon: number) {
  const signs = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];
  const x = ((lon % 360) + 360) % 360;
  return signs[Math.floor(x / 30)] ?? "—";
}

function buildLunationText(core: any) {
  const input = core?.input;
  const lun = core?.derived?.lunation;

  const lines: string[] = [];
  lines.push("URA • Progressed Lunation Model");
  lines.push("");

  if (input?.birth_datetime && input?.tz_offset) {
    lines.push(`Birth (local): ${input.birth_datetime}  tz_offset ${input.tz_offset}`);
  }
  if (core?.birthUTC) lines.push(`Birth (UTC):   ${String(core.birthUTC).replace(".000Z", "Z")}`);
  if (input?.as_of_date) lines.push(`As-of (UTC):   ${input.as_of_date}`);
  lines.push("");

  if (lun?.progressedDateUTC) lines.push(`Progressed date (UTC): ${lun.progressedDateUTC.replace(".000Z", "Z")}`);
  lines.push("");

  const pSun = lun?.progressedSunLon;
  const pMoon = lun?.progressedMoonLon;
  if (typeof pSun === "number") lines.push(`Progressed Sun lon:  ${pSun.toFixed(2)}° (${angleToSign(pSun)})`);
  if (typeof pMoon === "number") lines.push(`Progressed Moon lon: ${pMoon.toFixed(2)}° (${angleToSign(pMoon)})`);

  if (typeof lun?.separation === "number") lines.push(`Separation: ${lun.separation.toFixed(2)}°`);
  lines.push("");

  if (lun?.phase) lines.push(`Current phase: ${lun.phase}`);
  if (lun?.subPhase?.label) {
    const seg =
      lun?.subPhase?.segment && lun?.subPhase?.total ? ` (segment ${lun.subPhase.segment}/${lun.subPhase.total})` : "";
    lines.push(`Current sub-phase: ${lun.subPhase.label}${seg}`);
  }
  if (typeof lun?.subPhase?.within === "number") lines.push(`Degrees into phase: ${lun.subPhase.within.toFixed(2)}°`);

  lines.push("");
  lines.push("Current cycle boundaries:");
  const boundaries = Array.isArray(lun?.boundaries) ? lun.boundaries : [];
  for (const b of boundaries) {
    if (!b?.label || !b?.dateUTC) continue;
    lines.push(`- ${b.label}: ${b.dateUTC}`);
  }
  if (lun?.nextNewMoonUTC) lines.push(`- Next New Moon (360°): ${lun.nextNewMoonUTC}`);

  return lines.join("\n");
}

async function postToCore(req: NextRequest, body: string, contentType: string) {
  const base = getAppBaseUrlFromReq(req);

  const r = await fetch(`${base}/api/core`, {
    method: "POST",
    headers: {
      "content-type": contentType || "text/plain",
      "cache-control": "no-store",
    },
    body,
    cache: "no-store",
  });

  const core = await r.json().catch(async () => {
    const raw = await r.text().catch(() => "");
    return { ok: false, error: "Non-JSON response from /api/core", raw };
  });

  return { r, core };
}

// ---------------------------
// Normalization helpers
// ---------------------------

function toNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeToCorePayload(obj: any): { ok: true; payload: any } | { ok: false; error: string } {
  if (!obj || typeof obj !== "object") {
    return { ok: false, error: "Invalid JSON body." };
  }

  // A) Legacy/proxy contract
  const hasProxy =
    typeof obj.birth_datetime === "string" &&
    typeof obj.as_of_date === "string" &&
    (typeof obj.tz_offset === "string" || typeof obj.timezone === "string");

  if (hasProxy) {
    const lat = toNum(obj.lat ?? obj.latitude);
    const lon = toNum(obj.lon ?? obj.longitude);

    // Core requires lat/lon (because it also computes asc-year).
    if (lat == null || lon == null) {
      return { ok: false, error: "Missing lat/lon (required for core because asc-year uses ascendant)." };
    }

    return {
      ok: true,
      payload: {
        birth_datetime: obj.birth_datetime,
        tz_offset: typeof obj.tz_offset === "string" ? obj.tz_offset : undefined,
        timezone: typeof obj.timezone === "string" ? obj.timezone : undefined,
        as_of_date: obj.as_of_date,
        lat,
        lon,
      },
    };
  }

  // B) URA structured contract (what ensureProfileCaches sends)
  const year = toNum(obj.year);
  const month = toNum(obj.month);
  const day = toNum(obj.day);
  const hour = toNum(obj.hour);
  const minute = toNum(obj.minute);

  const lat = toNum(obj.lat ?? obj.latitude);
  const lon = toNum(obj.lon ?? obj.longitude);
  const timezone = typeof obj.timezone === "string" ? obj.timezone : null;

  // allow asOfDate (local day key) or as_of_date (legacy)
  const asOfDate =
    (typeof obj.asOfDate === "string" && obj.asOfDate) ||
    (typeof obj.as_of_date === "string" && obj.as_of_date) ||
    null;

  // In your core normalizer:
  // - as_of_date expects "YYYY-MM-DD"
  // - if missing, core defaults to today UTC
  const as_of_date =
    asOfDate && /^\d{4}-\d{2}-\d{2}$/.test(asOfDate)
      ? asOfDate
      : undefined;

  if ([year, month, day, hour, minute].some((x) => x == null)) {
    return { ok: false, error: "Missing birth inputs (year/month/day/hour/minute)." };
  }
  if (lat == null || lon == null) {
    return { ok: false, error: "Missing lat/lon (required for core because asc-year uses ascendant)." };
  }
  if (!timezone) {
    return { ok: false, error: "Missing timezone." };
  }

  return {
    ok: true,
    payload: {
      year,
      month,
      day,
      hour,
      minute,
      lat,
      lon,
      timezone,
      ...(as_of_date ? { as_of_date } : {}),
      // NOTE: we do NOT need tz_offset here because core can compute it from timezone + birth local datetime
    },
  };
}

/**
 * ✅ GET support
 * - If query params exist, we proxy them into /api/core by sending a JSON body.
 * - If no params, we return a safe minimal payload so callers don't break.
 */
async function handleGet(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const birth_datetime = url.searchParams.get("birth_datetime");
    const tz_offset = url.searchParams.get("tz_offset");
    const as_of_date = url.searchParams.get("as_of_date");
    const timezone = url.searchParams.get("timezone");
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");

    if (!birth_datetime && !tz_offset && !as_of_date && !timezone && !lat && !lon) {
      return NextResponse.json(
        {
          ok: true,
          mode: "empty",
          text: "URA • Progressed Lunation Model\n\n(no input provided)",
          summary: null,
          lunation: null,
          input: null,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    const payload: any = {};
    if (birth_datetime) payload.birth_datetime = birth_datetime;
    if (tz_offset) payload.tz_offset = tz_offset;
    if (timezone) payload.timezone = timezone;
    if (as_of_date) payload.as_of_date = as_of_date;
    if (lat != null) payload.lat = Number(lat);
    if (lon != null) payload.lon = Number(lon);

    const normalized = normalizeToCorePayload(payload);
    if (!normalized.ok) {
      return NextResponse.json(
        { ok: false, error: normalized.error },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { r, core } = await postToCore(req, JSON.stringify(normalized.payload), "application/json");

    if (!r.ok || core?.ok === false) {
      return NextResponse.json(
        { ok: false, error: core?.error || `core failed (${r.status})`, core },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        text: buildLunationText(core),
        summary: core?.derived?.summary ?? null,
        lunation: core?.derived?.lunation ?? null,
        input: core?.input ?? normalized.payload ?? null,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}

/**
 * ✅ POST behavior preserved, now with normalization for both contracts.
 */
async function handlePost(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const raw = await req.text();

    // Prefer JSON when it looks like JSON
    const trimmed = raw.trim();
    const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");

    if (contentType.includes("application/json") || looksJson) {
      const obj = JSON.parse(raw || "{}");
      const normalized = normalizeToCorePayload(obj);

      if (!normalized.ok) {
        return NextResponse.json(
          { ok: false, error: normalized.error },
          { status: 400, headers: { "Cache-Control": "no-store" } }
        );
      }

      const { r, core } = await postToCore(req, JSON.stringify(normalized.payload), "application/json");

      if (!r.ok || core?.ok === false) {
        return NextResponse.json(
          { ok: false, error: core?.error || `core failed (${r.status})`, core },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        );
      }

      return NextResponse.json(
        {
          ok: true,
          text: buildLunationText(core),
          summary: core?.derived?.summary ?? null,
          lunation: core?.derived?.lunation ?? null,
          input: core?.input ?? normalized.payload ?? null,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    // If someone posts plain text, keep old proxy behavior (go straight to core)
    const { r, core } = await postToCore(req, raw, contentType || "text/plain");

    if (!r.ok || core?.ok === false) {
      return NextResponse.json(
        { ok: false, error: core?.error || `core failed (${r.status})`, core },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        text: buildLunationText(core),
        summary: core?.derived?.summary ?? null,
        lunation: core?.derived?.lunation ?? null,
        input: core?.input ?? null,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export const GET = withComputeRateLimit(handleGet);
export const POST = withComputeRateLimit(handlePost);
