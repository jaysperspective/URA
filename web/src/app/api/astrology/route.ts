// src/app/api/astrology/route.ts
import { NextResponse } from "next/server";
import doctrine from "@/lib/doctrine/doctrine.generated.json";
import { getStandaloneCard, type StandaloneCard } from "@/lib/doctrine/standalone";

type DoctrineCard = any;
const CARDS: DoctrineCard[] = (doctrine as any).cards ?? [];

/** ---------------- key normalization ---------------- */

function normKey(k: string) {
  return String(k || "")
    .trim()
    .toLowerCase()
    .replace(/[’'′″]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*\|\s*/g, "|");
}

function normPlanetToken(p: string) {
  const x = normKey(p).replace(/\s/g, "");
  if (x === "northnode" || x === "truenode" || x === "meannode" || x === "node") return "northnode";
  if (x === "southnode") return "southnode";
  return x;
}

function normSignToken(s: string) {
  return normKey(s).replace(/\s/g, "");
}

function normHouseToken(h: string) {
  return normKey(h).replace(/\s/g, "");
}

/**
 * Canonicalize doctrine keys so lookups are case-insensitive and tolerant.
 * Supports:
 * - planet|sign
 * - planet|sign|houseNumber
 */
function canonizeIncomingKey(raw: string) {
  const k = normKey(raw);
  if (!k.includes("|")) return k;

  const parts = k.split("|").map((x) => x.trim()).filter(Boolean);

  // planet|sign
  if (parts.length === 2) {
    const [a, b] = parts;
    return `${normPlanetToken(a)}|${normSignToken(b)}`;
  }

  // planet|sign|house
  if (parts.length >= 3) {
    const [a, b, c] = parts;
    return `${normPlanetToken(a)}|${normSignToken(b)}|${normHouseToken(c)}`;
  }

  return k;
}

const LOOKUP_EXACT = new Map<string, DoctrineCard>(CARDS.map((c) => [c.key, c]));
const LOOKUP_NORM = new Map<string, DoctrineCard>();

for (const c of CARDS) {
  const nk = canonizeIncomingKey(c.key);
  // keep first occurrence (stable)
  if (!LOOKUP_NORM.has(nk)) LOOKUP_NORM.set(nk, c);
}

function resolveCardFromKey(key: string) {
  // 1) exact match
  const exact = LOOKUP_EXACT.get(key);
  if (exact) return exact;

  // 2) normalized match
  const nk = canonizeIncomingKey(key);
  const norm = LOOKUP_NORM.get(nk);
  if (norm) return norm;

  return null;
}

/** ---------------- query parsing ---------------- */

// returns integer 1..12 or null
function extractHouseNumber(s: string): number | null {
  const m = s.match(/\b(1[0-2]|[1-9])\s*(?:st|nd|rd|th)?\s+house\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 1 || n > 12) return null;
  return n;
}

/**
 * Parse queries like:
 * - "Moon Capricorn"
 * - "North Node Aquarius"
 * - "Moon Cancer 5th house"
 *
 * Doctrine key behavior:
 * - if house present -> planet|sign|houseNum
 * - else -> planet|sign  (fallback later to |1 if needed)
 */
function queryToDoctrineKey(q: string) {
  const s = String(q || "")
    .trim()
    .replace(/[’'′″]/g, "")
    .replace(/\s+/g, " ");

  const tokens = s.split(" ").filter(Boolean);
  if (tokens.length < 2) return null;

  // planet could be 1 or 2 words (north node / south node)
  let planet = tokens[0];
  let signIdx = 1;

  if (/^(north|south)$/i.test(tokens[0]) && /^node$/i.test(tokens[1]) && tokens.length >= 3) {
    planet = `${tokens[0]} ${tokens[1]}`;
    signIdx = 2;
  }

  const sign = tokens[signIdx];
  if (!sign) return null;

  const planetNorm = normPlanetToken(planet);
  const signNorm = normSignToken(sign);

  const houseNum = extractHouseNumber(s);

  if (houseNum != null) {
    return `${planetNorm}|${signNorm}|${houseNum}`;
  }

  return `${planetNorm}|${signNorm}`;
}

/**
 * If your doctrine dataset is mostly house-specific (planet|sign|N),
 * and the user didn’t specify a house, we can optionally fall back to house 1.
 */
function fallbackHouse1IfNeeded(key: string) {
  const k = canonizeIncomingKey(key);
  const parts = k.split("|").filter(Boolean);
  if (parts.length === 2) return `${parts[0]}|${parts[1]}|1`;
  return null;
}

/**
 * Check if query is a standalone lookup (just sign, house, or planet)
 */
function tryStandaloneLookup(q: string): StandaloneCard | null {
  const s = q.trim().toLowerCase();

  // Check for sign-only
  const signs = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
  if (signs.includes(s)) {
    return getStandaloneCard("sign", s);
  }

  // Check for house-only (e.g., "1st house", "5th house", "house 3", "3")
  const houseMatch = s.match(/^(?:(\d{1,2})(?:st|nd|rd|th)?\s*house|house\s*(\d{1,2})|(\d{1,2}))$/i);
  if (houseMatch) {
    const num = houseMatch[1] || houseMatch[2] || houseMatch[3];
    return getStandaloneCard("house", num);
  }

  // Check for planet-only
  const planetNames = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron", "north node", "south node", "northnode", "southnode"];
  if (planetNames.includes(s)) {
    return getStandaloneCard("planet", s);
  }

  return null;
}

/**
 * Convert standalone card to doctrine card format for consistent API response
 */
function standaloneToDoctrineFormat(card: StandaloneCard): DoctrineCard {
  return {
    key: card.key,
    placement: {
      [card.type]: card.labels.name,
    },
    labels: {
      placement: card.labels.name,
      category: card.labels.category,
    },
    function: {
      core: card.core,
    },
    synthesis: card.description,
    strengths: card.strengths,
    shadows: card.shadows,
    directives: card.directives,
    tags: card.tags,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json({ ok: false, error: "Missing or invalid query." }, { status: 400 });
  }

  // First, try standalone lookup (sign, house, or planet only)
  const standalone = tryStandaloneLookup(q);
  if (standalone) {
    const formattedCard = standaloneToDoctrineFormat(standalone);
    return NextResponse.json({ ok: true, key: standalone.key, card: formattedCard });
  }

  // Otherwise, try combined lookup (planet + sign, etc.)
  const key = queryToDoctrineKey(q);
  if (!key) {
    return NextResponse.json({ ok: false, error: "Missing or invalid query." }, { status: 400 });
  }

  // Try requested key first (house-aware)
  let card = resolveCardFromKey(key);

  // If user did NOT specify a house and we didn't find planet|sign,
  // fall back to planet|sign|1 (keeps current "default" behavior).
  if (!card) {
    const fallback = fallbackHouse1IfNeeded(key);
    if (fallback) card = resolveCardFromKey(fallback);
  }

  if (!card) {
    return NextResponse.json({ ok: false, error: `No doctrine card found for ${canonizeIncomingKey(key)}.` }, { status: 404 });
  }

  return NextResponse.json({ ok: true, key: card.key, card }, {
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
}
