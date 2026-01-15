// src/__tests__/mocks/astroMockData.ts
// Mock responses for astro-service in tests

export const mockChartResponse = {
  ok: true,
  data: {
    julianDay: 2447917.0,
    planets: {
      sun: { lon: 303.5, lat: 0, speed: 0.9856 },
      moon: { lon: 127.3, lat: -2.1, speed: 13.176 },
      mercury: { lon: 285.2, lat: 0, speed: 1.2 },
      venus: { lon: 315.8, lat: 0, speed: 1.1 },
      mars: { lon: 252.1, lat: 0, speed: 0.524 },
      jupiter: { lon: 91.3, lat: 0, speed: 0.083 },
      saturn: { lon: 288.7, lat: 0, speed: 0.033 },
      uranus: { lon: 279.4, lat: 0, speed: 0.012 },
      neptune: { lon: 284.2, lat: 0, speed: 0.006 },
      pluto: { lon: 227.8, lat: 0, speed: 0.004 },
      chiron: { lon: 93.5, lat: 0, speed: 0.019 },
      northNode: { lon: 315.2, lat: 0, speed: -0.053 },
      southNode: { lon: 135.2, lat: 0, speed: -0.053 },
    },
    houses: [120.5, 145.2, 175.0, 210.5, 245.2, 280.0, 300.5, 325.2, 355.0, 30.5, 65.2, 95.0],
    ascendant: 120.5,
    mc: 30.2,
  },
};

export const mockHealthResponse = {
  ok: true,
  service: "astro-service",
  message: "Astro microservice is online",
};

export function createMockChartResponse(overrides?: Partial<typeof mockChartResponse.data>) {
  return {
    ok: true,
    data: {
      ...mockChartResponse.data,
      ...overrides,
    },
  };
}
