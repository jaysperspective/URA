// src/__tests__/mocks/handlers.ts
// MSW request handlers for testing

import { http, HttpResponse } from "msw";
import { mockChartResponse, mockHealthResponse } from "./astroMockData";

const ASTRO_URL = "http://127.0.0.1:3002";

export const handlers = [
  // Astro service health check
  http.get(ASTRO_URL, () => {
    return HttpResponse.json(mockHealthResponse);
  }),

  // Astro service chart endpoint
  http.post(`${ASTRO_URL}/chart`, () => {
    return HttpResponse.json(mockChartResponse);
  }),

  // Astro service natal endpoint (legacy)
  http.post(`${ASTRO_URL}/natal`, () => {
    return HttpResponse.json(mockChartResponse);
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = {
  astroServiceDown: http.post(`${ASTRO_URL}/chart`, () => {
    return HttpResponse.error();
  }),

  astroService500: http.post(`${ASTRO_URL}/chart`, () => {
    return HttpResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }),

  astroService400: http.post(`${ASTRO_URL}/chart`, () => {
    return HttpResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }),
};
