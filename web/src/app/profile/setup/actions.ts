// src/app/profile/setup/actions.ts
"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/requireUser";
import { Prisma } from "@prisma/client";

function toInt(v: FormDataEntryValue | null, name: string) {
  const n = Number(v);
  if (!Number.isFinite(n) || Number.isNaN(n)) throw new Error(`Invalid ${name}`);
  return Math.trunc(n);
}

function toStr(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function getBaseUrl() {
  // Prefer explicit base URL if you have it
  const explicit =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BASE_URL ||
    process.env.APP_URL;

  if (explicit) return explicit.replace(/\/+$/, "");

  // Fallback for server-local calls
  return "http://127.0.0.1:3000";
}

type GeocodeResponse =
  | { ok: true; lat: number; lon: number; display_name?: string }
  | { ok: false; error?: string };

async function geocodeCityState(city: string, state: string) {
  const q = `${city}, ${state}`;
  const base = getBaseUrl();

  const res = await fetch(`${base}/api/geocode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q }),
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as GeocodeResponse | null;
  if (!json || (json as any).ok !== true) {
    const err = (json as any)?.error || `Could not resolve "${q}".`;
    throw new Error(err);
  }

  const lat = Number((json as any).lat);
  const lon = Number((json as any).lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Geocoder returned invalid coordinates.");
  }

  return {
    q,
    lat,
    lon,
    displayName: (json as any).display_name as string | undefined,
  };
}

export async function saveProfileSetup(formData: FormData) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const birthYear = toInt(formData.get("birthYear"), "birthYear");
  const birthMonth = toInt(formData.get("birthMonth"), "birthMonth");
  const birthDay = toInt(formData.get("birthDay"), "birthDay");
  const birthHour = toInt(formData.get("birthHour"), "birthHour");
  const birthMinute = toInt(formData.get("birthMinute"), "birthMinute");

  // ✅ City/State are now required because they power the lat/lon resolution
  const city = toStr(formData.get("city"));
  const state = toStr(formData.get("state"));
  if (!city || !state) {
    throw new Error("City and state are required.");
  }

  const timezone = toStr(formData.get("timezone")) ?? "America/New_York";

  // Optional label; if empty we will store geocoder display_name
  const birthPlace = toStr(formData.get("birthPlace"));

  // ✅ Resolve lat/lon from City/State
  const geo = await geocodeCityState(city, state);

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      city,
      state,

      birthYear,
      birthMonth,
      birthDay,
      birthHour,
      birthMinute,

      birthLat: geo.lat,
      birthLon: geo.lon,
      birthPlace: geo.displayName ?? birthPlace ?? geo.q,
      timezone,

      setupDone: true,
    },
    update: {
      city,
      state,

      birthYear,
      birthMonth,
      birthDay,
      birthHour,
      birthMinute,

      birthLat: geo.lat,
      birthLon: geo.lon,
      birthPlace: geo.displayName ?? birthPlace ?? geo.q,
      timezone,

      setupDone: true,

      // Clear caches so /profile regenerates clean
      natalChartJson: Prisma.DbNull,
      natalUpdatedAt: null,
      ascYearJson: Prisma.DbNull,
      lunationJson: Prisma.DbNull,
      asOfDate: null,
      dailyUpdatedAt: null,
    },
  });

  redirect("/profile");
}
