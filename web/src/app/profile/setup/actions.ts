// src/app/profile/setup/actions.ts
"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeUsername(u: string) {
  return u.toLowerCase().replace(/\s+/g, "");
}

export async function saveProfileSetup(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const usernameRaw = clean(formData.get("username"));
  const username = normalizeUsername(usernameRaw);

  const city = clean(formData.get("city")) || null;
  const state = clean(formData.get("state")).toUpperCase() || null;
  const bio = clean(formData.get("bio")) || null;

  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    throw new Error("Username must be 3–24 chars (letters, numbers, underscore).");
  }

  const taken = await prisma.profile.findUnique({ where: { username } });
  if (taken && taken.userId !== user.id) throw new Error("That username is taken.");

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { username, city, state, bio, setupDone: true },
    create: { userId: user.id, username, city, state, bio, setupDone: true },
  });

  redirect("/profile");
}
