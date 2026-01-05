// src/app/api/gann/route.ts
import { NextResponse, NextRequest } from "next/server";

/* -------------------- Rate limiter (copied pattern) -------------------- */
const RATE_WINDOW_MS = 5000;
const RATE_MAX_REQUESTS = 40;

type RateState = { count: number; windowStart: number };
const rateStore = new Map<string, RateState>();

function checkRateLimit(identifier: string) {
  const now = Date.now();
  const existing = rateStore.get(identifier);

  if (!existing) {
    rateStore.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  const elapsed = now - existing.windowStart;

  if (elapsed > RATE_WINDOW_MS) {
    rateStore.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (existing.count >= RATE_MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: RATE_WINDOW_MS - elapsed };
  }

  existing.count += 1;
  rateStore.set(identifier, existing);
  return { allowed: true, retryAfterMs: 0 };
}

/* -------------------- Helpers -------------------- */

function normDeg(deg: number) {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

function roundToTick(value: number, tickSize: number) {
  if (!Number.isFinite(tickSize) || tickSize <= 0) return value;
  return Math.round(value / tickSize) * tickSize;
}

/**
 * Classic Square-of-9 "sqrt step" projection:
 * - 360° corresponds to +2 on the sqrt scale
 * - so deltaSqrt = angle / 180
 * - target = (sqrt(anchor) ± deltaSqrt)^2
 */
function gannTargetsFromAnchor(anchor: number, angles: number[], tickSize: number, includeDownside: boolean) {
  if (!Number.isFinite(anchor) || anchor <= 0) {
    throw new Error("Anchor must be a positive number.");
  }
  const root = Math.sqrt(anchor);

  return angles
    .map((a) => normDeg(a))
    .sort((a, b) => a - b)
    .map((angle) => {
      const deltaSqrt = angle / 180; // key mapping
      const up = roundToTick(Math.pow(root + deltaSqrt, 2), tickSize);
      const downRaw = Math.pow(root - deltaSqrt, 2);
      const down = includeDownside ? roundToTick(downRaw, tickSize) : null;

      return { angle, deltaSqrt, up, down };
    });
}

function personalPosition(anchorDateTime: string, cycleDays: number, angles: number[]) {
  if (!anchorDateTime) throw new Error("anchorDateTime is required.");
  const anchor = new Date(anchorDateTime);
  if (Number.isNaN(anchor.getTime())) throw new Error("Invalid anchorDateTime.");
  if (!Number.isFinite(cycleDays) || cycleDays <= 0) throw new Error("cycleDays must be > 0.");

  const now = new Date();
  const msPerDay = 86400000;

  const elapsedDays = (now.getTime() - anchor.getTime()) / msPerDay;
  const progress01 = ((elapsedDays / cycleDays) % 1 + 1) % 1;
  const markerDeg = progress01 * 360;

  // next boundary times for each requested angle
  const nextBoundaries = angles
    .map((a) => normDeg(a))
    .sort((a, b) => a - b)
    .map((angle) => {
      const target01 = angle / 360;
      // find the next occurrence strictly ahead of current progress
      let delta01 = target01 - progress01;
      if (delta01 <= 0) delta01 += 1;

      const deltaDays = delta01 * cycleDays;
      const at = new Date(now.getTime() + deltaDays * msPerDay);

      const inHours = Math.round((deltaDays * 24) * 10) / 10;

      return {
        angle,
        at: at.toISOString(),
        inHours,
      };
    });

  return {
    anchorDateTime,
    cycleDays,
    now: now.toISOString(),
    markerDeg,
    progress01,
    nextBoundaries,
  };
}

/* -------------------- Route -------------------- */

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

    const { allowed, retryAfterMs } = checkRateLimit(ip);
    if (!allowed) {
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      return new NextResponse(
        JSON.stringify({ ok: false, error: "Too many requests. Slow down.", retryAfterSeconds }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": String(retryAfterSeconds) },
        }
      );
    }

    const body = await request.json();
    const mode = body?.mode as "market" | "personal";
    const angles = Array.isArray(body?.angles) ? body.angles : [0, 45, 90, 180, 270, 315];

    if (mode === "market") {
      const anchor = Number(body?.anchor);
      const tickSize = Number(body?.tickSize ?? 0.01);
      const includeDownside = Boolean(body?.includeDownside ?? true);

      const targets = gannTargetsFromAnchor(anchor, angles, tickSize, includeDownside);

      return NextResponse.json({
        ok: true,
        mode,
        input: body,
        data: {
          symbol: body?.symbol ?? null,
          anchor,
          tickSize,
          markerDeg: 0, // marker is optional in v1 market mode; we keep ring anchored at 0°
          targets,
        },
      });
    }

    if (mode === "personal") {
      const anchorDateTime = String(body?.anchorDateTime ?? "");
      const cycleDays = Number(body?.cycleDays ?? 365.2425);

      const data = personalPosition(anchorDateTime, cycleDays, angles);

      return NextResponse.json({
        ok: true,
        mode,
        input: body,
        data,
      });
    }

    return NextResponse.json({ ok: false, error: "Invalid mode. Use 'market' or 'personal'." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
