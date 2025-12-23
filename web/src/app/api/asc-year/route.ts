// src/app/api/asc-year/route.ts
import { NextResponse } from "next/server";
import { POST as corePOST } from "../core/route";

/**
 * URA /api/asc-year (WRAPPER)
 *
 * This route now delegates computation to /api/core (single source of truth),
 * then adapts the result into the legacy /api/asc-year response shape:
 *   { ok, text, input, birthUTC, asOfUTC, natal, transit, ascYear }
 *
 * Why:
 * - Prevent drift between /api/core, /api/lunation, /api/asc-year
 * - Keep older UI/pages stable while we migrate everything to /api/core
 */

// ------------------------------
// Cache (in-memory)
// ------------------------------

const ASCYEAR_CACHE_VERSION = "asc-year:wrapper-over-core:v1";
const ASCYEAR_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

type CacheEntry = { expiresAt: number; payload: any };
const ASCYEAR_CACHE: Map<string, CacheEntry> =
  (globalThis as any).__URA_ASCYEAR_CACHE__ ?? new Map<string, CacheEntry>();
(globalThis as any).__URA_ASCYEAR_CACHE__ = ASCYEAR_CACHE;

function getCache(key: string) {
  const hit = ASCYEAR_CACHE.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    ASCYEAR_CACHE.delete(key);
    return null;
  }
  return hit.payload;
}

