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
    // SECURITY: Use generic error message to prevent user enumeration
    // Don't reveal whether an email already exists in the system
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { ok: false, error: "Unable to create account. Please try again or use a different email." };
    }

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
    // Prisma unique constraint (race condition) - use same generic message
    // SECURITY: Don't reveal that the email already exists
    if (e?.code === "P2002") {
      return { ok: false, error: "Unable to create account. Please try again or use a different email." };
    }
    return { ok: false, error: "Signup failed. Please try again." };
  }

  redirect("/profile/setup");
}
