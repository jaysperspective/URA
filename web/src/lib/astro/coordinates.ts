export type PlanetPos = {
  name: string;         // "Sun", "Moon", "Mars" etc.
  longitude: number;    // 0–360 ecliptic longitude (tropical)
};

export function normalizeToAsc(deg: number, ascDeg: number): number {
  return (deg - ascDeg + 360) % 360;
}

export function degToX(
  normalizedDeg: number,
  width: number
): number {
  return (normalizedDeg / 360) * width;
}
