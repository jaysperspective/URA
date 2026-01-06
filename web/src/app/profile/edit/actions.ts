// src/app/profile/edit/actions.ts
"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import { ensureProfileCaches } from "@/lib/profile/ensureProfileCaches";
import { prisma } from "@/lib/prisma";


function n(v: FormDataEntryValue | null) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s.length) return null;
  const num = Number(s);
  return Number.isFinite(num) ? num : null;
}

function s(v: FormDataEntryValue | null) {
  if (v == null) return "";
  return String(v).trim();
}

export async function saveProfileEditsAction(formData: FormData) {
  const user = await requireUser();

  const username = s(formData.get("username"));
  const timezone = s(formData.get("timezone")) || "America/New_York";
  const city = s(formData.get("city"));
  const state = s(formData.get("state"));

  const lat = n(formData.get("lat"));
  const lon = n(formData.get("lon"));

  const birthYear = n(formData.get("birthYear"));
  const birthMonth = n(formData.get("birthMonth"));
  const birthDay = n(formData.get("birthDay"));
  const birthHour = n(formData.get("birthHour"));
  const birthMinute = n(formData.get("birthMinute"));

  // image url: prefer hidden input (upload result), but allow the text field
  const imageUrlHidden = s(formData.get("imageUrl"));
  const imageUrlText = s(formData.get("imageUrlText"));
  const imageUrl = (imageUrlHidden || imageUrlText || "").trim() || null;

  // ✅ Update your profile row
  // IMPORTANT: adjust field names to match your Prisma Profile model.
  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      username,
      timezone,
      city,
      state,
      // if your schema uses lat/lon
      lat: lat ?? null,
      lon: lon ?? null,

      // birth fields (adjust if named differently)
      birthYear: birthYear ?? null,
      birthMonth: birthMonth ?? null,
      birthDay: birthDay ?? null,
      birthHour: birthHour ?? null,
      birthMinute: birthMinute ?? null,

      imageUrl,
      setupDone: true,
    } as any,
  });

  // ✅ Recompute caches right away (natal/asc-year/lunation)
  await ensureProfileCaches(user.id);

  redirect("/profile");
}
