// src/lib/sabian/index.ts
import { URA_SABIAN } from "./uraSabian";

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

// ✅ infer type from URA_SABIAN so we never import a type name
export type UraSabianEntry = (typeof URA_SABIAN)[number];

export function sabianIndexFromLon(lon: number): number {
  const x = norm360(lon);
  const signIdx = Math.floor(x / 30); // 0..11
  const deg0 = Math.floor(x % 30); // 0..29
  const degree = deg0 + 1; // 1..30
  return signIdx * 30 + (degree - 1); // 0..359
}

export function sabianKeyFromLon(lon: number): { sign: string; degree: number; key: string; idx: number } {
  const idx = sabianIndexFromLon(lon);
  const signIdx = Math.floor(idx / 30);
  const degree = (idx % 30) + 1;
  const sign = SIGNS_FULL[signIdx] ?? "Aries";
  return { sign, degree, key: `${sign} ${degree}`, idx };
}

export function sabianFromLon(lon: number): UraSabianEntry {
  const { idx, key, sign, degree } = sabianKeyFromLon(lon);

  const byIdx = URA_SABIAN[idx];
  if (byIdx && typeof byIdx === "object") return byIdx;

  const found = URA_SABIAN.find((x) => x.idx === idx || x.key === key);
  if (found) return found;

  // Should not happen if URA_SABIAN has all 360 entries
  return {
    idx,
    key,
    sign,
    degree,
    symbol: "—",
    signal: "—",
    shadow: "—",
    directive: "—",
    practice: "—",
    journal: "—",
    tags: [],
  } as UraSabianEntry;
}
