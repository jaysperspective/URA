"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export type SignupState = {
  ok: boolean;
  error?: string;
};

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));
  const displayName = clean(formData.get("displayName"));

  if (!email || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email." };
  }

  if (!password || password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { ok: false, error: "Email already in use." };

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
  } catch (e: any) {
    // Prisma unique constraint (race condition)
    if (e?.code === "P2002") return { ok: false, error: "Email already in use." };
    return { ok: false, error: "Signup failed. Please try again." };
  }

  redirect("/profile/setup");
}
