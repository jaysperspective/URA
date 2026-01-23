// src/app/api/moon/synthesis/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { microcopyForPhase, type PhaseId } from "@/lib/phaseMicrocopy";
import { elementForSunSign } from "@/lib/calendar/element";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour fixed TTL (safer than end-of-day calc)
const LOG_PREFIX = "[moon/synthesis]";

// ---------------------------------------------------------------------------
// In-memory cache for daily synthesis (userId-date-sign-phase -> synthesis)
// ---------------------------------------------------------------------------
const synthesisCache = new Map<string, { synthesis: SynthesisResult; expiresAt: number }>();

type SynthesisResult = {
  headline: string;
  guidance: string;
  actionHint: string;
  journalPrompt: string;
  story?: string;
  generatedAt: string;
  expiresAt: string;
};

// ---------------------------------------------------------------------------
// All zodiac signs for validation
// ---------------------------------------------------------------------------
const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
] as const;

const LUNAR_PHASES = [
  "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
  "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLocalDayKey(tz: string, date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;

    return `${y}-${m}-${d}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Build cache key that includes:
 * - userId
 * - date (in user's timezone)
 * - moonSign
 * - lunarPhaseId (CRITICAL: prevents wrong phase being served)
 */
function getCacheKey(userId: number, dateKey: string, moonSign: string, lunarPhaseId: PhaseId): string {
  return `moon:${userId}:${dateKey}:${moonSign}:${lunarPhaseId}`;
}

// Cleanup old cache entries periodically
let lastCleanup = Date.now();
function cleanupCache() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;

  for (const [key, entry] of synthesisCache.entries()) {
    if (entry.expiresAt < now) {
      synthesisCache.delete(key);
    }
  }
}

// Map moon sign to element
function getMoonElement(moonSign: string): string {
  const info = elementForSunSign(moonSign);
  return info.element;
}

// Element meanings (fixed)
const ELEMENT_MEANINGS: Record<string, string> = {
  Fire: "initiating, separating, igniting movement",
  Earth: "stabilizing, grounding, making tangible",
  Air: "clarifying, communicating, organizing thought",
  Water: "sensing, connecting, emotional integration",
};

// Phase name from angle (fallback only - prefer canonical phaseName from API)
function phaseNameFromAngle(angle: number): string {
  const normalized = ((angle % 360) + 360) % 360;
  if (normalized < 22.5) return "New Moon";
  if (normalized < 67.5) return "Waxing Crescent";
  if (normalized < 112.5) return "First Quarter";
  if (normalized < 157.5) return "Waxing Gibbous";
  if (normalized < 202.5) return "Full Moon";
  if (normalized < 247.5) return "Waning Gibbous";
  if (normalized < 292.5) return "Last Quarter";
  if (normalized < 337.5) return "Waning Crescent";
  return "New Moon";
}

// Phase ID from angle (1-8)
function phaseIdFromAngle(angle: number): PhaseId {
  const normalized = ((angle % 360) + 360) % 360;
  const idx = Math.floor((normalized + 22.5) / 45) % 8;
  return ((idx + 1) as PhaseId) || 1;
}

// ---------------------------------------------------------------------------
// LLM Output Validation
// ---------------------------------------------------------------------------

/**
 * Check if text mentions any zodiac sign OTHER than the correct one.
 * Returns the wrong sign found, or null if valid.
 */
function containsWrongSign(text: string, correctSign: string): string | null {
  const lowerText = text.toLowerCase();
  const correctLower = correctSign.toLowerCase();

  for (const sign of ZODIAC_SIGNS) {
    const signLower = sign.toLowerCase();
    if (signLower !== correctLower && lowerText.includes(signLower)) {
      return sign;
    }
  }
  return null;
}

/**
 * Check if text mentions any lunar phase OTHER than the correct one.
 * Returns the wrong phase found, or null if valid.
 */
function containsWrongPhase(text: string, correctPhase: string): string | null {
  const lowerText = text.toLowerCase();
  const correctLower = correctPhase.toLowerCase();

  for (const phase of LUNAR_PHASES) {
    const phaseLower = phase.toLowerCase();
    if (phaseLower !== correctLower && lowerText.includes(phaseLower)) {
      return phase;
    }
  }
  return null;
}

/**
 * Validate LLM output for correctness.
 * Returns { valid: true } or { valid: false, reason: string }
 */
function validateLLMOutput(
  parsed: any,
  correctSign: string,
  correctPhase: string
): { valid: true } | { valid: false; reason: string } {
  // Combine all text fields for validation
  const allText = [
    parsed.headline ?? "",
    parsed.guidance ?? "",
    parsed.actionHint ?? "",
    parsed.journalPrompt ?? "",
    parsed.story ?? "",
  ].join(" ");

  const wrongSign = containsWrongSign(allText, correctSign);
  if (wrongSign) {
    return { valid: false, reason: `LLM mentioned wrong sign: ${wrongSign} (expected ${correctSign})` };
  }

  const wrongPhase = containsWrongPhase(allText, correctPhase);
  if (wrongPhase) {
    return { valid: false, reason: `LLM mentioned wrong phase: ${wrongPhase} (expected ${correctPhase})` };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// LLM Call
// ---------------------------------------------------------------------------

async function callLLM(prompt: string): Promise<{ content: string; model: string; latencyMs: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const t0 = Date.now();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content: `You are generating the Moon Page Daily Synthesis for the URA system.
This is not a horoscope and not freeform astrology writing. It is a grounded orientation brief that must strictly reflect the current lunar state.

CRITICAL RULES:
- You will receive exact values for moonPhaseName, moonSign, moonElement. These are canonical truth.
- You MUST use these exact values. Do not substitute, infer, or change them.
- If your output mentions a different sign than provided, you have failed.
- No predictions. No fate statements. No emojis. No fluff.
- Keep tone calm, practical, and oriented toward action.
- Output valid JSON only.`,
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const json = await res.json();
  const latencyMs = Date.now() - t0;

  if (!res.ok) {
    throw new Error(json?.error?.message || `LLM error (${res.status})`);
  }

  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty LLM response");

  return { content, model, latencyMs };
}

function safeJsonParse(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(s.slice(start, end + 1));
    }
    throw new Error("Failed to parse LLM JSON");
  }
}

// ---------------------------------------------------------------------------
// Synthesis Generation
// ---------------------------------------------------------------------------

function buildMockSynthesis(
  moonPhaseName: string,
  lunarPhaseId: PhaseId,
  moonSign: string,
  moonElement: string
): SynthesisResult {
  const lunar = microcopyForPhase(lunarPhaseId);
  const now = new Date();

  return {
    headline: `${moonPhaseName} in ${moonSign}`,
    guidance: `${lunar.oneLine} The Moon in ${moonSign} brings ${ELEMENT_MEANINGS[moonElement] || "grounded energy"} to this phase.`,
    actionHint: lunar.actionHint || "Start with one clear action.",
    journalPrompt: lunar.journalPrompt,
    generatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
  };
}

async function generateSynthesis(
  moonPhaseName: string,
  lunarPhaseId: PhaseId,
  moonSign: string,
  moonElement: string,
  lunarDay: number | null
): Promise<SynthesisResult> {
  const lunar = microcopyForPhase(lunarPhaseId);
  const now = new Date();
  const elementMeaning = ELEMENT_MEANINGS[moonElement] || "grounded energy";

  // If no API key, return mock
  if (!process.env.OPENAI_API_KEY) {
    console.log(`${LOG_PREFIX} No OPENAI_API_KEY, returning mock synthesis`);
    return buildMockSynthesis(moonPhaseName, lunarPhaseId, moonSign, moonElement);
  }

  const prompt = `
AUTHORITATIVE INPUTS (DO NOT INFER OR SUBSTITUTE - these are canonical truth):
- moonPhaseName: "${moonPhaseName}"
- lunarPhaseNumber: Phase ${lunarPhaseId}
- moonSign: "${moonSign}"
- moonElement: "${moonElement}"
${lunarDay ? `- lunarDayNumber: ${lunarDay}` : ""}

ELEMENT MEANING FOR ${moonElement.toUpperCase()}:
${elementMeaning}

PHASE GUIDANCE (URA System):
- Phase ${lunarPhaseId}: ${lunar.orisha}
- Meaning: ${lunar.oneLine}
- Description: ${lunar.description}

REQUIRED OUTPUT (JSON):
{
  "headline": "${moonPhaseName} in ${moonSign}",
  "guidance": "3-4 sentences max. Sentence 1 anchors the Moon phase (${moonPhaseName}). Sentence 2 anchors the Moon sign (${moonSign}). Sentence 3 anchors the element (${moonElement} = ${elementMeaning}). Optional sentence integrates them. CRITICAL: You MUST mention ${moonSign}, not any other sign.",
  "actionHint": "1 sentence imperative. Must reflect phase + element. Must be realistic for today. No vague self-help language.",
  "journalPrompt": "One reflective question",
  "story": "Optional: 2-3 sentences of human texture illustrating this energy in lived experience. No new signs or planets."
}

FORBIDDEN:
- Do NOT mention any zodiac sign other than ${moonSign}
- Do NOT default to Capricorn/Saturn language
- Do NOT add signs, planets, or archetypes not in the inputs
- Do NOT make predictions

SELF-CHECK: Before responding, verify the sign mentioned is "${moonSign}" (not Capricorn or any other sign).

OUTPUT JSON ONLY:
`.trim();

  const { content, model, latencyMs } = await callLLM(prompt);
  const parsed = safeJsonParse(content);

  // Validate LLM output for wrong signs/phases
  const validation = validateLLMOutput(parsed, moonSign, moonPhaseName);
  if (!validation.valid) {
    console.warn(`${LOG_PREFIX} LLM validation failed: ${validation.reason}. Falling back to mock synthesis.`);
    return buildMockSynthesis(moonPhaseName, lunarPhaseId, moonSign, moonElement);
  }

  console.log(`${LOG_PREFIX} LLM success: model=${model}, latency=${latencyMs}ms, sign=${moonSign}, phase=${moonPhaseName}`);

  return {
    headline: `${moonPhaseName} in ${moonSign}`, // Always force correct title
    guidance: parsed.guidance || lunar.description,
    actionHint: parsed.actionHint || lunar.actionHint || "Start with one clear action.",
    journalPrompt: parsed.journalPrompt || lunar.journalPrompt,
    story: parsed.story,
    generatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Fetch current moon data from /api/calendar (canonical source)
// ---------------------------------------------------------------------------

type MoonData = {
  moonSign: string;
  moonElement: string;
  phaseAngleDeg: number;
  phaseName: string;
  lunarPhaseId: PhaseId;
  lunarDay: number | null;
};

async function getCurrentMoonData(origin: string): Promise<MoonData | { error: string }> {
  try {
    const res = await fetch(`${origin}/api/calendar`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      return { error: `Calendar API returned ${res.status}` };
    }

    const json = await res.json();
    if (!json?.ok) {
      return { error: json?.error || "Calendar API returned ok:false" };
    }

    const astro = json?.astro;
    const lunar = json?.lunar;

    // Log raw lunar fields for debugging
    console.log(`${LOG_PREFIX} Raw lunar fields from /api/calendar:`, {
      phaseName: lunar?.phaseName,
      phaseAngleDeg: lunar?.phaseAngleDeg,
      lunarDay: lunar?.lunarDay,
      // Also log what the old buggy code was reading
      phaseAngle_MISSING: lunar?.phaseAngle,
      separation_MISSING: lunar?.separation,
    });

    const moonSign = astro?.moonSign;
    if (!moonSign) {
      return { error: "Missing moonSign in calendar response" };
    }

    // FIX: Use lunar.phaseName directly as canonical truth (same as Moon UI)
    // This is what the Moon page displays, so synthesis MUST match
    const canonicalPhaseName = lunar?.phaseName;
    if (!canonicalPhaseName) {
      return { error: "Missing phaseName in calendar response" };
    }

    // FIX: Correct field name is phaseAngleDeg, NOT phaseAngle
    // OLD BUGGY CODE: lunar?.phaseAngle ?? lunar?.separation ?? 0
    // This was reading a non-existent field and defaulting to 0!
    const phaseAngleDeg = lunar?.phaseAngleDeg;

    // CRITICAL: If phaseAngleDeg is missing, this is an error state
    // Do NOT silently default to 0 (which would give "New Moon")
    if (typeof phaseAngleDeg !== "number") {
      console.error(`${LOG_PREFIX} CRITICAL: phaseAngleDeg is missing or not a number. This would cause wrong phase!`);
      // We can still proceed using canonical phaseName, but log the issue
    }

    const moonElement = getMoonElement(moonSign);

    // Derive phaseId from angle if available, otherwise from phaseName
    let lunarPhaseId: PhaseId;
    if (typeof phaseAngleDeg === "number") {
      lunarPhaseId = phaseIdFromAngle(phaseAngleDeg);
    } else {
      // Fallback: derive from canonical phaseName
      lunarPhaseId = phaseIdFromPhaseName(canonicalPhaseName);
    }

    const lunarDay = lunar?.lunarDay ?? null;

    // Log resolved values for debugging
    console.log(`${LOG_PREFIX} Resolved moon data:`, {
      moonSign,
      moonElement,
      phaseAngleDeg,
      phaseName: canonicalPhaseName,
      lunarPhaseId,
      lunarDay,
    });

    return {
      moonSign,
      moonElement,
      phaseAngleDeg: phaseAngleDeg ?? 0, // Only used for logging, phaseName is canonical
      phaseName: canonicalPhaseName, // Use canonical phaseName from API
      lunarPhaseId,
      lunarDay,
    };
  } catch (err: any) {
    console.error(`${LOG_PREFIX} Failed to fetch current moon data:`, err);
    return { error: err?.message || "Failed to fetch calendar data" };
  }
}

/**
 * Derive phase ID from phase name (fallback when phaseAngleDeg is missing)
 */
function phaseIdFromPhaseName(phaseName: string): PhaseId {
  const lower = phaseName.toLowerCase();
  if (lower.includes("new moon")) return 1;
  if (lower.includes("waxing crescent")) return 2;
  if (lower.includes("first quarter")) return 3;
  if (lower.includes("waxing gibbous")) return 4;
  if (lower.includes("full moon")) return 5;
  if (lower.includes("waning gibbous")) return 6;
  if (lower.includes("last quarter")) return 7;
  if (lower.includes("waning crescent")) return 8;
  return 1; // Default fallback
}

function buildOrigin(req: Request): string {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "") || "http";
  return `${proto}://${host}`;
}

