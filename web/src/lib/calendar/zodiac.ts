// web/src/lib/calendar/zodiac.ts
export const SIGNS = [
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

export type SignName = (typeof SIGNS)[number];

export function angleToSign(lon: number): { sign: SignName; deg: number; min: number } {
  const x = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(x / 30);
  const within = x - signIndex * 30;
  const deg = Math.floor(within);
  const min = Math.floor((within - deg) * 60);
  return { sign: SIGNS[signIndex], deg, min };
}

export function fmtSignPos(lon: number): string {
  const p = angleToSign(lon);
  return `${p.deg}° ${p.sign.slice(0, 3)} ${String(p.min).padStart(2, "0")}'`;
}

export function nextSignBoundary(lon: number): number {
  const x = ((lon % 360) + 360) % 360;
  const next = (Math.floor(x / 30) + 1) * 30;
  return next >= 360 ? 0 : next;
}
