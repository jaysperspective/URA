// src/lib/auth.ts
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "ura_session";
const SESSION_DAYS = 30;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function newSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function isCookieSecure() {
  return process.env.COOKIE_SECURE === "true" || process.env.COOKIE_SECURE === "1";
}

export async function createSession(userId: number) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * SESSION_DAYS);

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  const jar = await cookies();

  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isCookieSecure(),
    path: "/",
    expires: expiresAt,
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });

  return token;
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { profile: true } } },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;

  return session.user;
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  // Some Next versions don't type `delete()` on ReadonlyRequestCookies.
  // Setting an expired cookie is the most compatible approach.
  jar.set(SESSION_COOKIE, "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}