// ---------------------------------------------------------------------------
// Main Handler
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  cleanupCache();

  // 1. Auth check
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  // 2. Get user profile for timezone
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { timezone: true },
  });

  const tz = profile?.timezone || "America/New_York";
  const todayKey = getLocalDayKey(tz);

  // 3. Fetch CURRENT moon data from canonical source (/api/calendar)
  const origin = buildOrigin(req);
  const moonDataResult = await getCurrentMoonData(origin);

  if ("error" in moonDataResult) {
    console.error(`${LOG_PREFIX} Moon data error:`, moonDataResult.error);
    return NextResponse.json({
      ok: false,
      error: moonDataResult.error,
    }, { status: 500 });
  }

  const { moonSign, moonElement, phaseAngleDeg, phaseName, lunarPhaseId, lunarDay } = moonDataResult;

  // 4. Check cache (key now includes lunarPhaseId to prevent wrong phase)
  const cacheKey = getCacheKey(userId, todayKey, moonSign, lunarPhaseId);
  const cached = synthesisCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    console.log(`${LOG_PREFIX} Cache HIT: key=${cacheKey}`);
    return NextResponse.json({
      ok: true,
      cached: true,
      synthesis: cached.synthesis,
      moonSign,
      moonElement,
      lunarPhaseId,
      phaseName,
    });
  }

  console.log(`${LOG_PREFIX} Cache MISS: key=${cacheKey}`);

  // 5. Generate synthesis with correct moon data
  try {
    const synthesis = await generateSynthesis(
      phaseName,
      lunarPhaseId,
      moonSign,
      moonElement,
      lunarDay
    );

    // 6. Cache with fixed TTL (1 hour)
    // Using fixed TTL instead of end-of-day to avoid timezone calculation bugs
    const expiresAt = Date.now() + CACHE_TTL_MS;
    synthesisCache.set(cacheKey, { synthesis, expiresAt });

    console.log(`${LOG_PREFIX} Generated synthesis: sign=${moonSign}, phase=${phaseName}, phaseId=${lunarPhaseId}`);

    return NextResponse.json({
      ok: true,
      cached: false,
      synthesis,
      moonSign,
      moonElement,
      lunarPhaseId,
      phaseName,
    });
  } catch (err: any) {
    console.error(`${LOG_PREFIX} Synthesis generation error:`, err);

    // On error, return mock synthesis so user still gets something
    const mockSynthesis = buildMockSynthesis(phaseName, lunarPhaseId, moonSign, moonElement);

    return NextResponse.json({
      ok: true,
      cached: false,
      error: err?.message,
      synthesis: mockSynthesis,
      moonSign,
      moonElement,
      lunarPhaseId,
      phaseName,
      isFallback: true,
    });
  }
}
