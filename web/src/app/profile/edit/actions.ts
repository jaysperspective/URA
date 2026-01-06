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

function hasNumber(x: any) {
  return typeof x === "number" && Number.isFinite(x);
}

function getCoordsFromProfile(p: any): { lat: number | null; lon: number | null } {
  // Try common field names (support whichever exists in your schema)
  const lat =
    (hasNumber(p?.lat) ? p.lat : null) ??
    (hasNumber(p?.latitude) ? p.latitude : null) ??
    (hasNumber(p?.birthLat) ? p.birthLat : null) ??
    (hasNumber(p?.birthLatitude) ? p.birthLatitude : null) ??
    null;

  const lon =
    (hasNumber(p?.lon) ? p.lon : null) ??
    (hasNumber(p?.longitude) ? p.longitude : null) ??
    (hasNumber(p?.birthLon) ? p.birthLon : null) ??
    (hasNumber(p?.birthLongitude) ? p.birthLongitude : null) ??
    null;

  return { lat, lon };
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

  // ✅ Don't select lat/lon fields until we know they exist in schema.
  // Pull the record and do runtime checks.
  const existing = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  if (!existing) redirect("/profile?error=missing_profile");

  const username = s(form.get("username")) ?? (existing as any).username ?? null;
  const timezone = s(form.get("timezone")) ?? (existing as any).timezone ?? "America/New_York";
  const city = s(form.get("city")) ?? (existing as any).city ?? null;
  const state = s(form.get("state")) ?? (existing as any).state ?? null;

  const birthYear = n(form.get("birthYear")) ?? (existing as any).birthYear ?? null;
  const birthMonth = n(form.get("birthMonth")) ?? (existing as any).birthMonth ?? null;
  const birthDay = n(form.get("birthDay")) ?? (existing as any).birthDay ?? null;
  const birthHour = n(form.get("birthHour")) ?? (existing as any).birthHour ?? null;
  const birthMinute = n(form.get("birthMinute")) ?? (existing as any).birthMinute ?? null;

  const formLat = n(form.get("lat"));
  const formLon = n(form.get("lon"));

  const existingCoords = getCoordsFromProfile(existing);

  // ✅ preserve existing coords unless form provides new coords
  let finalLat = formLat ?? existingCoords.lat;
  let finalLon = formLon ?? existingCoords.lon;

  // ✅ server fallback geocode if still missing
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

  // ✅ Build update payload safely: only include coord fields that exist in your schema record
  const data: any = {
    username,
    timezone,
    city,
    state,
    birthYear,
    birthMonth,
    birthDay,
    birthHour,
    birthMinute,
    setupDone: true,
  };

  // choose where to write coords based on what exists on the record
  if ("lat" in (existing as any)) data.lat = finalLat;
  else if ("latitude" in (existing as any)) data.latitude = finalLat;
  else if ("birthLat" in (existing as any)) data.birthLat = finalLat;
  else if ("birthLatitude" in (existing as any)) data.birthLatitude = finalLat;

  if ("lon" in (existing as any)) data.lon = finalLon;
  else if ("longitude" in (existing as any)) data.longitude = finalLon;
  else if ("birthLon" in (existing as any)) data.birthLon = finalLon;
  else if ("birthLongitude" in (existing as any)) data.birthLongitude = finalLon;

  await prisma.profile.update({
    where: { id: (existing as any).id },
    data,
  });

  try {
    await ensureProfileCaches(user.id);
  } catch (e: any) {
    const msg = encodeURIComponent(e?.message || "cache_build_failed");
    redirect(`/profile/edit?error=${msg}`);
  }

  redirect("/profile");
}
