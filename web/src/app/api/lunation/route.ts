// src/app/api/lunation/route.ts
import { NextResponse } from "next/server";
import { POST as corePOST } from "../core/route";

/**
 * URA /api/lunation (WRAPPER)
 *
 * This route now delegates computation to /api/core (single source of truth),
 * then adapts the result into a lunation-friendly payload:
 *   { ok, text, input, birthUTC, asOfUTC, lunation }
 *
 * Why:
 * - Prevent drift between /api/core and /api/lunation
 * - Keep older UI/pages stable while we migrate everything to /api/core
 */

// ------------------------------
// Cache (in-memory)
// ------------------------------

const LUNATION_CACHE_VERSION = "lunation:wrapper-over-core:v1";
const LUNATION_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

type CacheEntry = { expiresAt: number; payload: any };
const LUNATION_CACHE: Map<string, CacheEntry> =
  (globalThis as any).__URA_LUNATION_CACHE__ ?? new Map<string, CacheEntry>();
(globalThis as any).__URA_LUNATION_CACHE__ = LUNATION_CACHE;

function getCache(key: string) {
  const hit = LUNATION_CACHE.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    LUNATION_CACHE.delete(key);
    return null;
  }
  return hit.payload;
}

function setCache(key: string, payload: any) {
  if (LUNATION_CACHE.size > 1200) {
    const now = Date.now();
    for (const [k, v] of LUNATION_CACHE) {
      if (now > v.expiresAt) LUNATION_CACHE.delete(k);
      if (LUNATION_CACHE.size <= 950) break;
    }
  }
  LUNATION_CACHE.set(key, {
    expiresAt: Date.now() + LUNATION_CACHE_TTL_MS,
    payload,
  });
}

// ------------------------------
// Helpers
// ------------------------------

function wrap360(deg: number) {
  return ((deg % 360) + 360) % 360;
}

function angleToSign(deg: number) {
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
  const idx = Math.floor(wrap360(deg) / 30);
  return signs[idx] || "Aries";
}

function formatYMD(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatYMDHM(dISO: string) {
  // expects ISO string
  try {
    return new Date(dISO).toISOString().slice(0, 16).replace("T", " ");
  } catch {
    return dISO;
  }
}

function safeDateOnly(isoOrYmd: any): string | null {
  if (typeof isoOrYmd !== "string") return null;
  // already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrYmd)) return isoOrYmd;
  // ISO -> date
  const m = isoOrYmd.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function buildLunationText(core: any) {
  const input = core?.input;
  const birthUTC = core?.birthUTC;
  const asOfUTC = core?.asOfUTC;

  const lun = core?.derived?.lunation;

  const pDate = lun?.progressedDateUTC;
  const pSun = lun?.progressedSunLon;
  const pMoon = lun?.progressedMoonLon;
  const sep = lun?.separation;
  const phase = lun?.phase;
  const sub = lun?.subPhase;

  const lines: string[] = [];
  lines.push("URA • Progressed Lunation Model");
  lines.push("");

  if (input?.birth_datetime && input?.tz_offset) {
    lines.push(`Birth (local): ${input.birth_datetime}  tz_offset ${input.tz_offset}`);
  }
  if (birthUTC) lines.push(`Birth (UTC):   ${formatYMDHM(birthUTC)}`);

  // Prefer the original as_of_date if present, else derive from asOfUTC
  const asOfYMD = safeDateOnly(input?.as_of_date) ?? safeDateOnly(asOfUTC);
  if (asOfYMD) lines.push(`As-of (UTC):   ${asOfYMD}`);
  else if (asOfUTC) lines.push(`As-of (UTC):   ${formatYMDHM(asOfUTC).slice(0, 10)}`);

  if (pDate) {
    lines.push("");
    lines.push(`Progressed date (UTC): ${formatYMDHM(pDate)}`);
  }

  if (typeof pSun === "number" && typeof pMoon === "number") {
    lines.push("");
    lines.push(`Progressed Sun lon:  ${wrap360(pSun).toFixed(2)}° (${angleToSign(pSun)})`);
    lines.push(`Progressed Moon lon: ${wrap360(pMoon).toFixed(2)}° (${angleToSign(pMoon)})`);
  }

  if (typeof sep === "number") {
    lines.push(`Separation: ${wrap360(sep).toFixed(2)}°`);
  }

  if (phase) {
    lines.push("");
    lines.push(`Current phase: ${String(phase)}`);
  }

  if (sub?.label) {
    lines.push(
      `Current sub-phase: ${sub.label} (segment ${sub.segment ?? "?"}/${sub.total ?? "?"})`
    );
    if (typeof sub.within === "number") {
      lines.push(`Degrees into phase: ${sub.within.toFixed(2)}°`);
    }
  }

  const boundaries = Array.isArray(lun?.boundaries) ? lun.boundaries : null;
  if (boundaries && boundaries.length) {
    lines.push("");
    lines.push("Current cycle boundaries:");
    for (const b of boundaries) {
      const deg = typeof b?.deg === "number" ? b.deg : null;
      const label = typeof b?.label === "string" ? b.label : "Boundary";
      const dateUTC = safeDateOnly(b?.dateUTC) ?? null;

      if (deg == null || !dateUTC) continue;
      lines.push(`- ${label}: ${dateUTC}`);
    }
  }

  const nextNM = safeDateOnly(lun?.nextNewMoonUTC);
  if (nextNM) {
    lines.push(`- Next New Moon (360°): ${nextNM}`);
  }

  return lines.join("\n");
}

// ------------------------------
// Route handler
// ------------------------------

export async function POST(req: Request) {
  try {
    // Read raw once (streams are one-shot)
    const raw = await req.text();
    const contentType = req.headers.get("content-type") || "text/plain";

    const cacheKey = `${LUNATION_CACHE_VERSION}|ct=${contentType}|${raw}`;
    const cached = getCache(cacheKey);
    if (cached) return NextResponse.json(cached);

    // Delegate to /api/core
    const coreReq = new Request("http://local/api/core", {
      method: "POST",
      headers: { "content-type": contentType },
      body: raw,
    });

    const coreRes = await corePOST(coreReq);
    const coreJson = await coreRes.json().catch(() => null);

    if (!coreJson || coreJson?.ok === false) {
      const errMsg =
        coreJson?.error || `core returned non-ok (status ${coreRes.status || "unknown"})`;
      return NextResponse.json({ ok: false, error: errMsg }, { status: 400 });
    }

    const lun = coreJson?.derived?.lunation;
    if (!lun) {
      return NextResponse.json(
        { ok: false, error: "core response missing derived.lunation" },
        { status: 400 }
      );
    }

    const payload = {
      ok: true,
      text: buildLunationText(coreJson),
      input: coreJson?.input,
      birthUTC: coreJson?.birthUTC,
      asOfUTC: coreJson?.asOfUTC,
      lunation: lun,
    };

    setCache(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "unknown error" },
      { status: 400 }
    );
  }
}
