// src/lib/sabian/index.ts
import { URA_SABIAN, type UraSabianEntry } from "./uraSabian";

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

export function sabianIndexFromLon(lon: number): number {
  const x = norm360(lon);
  const signIdx = Math.floor(x / 30); // 0..11
  const deg0 = Math.floor(x % 30); // 0..29
  const sabianDeg = deg0 + 1; // 1..30
  return signIdx * 30 + (sabianDeg - 1); // 0..359
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

  const byIdx = URA_SABIAN?.[idx];
  if (byIdx && byIdx.idx === idx) return byIdx;

  const found = Array.isArray(URA_SABIAN)
    ? URA_SABIAN.find((x) => x?.idx === idx || x?.key === key)
    : undefined;

  if (found) return found;

  return {
    idx,
    key,
    sign,
    degree,
    symbol: "— (dataset not generated yet)",
    signal: "—",
    shadow: "—",
    directive: "—",
    practice: "—",
    journal: "—",
    tags: [],
  };
}
