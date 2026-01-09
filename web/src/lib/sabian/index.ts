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

/**
 * Infer entry type from the generated dataset.
 * This avoids requiring an exported type from ./uraSabian.
 */
export type UraSabianEntry = (typeof URA_SABIAN)[number];

export function sabianIndexFromLon(lon: number): number {
  // lon 0..360 => index 0..359
  const x = norm360(lon);
  const signIdx = Math.floor(x / 30); // 0..11
  const deg0 = Math.floor(x % 30); // 0..29
  const degree = deg0 + 1; // 1..30
  return signIdx * 30 + (degree - 1);
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

  // Prefer lookup by idx (fast)
  const byIdx = (URA_SABIAN as any)?.[idx];
  if (byIdx && typeof byIdx === "object") return byIdx as UraSabianEntry;

  // Fallback: find by key
  const found =
    Array.isArray(URA_SABIAN)
      ? (URA_SABIAN as any[]).find((x) => x?.idx === idx || x?.key === key)
      : null;

  if (found) return found as UraSabianEntry;

  // Final fallback object (keeps the app stable if dataset isn't generated)
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
  } as unknown as UraSabianEntry;
}
