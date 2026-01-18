// src/app/api/astrology/natal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/requireUser";
import { withComputeRateLimit } from "@/lib/withRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function norm360(d: number) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

const SIGNS = [
  { name: "Aries", slug: "aries" },
  { name: "Taurus", slug: "taurus" },
  { name: "Gemini", slug: "gemini" },
  { name: "Cancer", slug: "cancer" },
  { name: "Leo", slug: "leo" },
  { name: "Virgo", slug: "virgo" },
  { name: "Libra", slug: "libra" },
  { name: "Scorpio", slug: "scorpio" },
  { name: "Sagittarius", slug: "sagittarius" },
  { name: "Capricorn", slug: "capricorn" },
  { name: "Aquarius", slug: "aquarius" },
  { name: "Pisces", slug: "pisces" },
];

function signNameFromLon(lon: number) {
  const idx = Math.floor(norm360(lon) / 30) % 12;
  return SIGNS[idx]?.name ?? "Aries";
}

function fmtDegMin(lon: number) {
  const x = norm360(lon);
  const degInSign = x % 30;
  const d = Math.floor(degInSign);
  const m = Math.floor((degInSign - d) * 60);
  return `${d}° ${String(m).padStart(2, "0")}'`;
}

function ord(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function planetDisplayName(slug: string) {
  const map: Record<string, string> = {
    sun: "Sun",
    moon: "Moon",
    mercury: "Mercury",
    venus: "Venus",
    mars: "Mars",
    jupiter: "Jupiter",
    saturn: "Saturn",
    uranus: "Uranus",
    neptune: "Neptune",
    pluto: "Pluto",
    chiron: "Chiron",
    northnode: "North Node",
    north_node: "North Node",
    southnode: "South Node",
    south_node: "South Node",
  };
  return map[slug] ?? slug[0]?.toUpperCase() + slug.slice(1);
}

type Chip = {
  kind: "planet" | "node" | "chiron" | "angle";
  label: string;
  query: string | null; // null => display-only (e.g., ASC/MC for now)
};

function coerceHouse(h: any): number | null {
  const n = Number(h);
  if (Number.isFinite(n) && n >= 1 && n <= 12) return n;
  return null;
}

function coerceLon(x: any): number | null {
  const n = Number(x);
  if (Number.isFinite(n)) return n;
  return null;
}

/**
 * Try to read a wide variety of natalChartJson shapes.
 * We only need: planet name + lon + (optional) house.
 */
function extractChipsFromNatal(natal: any): Chip[] {
  const chips: Chip[] = [];

  // ---- Angles (display-only for now) ----
  // Try common locations for ASC/MC
  const ascLon =
    coerceLon(natal?.angles?.asc) ??
    coerceLon(natal?.angles?.ascendant) ??
    coerceLon(natal?.asc) ??
    coerceLon(natal?.ascendant);

  const mcLon =
    coerceLon(natal?.angles?.mc) ??
    coerceLon(natal?.angles?.midheaven) ??
    coerceLon(natal?.mc) ??
    coerceLon(natal?.midheaven);

  if (typeof ascLon === "number") {
    chips.push({
      kind: "angle",
      label: `ASC ${signNameFromLon(ascLon)} ${fmtDegMin(ascLon)}`,
      query: null,
    });
  }
  if (typeof mcLon === "number") {
    chips.push({
      kind: "angle",
      label: `MC ${signNameFromLon(mcLon)} ${fmtDegMin(mcLon)}`,
      query: null,
    });
  }

  // ---- Planet list extraction ----
  // Common shapes:
  // natal.planets: [{ name, lon, house }]
  // natal.planetsByName: { sun: { lon, house }, ... }
  // natal.bodies: ...
  const planetRows: Array<{ slug: string; lon: number; house?: number | null }> = [];

  const arr = natal?.planets ?? natal?.bodies ?? natal?.objects ?? null;
  if (Array.isArray(arr)) {
    for (const p of arr) {
      const slug = String(p?.name ?? p?.id ?? p?.key ?? "").toLowerCase().trim();
      const lon = coerceLon(p?.lon ?? p?.longitude ?? p?.lng);
      const house = coerceHouse(p?.house ?? p?.houseNum ?? p?.house_number);
      if (!slug || typeof lon !== "number") continue;
      planetRows.push({ slug, lon, house });
    }
  }

  const byName = natal?.planetsByName ?? natal?.bodiesByName ?? natal?.pointsByName ?? null;
  if (byName && typeof byName === "object" && !Array.isArray(byName)) {
    for (const [k, v] of Object.entries(byName)) {
      const slug = String(k).toLowerCase().trim();
      const lon = coerceLon((v as any)?.lon ?? (v as any)?.longitude ?? (v as any)?.lng);
      const house = coerceHouse((v as any)?.house ?? (v as any)?.houseNum ?? (v as any)?.house_number);
      if (!slug || typeof lon !== "number") continue;
      planetRows.push({ slug, lon, house });
    }
  }

  // Deduplicate by slug (prefer row with house if duplicates)
  const best = new Map<string, { slug: string; lon: number; house?: number | null }>();
  for (const row of planetRows) {
    const prev = best.get(row.slug);
    if (!prev) best.set(row.slug, row);
    else if ((prev.house == null) && row.house != null) best.set(row.slug, row);
  }

  // Order we want
  const order = [
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
    "chiron",
    "north_node",
    "northnode",
    "south_node",
    "southnode",
  ];

  const rowsSorted = Array.from(best.values()).sort((a, b) => {
    const ia = order.indexOf(a.slug);
    const ib = order.indexOf(b.slug);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  for (const row of rowsSorted) {
    const name = planetDisplayName(row.slug);
    const sign = signNameFromLon(row.lon);
    const deg = fmtDegMin(row.lon);
    const house = row.house != null ? row.house : null;

    const isNode = row.slug.includes("node");
    const kind: Chip["kind"] =
      row.slug === "chiron" ? "chiron" : isNode ? "node" : "planet";

    // Query:
    // - if house known: "Moon Capricorn 4th house"
    // - else: "Moon Capricorn"
    const query = house ? `${name} ${sign} ${ord(house)} house` : `${name} ${sign}`;

    chips.push({
      kind,
      label: `${name} ${sign} ${deg}${house ? ` • ${ord(house)}` : ""}`,
      query,
    });
  }

  return chips;
}

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { natalChartJson: true },
    });

    const natal = profile?.natalChartJson as any;
    if (!natal) {
      return NextResponse.json(
        { ok: false, error: "No natalChartJson cached yet." },
        { status: 404 }
      );
    }

    const placements = extractChipsFromNatal(natal);

    return NextResponse.json({
      ok: true,
      version: "1.0",
      placements,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 400 }
    );
  }
}

