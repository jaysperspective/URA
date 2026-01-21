// src/app/api/moon/synthesis/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { microcopyForPhase, type PhaseId } from "@/lib/phaseMicrocopy";
import { elementForSunSign } from "@/lib/calendar/element";

// In-memory cache for daily synthesis (userId-date -> synthesis)
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

function getEndOfDayMs(tz: string): number {
  const now = new Date();
  const todayKey = getLocalDayKey(tz, now);
  const [y, m, d] = todayKey.split("-").map(Number);
  const tomorrow = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
  return tomorrow.getTime();
}

function getCacheKey(userId: number, dateKey: string): string {
  return `moon:${userId}:${dateKey}`;
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

// Phase name from angle
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
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
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

  const { content } = await callLLM(prompt);
  const parsed = safeJsonParse(content);

  // Validate that the response mentions the correct sign
  const headline = parsed.headline || `${moonPhaseName} in ${moonSign}`;
  let guidance = parsed.guidance || lunar.description;

  // Force correct sign in headline if LLM got it wrong
  if (!headline.includes(moonSign)) {
    console.warn(`LLM returned wrong sign in headline. Expected ${moonSign}, got: ${headline}`);
  }

  return {
    headline: `${moonPhaseName} in ${moonSign}`, // Always force correct title
    guidance,
    actionHint: parsed.actionHint || lunar.actionHint || "Start with one clear action.",
    journalPrompt: parsed.journalPrompt || lunar.journalPrompt,
    story: parsed.story,
    generatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

// Fetch current moon data from the same source as Moon page
async function getCurrentMoonData(origin: string): Promise<{
  moonSign: string;
  moonElement: string;
  phaseAngleDeg: number;
  phaseName: string;
  lunarDay: number | null;
} | null> {
  try {
    const res = await fetch(`${origin}/api/calendar`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!res.ok) return null;

    const json = await res.json();
    if (!json?.ok) return null;

    const astro = json?.astro;
    const lunar = json?.lunar;

    const moonSign = astro?.moonSign;
    if (!moonSign) return null;

    const moonElement = getMoonElement(moonSign);
    const phaseAngleDeg = lunar?.phaseAngle ?? lunar?.separation ?? 0;
    const phaseName = phaseNameFromAngle(phaseAngleDeg);
    const lunarDay = lunar?.lunarDay ?? null;

    return { moonSign, moonElement, phaseAngleDeg, phaseName, lunarDay };
  } catch (err) {
    console.error("Failed to fetch current moon data:", err);
    return null;
  }
}

function buildOrigin(req: Request): string {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "") || "http";
  return `${proto}://${host}`;
}

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
  const cacheKey = getCacheKey(userId, todayKey);

  // 3. Fetch CURRENT moon data from the same source as Moon page
  const origin = buildOrigin(req);
  const moonData = await getCurrentMoonData(origin);

  if (!moonData) {
    return NextResponse.json({
      ok: false,
      error: "Could not fetch current moon data",
    }, { status: 500 });
  }

  const { moonSign, moonElement, phaseAngleDeg, phaseName, lunarDay } = moonData;
  const lunarPhaseId = phaseIdFromAngle(phaseAngleDeg);

  // 4. Check cache (include moonSign in key to bust cache if sign changed)
  const fullCacheKey = `${cacheKey}:${moonSign}`;
  const cached = synthesisCache.get(fullCacheKey);
  if (cached && cached.expiresAt > Date.now()) {
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

  // 5. Generate synthesis with correct moon data
  try {
    const synthesis = await generateSynthesis(
      phaseName,
      lunarPhaseId,
      moonSign,
      moonElement,
      lunarDay
    );

    // 6. Cache it until end of day
    const expiresAt = getEndOfDayMs(tz);
    synthesisCache.set(fullCacheKey, { synthesis, expiresAt });

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
