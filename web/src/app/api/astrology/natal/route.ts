// src/app/api/astrology/natal/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/requireUser";

function norm360(d: number) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

const SIGNS_FULL = [
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
] as const;

function signFromLonFull(lon: number) {
  const idx = Math.floor(norm360(lon) / 30) % 12;
  return SIGNS_FULL[idx];
}

function degInSign(lon: number) {
  const x = norm360(lon);
  const within = x % 30;
  const d = Math.floor(within);
  const m = Math.floor((within - d) * 60);
  return { d, m };
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// House calculation from cusps (best-effort)
// Accepts cusps length 12 or 13. If 13, cusp[0] is often house 1 and cusp[12] repeats.
function lonToHouse(cuspsRaw: number[], lon: number): number | null {
  const cusps = cuspsRaw
    .map((x) => (typeof x === "number" && Number.isFinite(x) ? norm360(x) : null))
    .filter((x): x is number => x != null);

  if (cusps.length < 12) return null;

  // Normalize to 12 cusps starting at house 1
  const c = cusps.length >= 13 ? cusps.slice(0, 12) : cusps.slice(0, 12);

  const L = norm360(lon);

  // Houses are segments [cusp_i, cusp_{i+1}) going forward, wrapping at 360
  for (let i = 0; i < 12; i++) {
    const a = c[i];
    const b = c[(i + 1) % 12];

    if (a <= b) {
      // normal segment
      if (L >= a && L < b) return i + 1;
    } else {
      // wraps 360
      if (L >= a || L < b) return i + 1;
    }
  }
  return null;
}

function pickFirstNumber(...xs: any[]): number | null {
  for (const x of xs) {
    if (typeof x === "number" && Number.isFinite(x)) return x;
  }
  return null;
}

// Attempts to extract a map of body -> longitude from common chart shapes
function extractBodyLons(natal: any) {
  const out: Record<string, number> = {};

  const candidates = [
    natal?.planets,
    natal?.bodies,
    natal?.objects,
    natal?.points,
    natal?.data?.planets,
    natal?.data?.bodies,
    natal?.chart?.planets,
    natal?.chart?.bodies,
  ].filter(Boolean);

  // Common canonical names we want
  const WANT: { key: string; aliases: string[] }[] = [
    { key: "Sun", aliases: ["sun", "Sun", "sol"] },
    { key: "Moon", aliases: ["moon", "Moon", "luna"] },
    { key: "Mercury", aliases: ["mercury", "Mercury"] },
    { key: "Venus", aliases: ["venus", "Venus"] },
    { key: "Mars", aliases: ["mars", "Mars"] },
    { key: "Jupiter", aliases: ["jupiter", "Jupiter"] },
    { key: "Saturn", aliases: ["saturn", "Saturn"] },
    { key: "Uranus", aliases: ["uranus", "Uranus"] },
    { key: "Neptune", aliases: ["neptune", "Neptune"] },
    { key: "Pluto", aliases: ["pluto", "Pluto"] },
    { key: "Chiron", aliases: ["chiron", "Chiron"] },
    { key: "North Node", aliases: ["northNode", "north_node", "meanNode", "trueNode", "NorthNode", "North Node"] },
    { key: "South Node", aliases: ["southNode", "south_node", "SouthNode", "South Node"] },
    { key: "ASC", aliases: ["asc", "ASC", "Ascendant", "ascendant"] },
    { key: "MC", aliases: ["mc", "MC", "Midheaven", "midheaven"] },
  ];

  function readLon(obj: any): number | null {
    if (!obj) return null;
    return pickFirstNumber(obj.lon, obj.lng, obj.longitude, obj.long, obj.eclipticLon, obj.eclLon);
  }

  // Pass 1: scan candidate containers
  for (const bag of candidates) {
    for (const want of WANT) {
      if (out[want.key] != null) continue;
      for (const alias of want.aliases) {
        const v = bag?.[alias];
        const lon = readLon(v);
        if (lon != null) {
          out[want.key] = norm360(lon);
          break;
        }
      }
    }
  }

  // Pass 2: sometimes angles live elsewhere
  if (out["ASC"] == null) {
    const lon = pickFirstNumber(natal?.angles?.asc, natal?.angles?.ASC, natal?.asc, natal?.ASC, natal?.data?.asc);
    if (lon != null) out["ASC"] = norm360(lon);
  }
  if (out["MC"] == null) {
    const lon = pickFirstNumber(natal?.angles?.mc, natal?.angles?.MC, natal?.mc, natal?.MC, natal?.data?.mc);
    if (lon != null) out["MC"] = norm360(lon);
  }

  return out;
}

function extractCusps(natal: any): number[] | null {
  const raw =
    natal?.houses?.cusps ||
    natal?.houses?.houseCusps ||
    natal?.houseCusps ||
    natal?.cusps ||
    natal?.data?.houses?.cusps ||
    natal?.chart?.houses?.cusps;

  if (!raw) return null;
  if (!Array.isArray(raw)) return null;

  const nums = raw.map((x: any) => (typeof x === "number" ? x : null)).filter((x: any) => typeof x === "number");
  if (nums.length < 12) return null;
  return nums as number[];
}

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) return NextResponse.json({ ok: false, error: "Profile not found." }, { status: 404 });

    const natal = profile.natalChartJson as any;
    if (!natal) return NextResponse.json({ ok: false, error: "Natal cache missing." }, { status: 404 });

    const bodies = extractBodyLons(natal);
    const cusps = extractCusps(natal);

    // Build placements list for UI + query strings for /api/astrology
    const order = [
      "ASC",
      "MC",
      "Sun",
      "Moon",
      "Mercury",
      "Venus",
      "Mars",
      "Jupiter",
      "Saturn",
      "Uranus",
      "Neptune",
      "Pluto",
      "Chiron",
      "North Node",
      "South Node",
    ];

    const placements = order
      .map((name) => {
        const lon = bodies[name];
        if (typeof lon !== "number") return null;

        const sign = signFromLonFull(lon);
        const { d, m } = degInSign(lon);
        const house = cusps ? lonToHouse(cusps, lon) : null;

        // Query format AstrologyClient already uses.
        // If house known: "Sun Capricorn 10th house"
        // Else: "Sun Capricorn"
        const query = house ? `${name} ${sign} ${ordinal(house)} house` : `${name} ${sign}`;

        return {
          name,
          lon,
          sign,
          deg: d,
          min: m,
          house,
          label: `${name} ${sign} ${d}° ${String(m).padStart(2, "0")}'${house ? ` · ${ordinal(house)}` : ""}`,
          query,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      ok: true,
      source: "profile.natalChartJson",
      placements,
      hasCusps: Boolean(cusps),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to load natal cache." }, { status: 500 });
  }
}
