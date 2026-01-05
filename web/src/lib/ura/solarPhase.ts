// src/lib/ura/solarPhase.ts

export function norm360(d: number) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

export type SolarPhase = {
  phaseId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  phaseIndex0: number;   // 0..7
  degIntoPhase: number;  // 0..45
  progress01: number;    // 0..1
  startDeg: number;      // multiple of 45
  endDeg: number;        // start+45
};

export function solarPhaseFromSunLon(sunLon: number): SolarPhase {
  const lon = norm360(sunLon);
  const phaseIndex0 = Math.floor(lon / 45); // 0..7
  const startDeg = phaseIndex0 * 45;
  const degIntoPhase = lon - startDeg;
  const progress01 = degIntoPhase / 45;

  return {
    phaseId: (phaseIndex0 + 1) as SolarPhase["phaseId"],
    phaseIndex0,
    degIntoPhase,
    progress01,
    startDeg,
    endDeg: startDeg + 45,
  };
}
