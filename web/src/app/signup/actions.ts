"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function signupAction(formData: FormData) {
  const email = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));
  const displayName = clean(formData.get("displayName"));

  if (!email || !email.includes("@")) throw new Error("Enter a valid email.");
  if (!password || password.length < 8) throw new Error("Password must be at least 8 characters.");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already in use.");

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: displayName || null,
      profile: { create: { setupDone: false } },
    },
  });

  await createSession(user.id);
  redirect("/profile/setup");
}
