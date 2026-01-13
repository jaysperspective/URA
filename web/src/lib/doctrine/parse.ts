// src/lib/doctrine/parse.ts
import { PLANETS, SIGNS, HOUSES, type PlanetSlug, type SignSlug } from "./primitives";

const planetAliases: Record<string, PlanetSlug | "asc" | "mc"> = {
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

  // Angles (not necessarily supported by doctrine cards yet, but we can detect them)
  asc: "asc",
  ascendant: "asc",
  mc: "mc",
  midheaven: "mc",
};

const signAliases: Record<string, SignSlug> = Object.fromEntries(
  SIGNS.map((s) => [s.name.toLowerCase(), s.slug])
) as any;

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[\u2019']/g, "'")
    // keep digits for house parsing, strip punctuation into spaces
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

export type ParsedPlacement = {
  planet: PlanetSlug;
  sign: SignSlug;
  house?: number | null;
};

export function parsePlacement(input: string): ParsedPlacement {
  const raw = normalize(input);

  // Prefer longest phrases first (so "north node" beats "node")
  const candidates = Object.keys(planetAliases).sort((a, b) => b.length - a.length);

  let planet: PlanetSlug | "asc" | "mc" | null = null;
  let rest = raw;

  for (const phrase of candidates) {
    if (raw.includes(phrase)) {
      planet = planetAliases[phrase] as any;
      rest = raw.replace(phrase, " ");
      break;
    }
  }

  if (!planet) {
    const tks = raw.split(" ");
    const hit = tks.find((t) => planetAliases[t]);
    if (hit) {
      planet = planetAliases[hit] as any;
      rest = raw.replace(hit, " ");
    }
  }

  if (!planet) throw new Error("Could not find a planet/body (try: Mars, Venus, Chiron, North Node).");

  // Angles detected but not part of doctrine planet set (handle upstream)
  if (planet === "asc" || planet === "mc") {
    throw new Error("ASC/MC lookups aren’t supported in doctrine yet. Use planets/nodes/chiron for now.");
  }

  const tokens = rest
    .split(" ")
    .filter(Boolean)
    .filter((t) => t !== "in" && t !== "house"); // allow natural language without breaking

  let sign: SignSlug | null = null;
  let house: number | null = null;

  for (const t of tokens) {
    const s = signAliases[t];
    if (s) sign = s;

    const h = parseHouseToken(t);
    if (h) house = h;
  }

  if (!sign) throw new Error("Could not find a sign (try: Virgo, Aquarius, Scorpio).");

  // Validate planet + sign
  if (!PLANETS.some((p) => p.slug === planet)) throw new Error("Invalid planet.");
  if (!SIGNS.some((s) => s.slug === sign)) throw new Error("Invalid sign.");

  // House optional — only validate if present
  if (house != null) {
    if (!HOUSES.some((h) => h.num === house)) throw new Error("Invalid house.");
  }

  return { planet, sign, house };
}
