// src/lib/sabian/index.ts
import { SABIAN_360 } from "./uraSabian";


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

function norm360(d: number) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

/**
 * Infer entry type from the dataset itself.
 * This avoids importing a named type from uraSabian.ts entirely.
 */
export type UraSabianEntry = (typeof SABIAN_360)[number];

// Build O(1) lookup maps at module load
const mapByIdx = new Map<number, UraSabianEntry>();
const mapByKey = new Map<string, UraSabianEntry>();
for (const entry of SABIAN_360) {
  mapByIdx.set(entry.idx, entry);
  mapByKey.set(entry.key, entry);
}

export function sabianIndexFromLon(lon: number): number {
  const x = norm360(lon);
  const signIdx = Math.floor(x / 30); // 0..11
  const deg0 = Math.floor(x % 30); // 0..29
  const degree = deg0 + 1; // 1..30
  return signIdx * 30 + (degree - 1); // 0..359
}

export function sabianKeyFromLon(lon: number): {
  sign: string;
  degree: number;
  key: string;
  idx: number;
} {
  const idx = sabianIndexFromLon(lon);
  const signIdx = Math.floor(idx / 30);
  const degree = (idx % 30) + 1;
  const sign = SIGNS_FULL[signIdx] ?? "Aries";
  return { sign, degree, key: `${sign} ${degree}`, idx };
}

export function sabianFromLon(lon: number): UraSabianEntry {
  const { idx, key, sign, degree } = sabianKeyFromLon(lon);

  const direct = SABIAN_360[idx];
  if (direct && typeof direct === "object") return direct;

  const found = mapByIdx.get(idx) ?? mapByKey.get(key);
  if (found) return found;

  // Safety fallback (should never hit with full dataset)
  return {
    idx,
    key,
    sign,
    degree,
    symbol: "\u2014",
    signal: "\u2014",
    shadow: "\u2014",
    directive: "\u2014",
    practice: "\u2014",
    journal: "\u2014",
    tags: [],
  } as UraSabianEntry;
}