// ============================================
// POST - Free chart generation for non-members
// ============================================

function getAstroServiceChartUrl() {
  const raw = process.env.ASTRO_SERVICE_URL || "http://127.0.0.1:3002";
  const base = raw.replace(/\/+$/, "").replace(/\/chart$/, "");
  return `${base}/chart`;
}

async function geocodePlace(q: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "URA-Geocoder/1.0",
        "Accept-Language": "en",
      },
    });

    if (!res.ok) return null;

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    const top = json[0];
    const lat = Number(top.lat);
    const lon = Number(top.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return { lat, lon };
  } catch {
    return null;
  }
}

function degInSign(lon: number): number {
  return Math.floor(norm360(lon) % 30);
}

async function handlePost(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const { birthDate, birthTime, birthPlace } = body;

    // Validate required fields
    if (!birthDate || !birthTime) {
      return NextResponse.json(
        { ok: false, error: "Birth date and time are required" },
        { status: 400 }
      );
    }

    // Parse birth date - handle both YYYY-MM-DD and display formats
    let year: number, month: number, day: number;

    // Try YYYY-MM-DD format first
    const isoMatch = String(birthDate).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10);
      month = parseInt(isoMatch[2], 10);
      day = parseInt(isoMatch[3], 10);
    } else {
      // Try parsing as a Date string (e.g., "May 18, 1987")
      const parsed = new Date(birthDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { ok: false, error: "Invalid birth date format. Use YYYY-MM-DD." },
          { status: 400 }
        );
      }
      year = parsed.getFullYear();
      month = parsed.getMonth() + 1;
      day = parsed.getDate();
    }

    // Parse birth time (HH:MM)
    const timeMatch = String(birthTime).match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) {
      return NextResponse.json(
        { ok: false, error: "Invalid birth time format. Use HH:MM." },
        { status: 400 }
      );
    }
    const hour = parseInt(timeMatch[1], 10);
    const minute = parseInt(timeMatch[2], 10);

    // Get coordinates - geocode if place provided, else default
    let lat = 40.7128; // Default: NYC
    let lon = -74.006;

    if (birthPlace && String(birthPlace).trim()) {
      const geo = await geocodePlace(String(birthPlace).trim());
      if (geo) {
        lat = geo.lat;
        lon = geo.lon;
      }
    }

    // Call the astro service
    const chartUrl = getAstroServiceChartUrl();
    const payload = {
      year,
      month,
      day,
      hour,
      minute,
      latitude: lat,
      longitude: lon,
    };

    const chartRes = await fetch(chartUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!chartRes.ok) {
      const errText = await chartRes.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Astro service error: ${chartRes.status} - ${errText.slice(0, 100)}` },
        { status: 502 }
      );
    }

    const chartData = await chartRes.json();
    const planets = chartData?.data?.planets ?? chartData?.planets ?? {};
    const houses = chartData?.data?.houses ?? chartData?.houses ?? null;

    // Helper to determine house from longitude given house cusps
    function getHouseFromLon(lon: number, houseCusps: number[] | null): number | null {
      if (!houseCusps || houseCusps.length !== 12) return null;
      const normalizedLon = norm360(lon);

      for (let i = 0; i < 12; i++) {
        const cusp = norm360(houseCusps[i]);
        const nextCusp = norm360(houseCusps[(i + 1) % 12]);

        // Handle wrap-around (e.g., house spans 350° to 20°)
        if (cusp > nextCusp) {
          if (normalizedLon >= cusp || normalizedLon < nextCusp) {
            return i + 1;
          }
        } else {
          if (normalizedLon >= cusp && normalizedLon < nextCusp) {
            return i + 1;
          }
        }
      }
      return null;
    }

    // Extract house cusps array if available
    let houseCusps: number[] | null = null;
    if (Array.isArray(houses)) {
      houseCusps = houses.map((h: any) => typeof h === "number" ? h : h?.lon ?? h?.cusp ?? null).filter((x: any) => typeof x === "number");
      if (houseCusps.length !== 12) houseCusps = null;
    } else if (houses && typeof houses === "object") {
      // Try numbered keys (house1, house2, etc.)
      const cusps: number[] = [];
      for (let i = 1; i <= 12; i++) {
        const val = houses[`house${i}`] ?? houses[i] ?? houses[`h${i}`];
        const lon = typeof val === "number" ? val : val?.lon ?? val?.cusp ?? null;
        if (typeof lon === "number") cusps.push(lon);
      }
      if (cusps.length === 12) houseCusps = cusps;
    }

    // Extract placements
    const placements: { planet: string; sign: string; degree: number; house: number | null }[] = [];

    const planetKeys = [
      { key: "sun", label: "Sun" },
      { key: "moon", label: "Moon" },
      { key: "mercury", label: "Mercury" },
      { key: "venus", label: "Venus" },
      { key: "mars", label: "Mars" },
      { key: "jupiter", label: "Jupiter" },
      { key: "saturn", label: "Saturn" },
      { key: "uranus", label: "Uranus" },
      { key: "neptune", label: "Neptune" },
      { key: "pluto", label: "Pluto" },
      { key: "chiron", label: "Chiron" },
      { key: "north_node", label: "North Node" },
      { key: "true_node", label: "North Node" },
    ];

    const seenPlanets = new Set<string>();

    for (const { key, label } of planetKeys) {
      if (seenPlanets.has(label)) continue;

      const p = planets[key];
      if (!p) continue;

      const plon = typeof p === "number" ? p : p?.lon;
      if (typeof plon !== "number" || !Number.isFinite(plon)) continue;

      // Try to get house from planet data first, then calculate from cusps
      let house: number | null = typeof p?.house === "number" ? p.house : null;
      if (house === null) {
        house = getHouseFromLon(plon, houseCusps);
      }

      seenPlanets.add(label);
      placements.push({
        planet: label,
        sign: signNameFromLon(plon),
        degree: degInSign(plon),
        house,
      });
    }

    // Also try to get ASC (always 1st house)
    const asc = chartData?.data?.ascendant ?? chartData?.data?.angles?.asc ?? chartData?.ascendant;
    if (typeof asc === "number" && Number.isFinite(asc)) {
      placements.push({
        planet: "ASC",
        sign: signNameFromLon(asc),
        degree: degInSign(asc),
        house: 1,
      });
    }

    // Also try to get MC (always 10th house)
    const mc = chartData?.data?.mc ?? chartData?.data?.angles?.mc ?? chartData?.mc;
    if (typeof mc === "number" && Number.isFinite(mc)) {
      placements.push({
        planet: "MC",
        sign: signNameFromLon(mc),
        degree: degInSign(mc),
        house: 10,
      });
    }

    return NextResponse.json({
      ok: true,
      placements,
      coordinates: { lat, lon },
      input: { year, month, day, hour, minute },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to generate chart" },
      { status: 500 }
    );
  }
}

// Apply compute rate limiting (20 req/min) as this is a compute-heavy endpoint
export const POST = withComputeRateLimit(handlePost);
