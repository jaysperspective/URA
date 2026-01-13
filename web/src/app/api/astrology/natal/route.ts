// src/app/api/astrology/natal/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/requireUser";

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
