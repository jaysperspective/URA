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

async function geocodeCityState(q: string): Promise<{ lat: number; lon: number; display_name?: string } | null> {
  const query = q.trim();
  if (!query) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "User-Agent": "URA-Geocoder/1.0",
      "Accept-Language": "en",
    },
    // avoid caching surprises in server actions
    cache: "no-store",
  });

  if (!res.ok) return null;
  const json = (await res.json()) as any[];
  if (!Array.isArray(json) || json.length === 0) return null;

  const top = json[0];
  const lat = Number(top.lat);
  const lon = Number(top.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { lat, lon, display_name: String(top.display_name || query) };
}

export async function saveProfileEditAction(form: FormData) {
  const user = await requireUser();

  const existing = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      username: true,
      birthYear: true,
      birthMonth: true,
      birthDay: true,
      birthHour: true,
      birthMinute: true,
      city: true,
      state: true,
      timezone: true,
      lat: true,
      lon: true,
    },
  });

  if (!existing) redirect("/profile?error=missing_profile");

  // inputs
  const username = s(form.get("username")) ?? existing.username ?? null;
  const timezone = s(form.get("timezone")) ?? existing.timezone ?? "America/New_York";
  const city = s(form.get("city")) ?? existing.city ?? null;
  const state = s(form.get("state")) ?? existing.state ?? null;

  const birthYear = n(form.get("birthYear")) ?? existing.birthYear ?? null;
  const birthMonth = n(form.get("birthMonth")) ?? existing.birthMonth ?? null;
  const birthDay = n(form.get("birthDay")) ?? existing.birthDay ?? null;
  const birthHour = n(form.get("birthHour")) ?? existing.birthHour ?? null;
  const birthMinute = n(form.get("birthMinute")) ?? existing.birthMinute ?? null;

  const formLat = n(form.get("lat"));
  const formLon = n(form.get("lon"));

  // ✅ preserve coords unless valid new ones provided
  let finalLat = formLat ?? existing.lat ?? null;
  let finalLon = formLon ?? existing.lon ?? null;

  // ✅ if coords still missing, geocode from city/state (server-side fallback)
  if (finalLat == null || finalLon == null) {
    const q = [city, state].filter(Boolean).join(", ");
    const g = await geocodeCityState(q);
    if (g) {
      finalLat = g.lat;
      finalLon = g.lon;
    }
  }

  if (finalLat == null || finalLon == null) {
    redirect("/profile/edit?error=missing_latlon");
  }

  await prisma.profile.update({
    where: { id: existing.id },
    data: {
      username,
      timezone,
      city,
      state,

      birthYear: birthYear ?? undefined,
      birthMonth: birthMonth ?? undefined,
      birthDay: birthDay ?? undefined,
      birthHour: birthHour ?? undefined,
      birthMinute: birthMinute ?? undefined,

      lat: finalLat,
      lon: finalLon,

      setupDone: true,
    },
  });

  try {
    await ensureProfileCaches(user.id);
  } catch (e: any) {
    const msg = encodeURIComponent(e?.message || "cache_build_failed");
    redirect(`/profile/edit?error=${msg}`);
  }

  redirect("/profile");
}
