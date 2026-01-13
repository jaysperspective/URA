// src/app/api/astrology/route.ts
import { NextResponse } from "next/server";
import doctrine from "@/lib/doctrine/doctrine.generated.json";

type DoctrineCard = any;
const CARDS: DoctrineCard[] = (doctrine as any).cards ?? [];

function normKey(k: string) {
  return String(k || "")
    .trim()
    .toLowerCase()
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

function canonizeIncomingKey(raw: string) {
  const k = normKey(raw);
  if (!k.includes("|")) return k;
  const [a, b] = k.split("|");
  return `${normPlanetToken(a)}|${normSignToken(b)}`;
}

const LOOKUP_EXACT = new Map<string, DoctrineCard>(CARDS.map((c) => [c.key, c]));
const LOOKUP_NORM = new Map<string, DoctrineCard>();

for (const c of CARDS) {
  const nk = canonizeIncomingKey(c.key);
  if (!LOOKUP_NORM.has(nk)) LOOKUP_NORM.set(nk, c);
}

function resolveCardFromKey(key: string) {
  const exact = LOOKUP_EXACT.get(key);
  if (exact) return exact;

  const nk = canonizeIncomingKey(key);
  return LOOKUP_NORM.get(nk) ?? null;
}

/**
 * Parse query like:
 * - "Moon Capricorn"
 * - "North Node Aquarius"
 * - "Sun Capricorn 10th house"  (if your doctrine has house cards; otherwise this will 404)
 */
function queryToDoctrineKey(q: string) {
  const s = String(q || "")
    .trim()
    .replace(/[’'′″]/g, "")
    .replace(/\s+/g, " ");

  // House patterns (optional)
  const houseMatch = s.match(/\b(1[0-2]|[1-9])(?:st|nd|rd|th)?\s+house\b/i);

  // If you have separate house doctrine cards, you can support "planet|house" keys here.
  // For now, we keep your existing design: "planet|sign" for sign placements.
  // If input includes a house phrase, we still try planet|sign from first two tokens.
  const tokens = s.split(" ").filter(Boolean);
  if (tokens.length < 2) return null;

  // planet could be 1 or 2 words (north node / south node)
  let planet = tokens[0];
  let sign = tokens[1];

  if (/^(north|south)$/i.test(tokens[0]) && /^node$/i.test(tokens[1]) && tokens.length >= 3) {
    planet = `${tokens[0]} ${tokens[1]}`; // "North Node"
    sign = tokens[2];
  }

  // normalize tokens into a key
  const planetNorm = normPlanetToken(planet);
  const signNorm = normSignToken(sign);

  // if you want to support house cards later:
  // if (houseMatch) { return `${planetNorm}|${houseMatch[0].toLowerCase().replace(/\s+/g, "")}`; }

  return `${planetNorm}|${signNorm}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";

  const key = queryToDoctrineKey(q);
  if (!key) {
    return NextResponse.json({ ok: false, error: "Missing or invalid query." }, { status: 400 });
  }

  const card = resolveCardFromKey(key);
  if (!card) {
    return NextResponse.json({ ok: false, error: `No doctrine card found for ${key}.` }, { status: 404 });
  }

  return NextResponse.json({ ok: true, key: card.key, card });
}
