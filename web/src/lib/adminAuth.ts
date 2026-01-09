import crypto from "crypto";

const COOKIE_NAME = "ura_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function hmac(secret: string, data: string) {
  return b64url(crypto.createHmac("sha256", secret).update(data).digest());
}

export function makeAdminCookieValue(secret: string) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + MAX_AGE_SECONDS;
  const payload = `v1.${exp}`;
  const sig = hmac(secret, payload);
  return `${payload}.${sig}`;
}

export function verifyAdminCookieValue(secret: string, value?: string | null) {
  if (!value) return false;

  const parts = value.split(".");
  if (parts.length !== 3) return false;

  const [v, expStr, sig] = parts;
  if (v !== "v1") return false;

  const exp = Number(expStr);
  if (!Number.isFinite(exp)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (now > exp) return false;

  const payload = `v1.${exp}`;
  const expected = hmac(secret, payload);

  // constant-time compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export const adminCookie = { name: COOKIE_NAME, maxAgeSeconds: MAX_AGE_SECONDS };
