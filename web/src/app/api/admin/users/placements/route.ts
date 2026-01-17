// src/app/api/admin/users/placements/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminCookieValue, adminCookie } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function norm360(d: number) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

function signFromLon(lon: number | null | undefined): string | null {
  if (typeof lon !== "number" || !Number.isFinite(lon)) return null;
  return SIGNS[Math.floor(norm360(lon) / 30) % 12];
}

function safeLon(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v && typeof v === "object" && typeof v.lon === "number") return v.lon;
  return null;
}

function extractPlacements(natalJson: any) {
  const planets = natalJson?.data?.planets ?? natalJson?.planets ?? {};

  const sunLon = safeLon(planets?.sun?.lon ?? planets?.sun ?? planets?.Sun?.lon ?? planets?.Sun);
  const moonLon = safeLon(planets?.moon?.lon ?? planets?.moon ?? planets?.Moon?.lon ?? planets?.Moon);

  const asc = safeLon(
    natalJson?.data?.ascendant ??
    natalJson?.data?.angles?.asc ??
    natalJson?.ascendant ??
    natalJson?.angles?.asc
  );

  return {
    sun: signFromLon(sunLon),
    moon: signFromLon(moonLon),
    asc: signFromLon(asc),
  };
}

export async function GET() {
  const cookieSecret = process.env.URA_ADMIN_COOKIE_SECRET || "";
  const jar = await cookies();
  const raw = jar.get(adminCookie.name)?.value;

  if (!cookieSecret || !verifyAdminCookieValue(cookieSecret, raw)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        profile: {
          select: {
            username: true,
            birthYear: true,
            birthMonth: true,
            birthDay: true,
            birthPlace: true,
            natalChartJson: true,
            setupDone: true,
          },
        },
      },
    });

    const result = users.map((u) => {
      const placements = u.profile?.natalChartJson
        ? extractPlacements(u.profile.natalChartJson)
        : { sun: null, moon: null, asc: null };

      // Format birth date from separate fields
      let birthDate: string | null = null;
      if (u.profile?.birthYear && u.profile?.birthMonth && u.profile?.birthDay) {
        const y = u.profile.birthYear;
        const m = String(u.profile.birthMonth).padStart(2, "0");
        const d = String(u.profile.birthDay).padStart(2, "0");
        birthDate = `${y}-${m}-${d}`;
      }

      return {
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        username: u.profile?.username,
        birthDate,
        birthPlace: u.profile?.birthPlace,
        setupDone: u.profile?.setupDone ?? false,
        sun: placements.sun,
        moon: placements.moon,
        asc: placements.asc,
        createdAt: u.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ ok: true, users: result, count: result.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to fetch users" }, { status: 500 });
  }
}
