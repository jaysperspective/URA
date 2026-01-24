// src/app/api/human-design/route.ts
// Human Design API endpoint with caching

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  computeHumanDesign,
  hashBirthData,
  HD_VERSION,
  type HumanDesignProfile,
  type BirthData,
} from "@/lib/humandesign";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HDCacheStatus = "hit" | "miss" | "stale" | "error";

type ApiResponse = {
  ok: boolean;
  cached?: boolean;
  cacheStatus?: HDCacheStatus;
  humanDesign?: HumanDesignProfile;
  error?: string;
};

/**
 * Check if cached HD data is valid
 */
function isCacheValid(
  profile: {
    humanDesignJson: unknown;
    humanDesignVersion: number | null;
    humanDesignBirthHash: string | null;
  },
  currentBirthHash: string
): boolean {
  if (!profile.humanDesignJson) return false;
  if (profile.humanDesignVersion !== HD_VERSION) return false;
  if (profile.humanDesignBirthHash !== currentBirthHash) return false;
  return true;
}

/**
 * GET /api/human-design
 * Returns cached Human Design data or computes it if not available
 */
export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Load profile with HD cache fields
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: {
        birthYear: true,
        birthMonth: true,
        birthDay: true,
        birthHour: true,
        birthMinute: true,
        birthLat: true,
        birthLon: true,
        timezone: true,
        setupDone: true,
        humanDesignJson: true,
        humanDesignVersion: true,
        humanDesignBirthHash: true,
        humanDesignUpdatedAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    if (!profile.setupDone) {
      return NextResponse.json({ ok: false, error: "Profile setup incomplete" }, { status: 400 });
    }

    // 3. Check birth data completeness
    if (
      profile.birthYear === null ||
      profile.birthMonth === null ||
      profile.birthDay === null ||
      profile.birthHour === null ||
      profile.birthMinute === null ||
      profile.birthLat === null ||
      profile.birthLon === null
    ) {
      return NextResponse.json(
        { ok: false, error: "Incomplete birth data for Human Design calculation" },
        { status: 400 }
      );
    }

    // 4. Build birth data and hash
    const birthData: BirthData = {
      year: profile.birthYear,
      month: profile.birthMonth,
      day: profile.birthDay,
      hour: profile.birthHour,
      minute: profile.birthMinute,
      lat: profile.birthLat,
      lon: profile.birthLon,
      timezone: profile.timezone,
    };

    const birthHash = hashBirthData(birthData);

    // 5. Check cache validity
    const cacheValid = isCacheValid(
      {
        humanDesignJson: profile.humanDesignJson,
        humanDesignVersion: profile.humanDesignVersion,
        humanDesignBirthHash: profile.humanDesignBirthHash,
      },
      birthHash
    );

    if (cacheValid && profile.humanDesignJson) {
      // Cache hit - return cached data
      return NextResponse.json({
        ok: true,
        cached: true,
        cacheStatus: "hit",
        humanDesign: profile.humanDesignJson as HumanDesignProfile,
      });
    }

    // 6. Cache miss or stale - compute HD
    console.log(`[HD API] Computing Human Design for user ${user.id}`);

    const hdProfile = await computeHumanDesign(birthData);

    if (!hdProfile) {
      return NextResponse.json(
        { ok: false, error: "Failed to compute Human Design", cacheStatus: "error" },
        { status: 500 }
      );
    }

    // 7. Save to cache
    await prisma.profile.update({
      where: { userId: user.id },
      data: {
        humanDesignJson: JSON.parse(JSON.stringify(hdProfile)),
        humanDesignVersion: HD_VERSION,
        humanDesignBirthHash: birthHash,
        humanDesignUpdatedAt: new Date(),
      },
    });

    console.log(`[HD API] Cached Human Design for user ${user.id}`);

    return NextResponse.json({
      ok: true,
      cached: false,
      cacheStatus: profile.humanDesignJson ? "stale" : "miss",
      humanDesign: hdProfile,
    });
  } catch (err) {
    console.error("[HD API] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error",
        cacheStatus: "error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/human-design
 * Force recompute Human Design (ignores cache)
 */
export async function POST(): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Load profile
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: {
        birthYear: true,
        birthMonth: true,
        birthDay: true,
        birthHour: true,
        birthMinute: true,
        birthLat: true,
        birthLon: true,
        timezone: true,
        setupDone: true,
      },
    });

    if (!profile || !profile.setupDone) {
      return NextResponse.json({ ok: false, error: "Profile not ready" }, { status: 400 });
    }

    // 3. Check birth data completeness
    if (
      profile.birthYear === null ||
      profile.birthMonth === null ||
      profile.birthDay === null ||
      profile.birthHour === null ||
      profile.birthMinute === null ||
      profile.birthLat === null ||
      profile.birthLon === null
    ) {
      return NextResponse.json(
        { ok: false, error: "Incomplete birth data" },
        { status: 400 }
      );
    }

    // 4. Build birth data
    const birthData: BirthData = {
      year: profile.birthYear,
      month: profile.birthMonth,
      day: profile.birthDay,
      hour: profile.birthHour,
      minute: profile.birthMinute,
      lat: profile.birthLat,
      lon: profile.birthLon,
      timezone: profile.timezone,
    };

    const birthHash = hashBirthData(birthData);

    // 5. Compute HD (force recompute)
    console.log(`[HD API] Force recomputing Human Design for user ${user.id}`);

    const hdProfile = await computeHumanDesign(birthData);

    if (!hdProfile) {
      return NextResponse.json(
        { ok: false, error: "Failed to compute Human Design" },
        { status: 500 }
      );
    }

    // 6. Save to cache
    await prisma.profile.update({
      where: { userId: user.id },
      data: {
        humanDesignJson: JSON.parse(JSON.stringify(hdProfile)),
        humanDesignVersion: HD_VERSION,
        humanDesignBirthHash: birthHash,
        humanDesignUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      cached: false,
      cacheStatus: "miss",
      humanDesign: hdProfile,
    });
  } catch (err) {
    console.error("[HD API] Error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