function setCache(key: string, payload: any) {
  if (ASCYEAR_CACHE.size > 1200) {
    const now = Date.now();
    for (const [k, v] of ASCYEAR_CACHE) {
      if (now > v.expiresAt) ASCYEAR_CACHE.delete(k);
      if (ASCYEAR_CACHE.size <= 950) break;
    }
  }
  ASCYEAR_CACHE.set(key, {
    expiresAt: Date.now() + ASCYEAR_CACHE_TTL_MS,
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

function formatYMDHM(dISO: string) {
  // expects an ISO string
  try {
    return new Date(dISO).toISOString().slice(0, 16).replace("T", " ");
  } catch {
    return dISO;
  }
}

function bodyLon(core: any, which: string): number | null {
  const v = core?.[which]?.bodies?.[which]?.lon;
  if (typeof v === "number") return wrap360(v);
  // fallback in case caller passes natal/asOf objects differently
  const v2 = core?.bodies?.[which]?.lon;
  if (typeof v2 === "number") return wrap360(v2);
  return null;
}

function pickLon(coreNatal: any, key: string): number | null {
  const v = coreNatal?.bodies?.[key]?.lon;
  if (typeof v === "number") return wrap360(v);
  return null;
}

function computeSouthNode(north: number | null, south: number | null) {
  if (typeof south === "number") return wrap360(south);
  if (typeof north === "number") return wrap360(north + 180);
  return null;
}

function buildAscYearText(core: any) {
  const input = core?.input;
  const birthUTC = core?.birthUTC;
  const asOfUTC = core?.asOfUTC;

  const natal = core?.natal;
  const asOf = core?.asOf;
  const ascYear = core?.derived?.ascYear;

  const natalAsc = typeof natal?.ascendant === "number" ? wrap360(natal.ascendant) : null;
  const natalMc = typeof natal?.mc === "number" ? wrap360(natal.mc) : null;

  const natalSun = pickLon(natal, "sun");
  const natalMoon = pickLon(natal, "moon");

  const tSun = pickLon(asOf, "sun");

  const lines: string[] = [];
  lines.push("URA • Ascendant Year Cycle");
  lines.push("");

  if (input?.birth_datetime && input?.tz_offset) {
    lines.push(`Birth (local): ${input.birth_datetime}  tz_offset ${input.tz_offset}`);
  }
  if (birthUTC) lines.push(`Birth (UTC):   ${formatYMDHM(birthUTC)}`);
  if (input?.as_of_date) lines.push(`As-of (UTC):   ${input.as_of_date} 00:00`);
  else if (asOfUTC) lines.push(`As-of (UTC):   ${formatYMDHM(asOfUTC).slice(0, 10)} 00:00`);

  if (typeof natalAsc === "number") {
    lines.push("");
    lines.push(`Natal ASC:  ${natalAsc.toFixed(2)}° (${angleToSign(natalAsc)})`);
  }
  if (typeof natalMc === "number") {
    lines.push(`Natal MC:   ${natalMc.toFixed(2)}° (${angleToSign(natalMc)})`);
  }
  if (typeof natalSun === "number") {
    lines.push(`Natal Sun:  ${natalSun.toFixed(2)}° (${angleToSign(natalSun)})`);
  }
  if (typeof natalMoon === "number") {
    lines.push(`Natal Moon: ${natalMoon.toFixed(2)}° (${angleToSign(natalMoon)})`);
  }

  // Optional bodies (print only if present)
  const optional: Array<[string, number | null]> = [
    ["Natal Mercury", pickLon(natal, "mercury")],
    ["Natal Venus", pickLon(natal, "venus")],
    ["Natal Mars", pickLon(natal, "mars")],
    ["Natal Jupiter", pickLon(natal, "jupiter")],
    ["Natal Saturn", pickLon(natal, "saturn")],
    ["Natal Uranus", pickLon(natal, "uranus")],
    ["Natal Neptune", pickLon(natal, "neptune")],
    ["Natal Pluto", pickLon(natal, "pluto")],
    ["Natal Chiron", pickLon(natal, "chiron")],
    ["Natal North Node", pickLon(natal, "northNode")],
    ["Natal South Node", pickLon(natal, "southNode")],
  ];
  const anyOptional = optional.some(([, v]) => typeof v === "number");
  if (anyOptional) {
    lines.push("");
    for (const [label, v] of optional) {
      if (typeof v !== "number") continue;
      lines.push(`${label}: ${v.toFixed(2)}° (${angleToSign(v)})`);
    }
  }

  if (typeof tSun === "number") {
    lines.push("");
    lines.push(`Transiting Sun: ${tSun.toFixed(2)}° (${angleToSign(tSun)})`);
  }

  if (ascYear) {
    lines.push("");
    if (typeof ascYear?.cyclePosition === "number") {
      lines.push(`Cycle position (Sun from ASC): ${wrap360(ascYear.cyclePosition).toFixed(2)}°`);
    }
    if (ascYear?.season) lines.push(`Season: ${ascYear.season}`);
    if (ascYear?.modalitySegment) lines.push(`Modality: ${ascYear.modalitySegment}`);
    if (typeof ascYear?.degreesIntoModality === "number") {
      lines.push(`Degrees into modality: ${ascYear.degreesIntoModality.toFixed(2)}°`);
    }

    const b = ascYear?.boundariesLongitude;
    if (b && typeof b === "object") {
      lines.push("");
      lines.push("Boundaries (longitude, 30°):");
      for (let i = 0; i <= 12; i++) {
        const key = `deg${i * 30}`;
        const val = b[key];
        if (typeof val === "number") {
          const label = `${i * 30}°`;
          lines.push(`- ${label.padEnd(4, " ")} ${wrap360(val).toFixed(2)}°`);
        }
      }
    }
  }

  return lines.join("\n");
}

// ------------------------------
// Route handler
// ------------------------------

export async function POST(req: Request) {
  try {
    // Read the raw body once (streams can’t be re-read)
    const raw = await req.text();
    const contentType = req.headers.get("content-type") || "text/plain";

    const cacheKey = `${ASCYEAR_CACHE_VERSION}|ct=${contentType}|${raw}`;
    const cached = getCache(cacheKey);
    if (cached) return NextResponse.json(cached);

    // Delegate to /api/core by calling its POST handler directly
    const coreReq = new Request("http://local/api/core", {
      method: "POST",
      headers: { "content-type": contentType },
      body: raw,
    });

    const coreRes = await corePOST(coreReq);

    // corePOST returns a Response; parse JSON
    const coreJson = await coreRes.json().catch(() => null);

    if (!coreJson || coreJson?.ok === false) {
      const errMsg =
        coreJson?.error ||
        `core returned non-ok (status ${coreRes.status || "unknown"})`;
      return NextResponse.json({ ok: false, error: errMsg }, { status: 400 });
    }

    // Adapt core → legacy asc-year payload
    const natalBodies = coreJson?.natal?.bodies ?? {};
    const asOfBodies = coreJson?.asOf?.bodies ?? {};

    const northNodeLon =
      typeof natalBodies?.northNode?.lon === "number"
        ? wrap360(natalBodies.northNode.lon)
        : null;

    const southNodeLon = computeSouthNode(
      northNodeLon,
      typeof natalBodies?.southNode?.lon === "number" ? natalBodies.southNode.lon : null
    );

    const payload = {
      ok: true,
      text: buildAscYearText(coreJson),
      input: coreJson?.input,
      birthUTC: coreJson?.birthUTC,
      asOfUTC: coreJson?.asOfUTC,

      natal: {
        jd_ut: coreJson?.natal?.jd_ut ?? coreJson?.natal?.jdUT ?? coreJson?.natal?.julianDay,
        ascendant: coreJson?.natal?.ascendant,
        mc: coreJson?.natal?.mc,
        houses: coreJson?.natal?.houses,

        // legacy direct fields
        sunLon: typeof natalBodies?.sun?.lon === "number" ? wrap360(natalBodies.sun.lon) : null,
        moonLon:
          typeof natalBodies?.moon?.lon === "number" ? wrap360(natalBodies.moon.lon) : null,

        mercuryLon:
          typeof natalBodies?.mercury?.lon === "number"
            ? wrap360(natalBodies.mercury.lon)
            : null,
        venusLon:
          typeof natalBodies?.venus?.lon === "number" ? wrap360(natalBodies.venus.lon) : null,
        marsLon:
          typeof natalBodies?.mars?.lon === "number" ? wrap360(natalBodies.mars.lon) : null,
        jupiterLon:
          typeof natalBodies?.jupiter?.lon === "number" ? wrap360(natalBodies.jupiter.lon) : null,
        saturnLon:
          typeof natalBodies?.saturn?.lon === "number" ? wrap360(natalBodies.saturn.lon) : null,
        uranusLon:
          typeof natalBodies?.uranus?.lon === "number" ? wrap360(natalBodies.uranus.lon) : null,
        neptuneLon:
          typeof natalBodies?.neptune?.lon === "number" ? wrap360(natalBodies.neptune.lon) : null,
        plutoLon:
          typeof natalBodies?.pluto?.lon === "number" ? wrap360(natalBodies.pluto.lon) : null,

        chironLon:
          typeof natalBodies?.chiron?.lon === "number" ? wrap360(natalBodies.chiron.lon) : null,

        northNodeLon,
        southNodeLon,

        // also include bodies map (new) for forward-compat
        bodies: natalBodies,
      },

      transit: {
        jd_ut: coreJson?.asOf?.jd_ut ?? coreJson?.asOf?.jdUT ?? coreJson?.asOf?.julianDay,
        sunLon: typeof asOfBodies?.sun?.lon === "number" ? wrap360(asOfBodies.sun.lon) : null,
      },

      ascYear: coreJson?.derived?.ascYear,
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
