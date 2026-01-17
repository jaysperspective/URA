"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export type LoginState = {
  ok: boolean;
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));
  const returnToRaw = clean(formData.get("returnTo"));

  if (!email || !email.includes("@")) return { ok: false, error: "Enter a valid email." };
  if (!password) return { ok: false, error: "Enter your password." };

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user) return { ok: false, error: "Invalid email or password." };

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { ok: false, error: "Invalid email or password." };

  await createSession(user.id);

  // Determine redirect target
  if (!user.profile?.setupDone) {
    redirect("/profile/setup");
  }

  // If returnTo is provided and is a valid relative path, use it
  // Reject protocol-relative URLs (e.g., "//evil.com") to prevent open redirect
  if (returnToRaw && returnToRaw.startsWith("/") && !returnToRaw.startsWith("//")) {
    redirect(returnToRaw);
  }

  redirect("/profile");
}
