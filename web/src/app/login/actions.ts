"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function loginAction(formData: FormData) {
  const email = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user) throw new Error("Invalid email or password.");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new Error("Invalid email or password.");

  await createSession(user.id);
  redirect(user.profile?.setupDone ? "/profile" : "/profile/setup");
}
