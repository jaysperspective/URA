// src/lib/doctrine/parse.ts
import { PLANETS, SIGNS, HOUSES, type PlanetSlug, type SignSlug } from "./primitives";

const planetAliases: Record<string, PlanetSlug> = {
  sun: "sun",
  moon: "moon",
  mercury: "mercury",
  venus: "venus",
  mars: "mars",
  jupiter: "jupiter",
  saturn: "saturn",
  uranus: "uranus",
  neptune: "neptune",
  pluto: "pluto",
  chiron: "chiron",
  "north node": "north_node",
  northnode: "north_node",
  nn: "north_node",
  "south node": "south_node",
  southnode: "south_node",
  sn: "south_node",
};

const signAliases: Record<string, SignSlug> = Object.fromEntries(
  SIGNS.map((s) => [s.name.toLowerCase(), s.slug])
) as any;

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[\u2019']/g, "'")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseHouseToken(tok: string): number | null {
  const m = tok.match(/^(\d{1,2})(st|nd|rd|th)?$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (n >= 1 && n <= 12) return n;
  return null;
}

export type ParsedPlacement = { planet: PlanetSlug; sign: SignSlug; house: number | null };

/**
 * Accepts:
 * - "Mars Virgo"
 * - "Mars in Virgo"
 * - "Mars Virgo 6th house"
 * - "North Node Aquarius"
 *
 * House is OPTIONAL.
 */
export function parsePlacement(input: string): ParsedPlacement {
  const raw = normalize(input);

  // Prefer longest phrases first (so "north node" beats "node")
  const candidates = Object.keys(planetAliases).sort((a, b) => b.length - a.length);

  let planet: PlanetSlug | null = null;
  let rest = raw;

  for (const phrase of candidates) {
    if (raw.includes(phrase)) {
      planet = planetAliases[phrase];
      rest = raw.replace(phrase, " ");
      break;
    }
  }

  if (!planet) {
    const tks = raw.split(" ");
    const hit = tks.find((t) => planetAliases[t]);
    if (hit) {
      planet = planetAliases[hit];
      rest = raw.replace(hit, " ");
    }
  }

  if (!planet) throw new Error("Could not find a planet/body (try: Mars, Venus, Chiron, North Node).");

  const tokens = rest.split(" ").filter(Boolean);

  let sign: SignSlug | null = null;
  let house: number | null = null;

  for (const t of tokens) {
    const s = signAliases[t];
    if (s) sign = s;

    const h = parseHouseToken(t);
    if (h) house = h;
  }

  if (!sign) throw new Error("Could not find a sign (try: Virgo, Aquarius, Scorpio).");

  // Validate core parts
  if (!PLANETS.some((p) => p.slug === planet)) throw new Error("Invalid planet.");
  if (!SIGNS.some((s) => s.slug === sign)) throw new Error("Invalid sign.");

  // Validate house only if present
  if (house != null && !HOUSES.some((h) => h.num === house)) throw new Error("Invalid house.");

  return { planet, sign, house };
}
