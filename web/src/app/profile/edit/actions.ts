// src/app/profile/edit/actions.ts
"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/requireUser";
import { ensureProfileCaches } from "@/lib/profile/ensureProfileCaches";

function s(v: FormDataEntryValue | null) {
  const t = typeof v === "string" ? v.trim() : "";
  return t.length ? t : null;
}

function n(v: FormDataEntryValue | null) {
  if (v == null) return null;
  const t = typeof v === "string" ? v.trim() : "";
  if (!t) return null;
  const num = Number(t);
  return Number.isFinite(num) ? num : null;
}

function hasNum(x: any): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

function getBaseUrl() {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    null;

  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/$/, "");

  return "http://127.0.0.1:3000";
}

async function geocodeViaApi(q: string): Promise<{ lat: number; lon: number; display_name?: string } | null> {
  const query = q.trim();
  if (!query) return null;

  const base = getBaseUrl();
  const res = await fetch(`${base}/api/geocode`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ q: query }),
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) return null;

  const lat = Number(json.lat);
  const lon = Number(json.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { lat, lon, display_name: String(json.display_name || query) };
}

function isSetupComplete(p: {
  birthYear: number | null;
  birthMonth: number | null;
  birthDay: number | null;
  birthHour: number | null;
  birthMinute: number | null;
  birthLat: number | null;
  birthLon: number | null;
}) {
  return (
    typeof p.birthYear === "number" &&
    typeof p.birthMonth === "number" &&
    typeof p.birthDay === "number" &&
    typeof p.birthHour === "number" &&
    typeof p.birthMinute === "number" &&
    typeof p.birthLat === "number" &&
    typeof p.birthLon === "number"
  );
}

export async function saveProfileEditAction(form: FormData) {
  const user = await requireUser();

  const existing = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      username: true,
      bio: true,
      city: true,
      state: true,
      timezone: true,

      birthPlace: true,
      birthLat: true,
      birthLon: true,

      birthYear: true,
      birthMonth: true,
      birthDay: true,
      birthHour: true,
      birthMinute: true,

      avatarUrl: true,
      setupDone: true,
    },
  });

  if (!existing) redirect("/profile?error=missing_profile");

  const username = s(form.get("username")) ?? existing.username ?? null;
  const bio = s(form.get("bio")) ?? existing.bio ?? null;

  const timezone = s(form.get("timezone")) ?? existing.timezone ?? "America/New_York";

  const city = s(form.get("city")) ?? existing.city ?? null;
  const state = s(form.get("state")) ?? existing.state ?? null;

  // ✅ Birth place label (authoritative input for geocoding + display)
  let birthPlace = s(form.get("birthPlace")) ?? existing.birthPlace ?? null;

  const birthYear = n(form.get("birthYear")) ?? existing.birthYear ?? null;
  const birthMonth = n(form.get("birthMonth")) ?? existing.birthMonth ?? null;
  const birthDay = n(form.get("birthDay")) ?? existing.birthDay ?? null;
  const birthHour = n(form.get("birthHour")) ?? existing.birthHour ?? null;
  const birthMinute = n(form.get("birthMinute")) ?? existing.birthMinute ?? null;

  // From client (hidden inputs)
  const formLat = n(form.get("lat"));
  const formLon = n(form.get("lon"));

  // Preserve existing coords unless overwritten
  let finalLat = hasNum(formLat) ? formLat : hasNum(existing.birthLat) ? existing.birthLat : null;
  let finalLon = hasNum(formLon) ? formLon : hasNum(existing.birthLon) ? existing.birthLon : null;

  // If coords still missing, geocode server-side via /api/geocode
  if (finalLat == null || finalLon == null) {
    const q1 = birthPlace?.trim() || "";
    const q2 = [city, state].filter(Boolean).join(", ");

    const g = (await geocodeViaApi(q1)) ?? (await geocodeViaApi(q2));
    if (g) {
      finalLat = g.lat;
      finalLon = g.lon;

      // ✅ adopt display label if birthPlace was empty
      if (!birthPlace && g.display_name) birthPlace = g.display_name;
    }
  }

  // If still missing, bounce back to edit
  if (finalLat == null || finalLon == null) {
    redirect("/profile/edit?error=missing_latlon");
  }

  // Avatar: preserve for now (upload wiring later)
  const avatarUrl = s(form.get("avatarUrl")) ?? existing.avatarUrl ?? null;

  // ✅ only set setupDone when we actually have everything needed
  const nextSetupDone = isSetupComplete({
    birthYear,
    birthMonth,
    birthDay,
    birthHour,
    birthMinute,
    birthLat: finalLat,
    birthLon: finalLon,
  });

  await prisma.profile.update({
    where: { id: existing.id },
    data: {
      username,
      bio,
      timezone,
      city,
      state,

      birthPlace,
      birthLat: finalLat,
      birthLon: finalLon,

      birthYear,
      birthMonth,
      birthDay,
      birthHour,
      birthMinute,

      avatarUrl,
      setupDone: nextSetupDone,
    },
  });

  // rebuild caches (natal + asc-year + lunation)
  try {
    await ensureProfileCaches(user.id);
  } catch (e: any) {
    const msg = encodeURIComponent(e?.message || "cache_build_failed");
    redirect(`/profile/edit?error=${msg}`);
  }

  redirect("/profile");
}
