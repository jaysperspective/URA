// src/app/api/astrology/natal/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/prisma";
import { ensureProfileCaches } from "@/lib/profile/ensureProfileCaches";

function norm360(d: number) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"] as const;

function signFromLon(lon: number) {
  return SIGNS[Math.floor(norm360(lon) / 30) % 12];
}

function planetNameFromKey(k: string) {
  const map: Record<string, string> = {
    sun: "Sun",
    moon: "Moon",
    mercury: "Mercury",
    venus: "Venus",
    mars: "Mars",
    jupiter: "Jupiter",
    saturn: "Saturn",
    uranus: "Uranus",
    neptune: "Neptune",
    pluto: "Pluto",
    chiron: "Chiron",
    northNode: "North Node",
    southNode: "South Node",
    asc: "ASC",
    mc: "MC",
  };
  return map[k] ?? k;
}

/**
 * Try to extract natal planet longitudes + house numbers from whatever your cache stores.
 * You will likely only need to adjust this function to match your actual schema.
 */
async function getNatalFromCache(userId: string): Promise<{
  planets: Record<string, { lon: number; house?: number | null }>;
  angles?: { ascLon?: number | null; mcLon?: number | null };
} | null> {
  // 1) Best: ensureProfileCaches already knows how to build / read it.
  try {
    const caches: any = await ensureProfileCaches(userId);

    // Common patterns we’ve seen in URA:
    // caches.natal, caches.natalChart, caches.profile?.natalChart, etc.
    const natal = caches?.natal ?? caches?.natalChart ?? caches?.profile?.natalChart ?? caches?.profile?.natal ?? null;
    if (natal) {
      // Try to normalize a few plausible shapes:
      // A) natal.planets = { sun:{lon,house}, ... }
      if (natal.planets && typeof natal.planets === "object") {
        const planets: Record<string, { lon: number; house?: number | null }> = {};
        for (const [k, v] of Object.entries<any>(natal.planets)) {
          const lon = typeof v?.lon === "number" ? v.lon : typeof v === "number" ? v : null;
          if (typeof lon === "number") {
            planets[k] = { lon, house: typeof v?.house === "number" ? v.house : null };
          }
        }
        if (Object.keys(planets).length) {
          return {
            planets,
            angles: {
              ascLon: typeof natal.ascLon === "number" ? natal.ascLon : typeof natal.asc?.lon === "number" ? natal.asc.lon : null,
              mcLon: typeof natal.mcLon === "number" ? natal.mcLon : typeof natal.mc?.lon === "number" ? natal.mc.lon : null,
            },
          };
        }
      }

      // B) natalPlanets = {
