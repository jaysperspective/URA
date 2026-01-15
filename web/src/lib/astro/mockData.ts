// src/lib/astro/mockData.ts
// Mock planetary position generator for development when astro-service is unavailable

export type MockChartParams = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
};

export type PlanetPosition = {
  lon: number;
  lat: number;
  speed: number;
};

export type ChartData = {
  julianDay: number;
  planets: {
    sun: PlanetPosition;
    moon: PlanetPosition;
    mercury: PlanetPosition;
    venus: PlanetPosition;
    mars: PlanetPosition;
    jupiter: PlanetPosition;
    saturn: PlanetPosition;
    uranus: PlanetPosition;
    neptune: PlanetPosition;
    pluto: PlanetPosition;
    chiron: PlanetPosition;
    northNode: PlanetPosition;
    southNode: PlanetPosition;
  };
  houses: number[];
  ascendant: number | null;
  mc: number | null;
  _mock?: boolean;
  _mockReason?: string;
};

export type ChartResponse = {
  ok: boolean;
  data?: ChartData;
  error?: string;
};

/**
 * Calculate Julian Day for the given date/time.
 * Simplified algorithm for mock purposes.
 */
function calculateJulianDay(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  return jdn + (hour + minute / 60) / 24 - 0.5;
}

/**
 * Normalize angle to 0-360 range.
 */
function norm360(angle: number): number {
  const n = angle % 360;
  return n < 0 ? n + 360 : n;
}

/**
 * Generate deterministic mock planetary positions based on date.
 * Uses simplified astronomical algorithms for approximation.
 */
function generateMockPlanetaryPositions(params: MockChartParams): ChartData["planets"] {
  const { year, month, day, hour, minute } = params;

  // Base seed from date components for deterministic results
  const jd = calculateJulianDay(year, month, day, hour, minute);
  const d = jd - 2451545.0; // Days since J2000.0

  // Approximate Sun position (simplified)
  // Mean longitude of Sun at J2000.0 is ~280.46, moves ~0.9856 deg/day
  const sunMeanLon = 280.46 + 0.9856474 * d;
  const sunLon = norm360(sunMeanLon);

  // Approximate Moon position (simplified)
  // Moon moves ~13.176 degrees per day
  const moonMeanLon = 218.32 + 13.176396 * d;
  const moonLon = norm360(moonMeanLon);

  // Mercury (synodic period ~116 days, mean motion ~4.09 deg/day from Sun)
  const mercuryOffset = norm360(d * 4.09) % 56 - 28; // Max elongation ~28 deg
  const mercuryLon = norm360(sunLon + mercuryOffset);

  // Venus (synodic period ~584 days, mean motion ~1.6 deg/day from Sun)
  const venusOffset = norm360(d * 1.6) % 94 - 47; // Max elongation ~47 deg
  const venusLon = norm360(sunLon + venusOffset);

  // Mars (synodic period ~780 days, sidereal period ~687 days)
  const marsLon = norm360(355.45 + 0.5240207 * d);

  // Jupiter (sidereal period ~11.86 years)
  const jupiterLon = norm360(34.40 + 0.0830853 * d);

  // Saturn (sidereal period ~29.46 years)
  const saturnLon = norm360(50.08 + 0.0334979 * d);

  // Uranus (sidereal period ~84 years)
  const uranusLon = norm360(314.06 + 0.0117087 * d);

  // Neptune (sidereal period ~165 years)
  const neptuneLon = norm360(304.35 + 0.0060145 * d);

  // Pluto (sidereal period ~248 years)
  const plutoLon = norm360(238.96 + 0.0039750 * d);

  // Chiron (orbital period ~50.7 years)
  const chironLon = norm360(170.0 + 0.0194503 * d);

  // North Node (regresses ~19.35 years)
  const northNodeLon = norm360(125.04 - 0.0529539 * d);
  const southNodeLon = norm360(northNodeLon + 180);

  return {
    sun: { lon: sunLon, lat: 0, speed: 0.9856 },
    moon: { lon: moonLon, lat: -2 + (d % 5), speed: 13.176 },
    mercury: { lon: mercuryLon, lat: 0, speed: 1.2 },
    venus: { lon: venusLon, lat: 0, speed: 1.1 },
    mars: { lon: marsLon, lat: 0, speed: 0.524 },
    jupiter: { lon: jupiterLon, lat: 0, speed: 0.083 },
    saturn: { lon: saturnLon, lat: 0, speed: 0.033 },
    uranus: { lon: uranusLon, lat: 0, speed: 0.012 },
    neptune: { lon: neptuneLon, lat: 0, speed: 0.006 },
    pluto: { lon: plutoLon, lat: 0, speed: 0.004 },
    chiron: { lon: chironLon, lat: 0, speed: 0.019 },
    northNode: { lon: northNodeLon, lat: 0, speed: -0.053 },
    southNode: { lon: southNodeLon, lat: 0, speed: -0.053 },
  };
}

/**
 * Calculate simplified Ascendant.
 */
function calculateAscendant(
  jd: number,
  latitude: number,
  longitude: number
): number {
  // Local Sidereal Time approximation
  const d = jd - 2451545.0;
  const gmst = norm360(280.46061837 + 360.98564736629 * d);
  const lst = norm360(gmst + longitude);

  // Obliquity of ecliptic (~23.44 degrees)
  const obliquity = 23.44;
  const oblRad = (obliquity * Math.PI) / 180;
  const latRad = (latitude * Math.PI) / 180;
  const lstRad = (lst * Math.PI) / 180;

  // Simplified ascendant calculation
  const ascRad = Math.atan2(
    Math.cos(lstRad),
    -(
      Math.sin(lstRad) * Math.cos(oblRad) +
      Math.tan(latRad) * Math.sin(oblRad)
    )
  );

  return norm360((ascRad * 180) / Math.PI);
}

/**
 * Generate house cusps using Equal House system.
 */
function generateHouseCusps(ascendant: number): number[] {
  return Array.from({ length: 12 }, (_, i) => norm360(ascendant + i * 30));
}

/**
 * Generate a complete mock chart response.
 */
export function generateMockChartResponse(params: MockChartParams): ChartResponse {
  const { year, month, day, hour, minute, latitude, longitude } = params;

  const julianDay = calculateJulianDay(year, month, day, hour, minute);
  const planets = generateMockPlanetaryPositions(params);
  const ascendant = calculateAscendant(julianDay, latitude, longitude);
  const mc = norm360(ascendant - 90); // Simplified MC calculation
  const houses = generateHouseCusps(ascendant);

  return {
    ok: true,
    data: {
      julianDay,
      planets,
      houses,
      ascendant,
      mc,
      _mock: true,
      _mockReason: "ASTRO_SERVICE_URL unavailable in development",
    },
  };
}

/**
 * Check if mock mode is enabled.
 * Mock is enabled in development when ENABLE_ASTRO_MOCK is not explicitly false.
 */
export function isMockEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.ENABLE_ASTRO_MOCK !== "false"
  );
}
