// src/app/api/moon/synthesis/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { microcopyForPhase, type PhaseId } from "@/lib/phaseMicrocopy";

// In-memory cache for daily synthesis (userId-date -> synthesis)
// In production, this should be stored in the database
const synthesisCache = new Map<string, { synthesis: SynthesisResult; expiresAt: number }>();

type SynthesisResult = {
  headline: string;
  guidance: string;
  actionHint: string;
  journalPrompt: string;
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
  // Parse the key and get midnight tomorrow
  const [y, m, d] = todayKey.split("-").map(Number);
  const tomorrow = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
  return tomorrow.getTime();
}

function getCacheKey(userId: number, dateKey: string): string {
  return `${userId}:${dateKey}`;
}

// Cleanup old cache entries periodically
let lastCleanup = Date.now();
function cleanupCache() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return; // Only run every minute
  lastCleanup = now;

  for (const [key, entry] of synthesisCache.entries()) {
    if (entry.expiresAt < now) {
      synthesisCache.delete(key);
    }
  }
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
      temperature: 0.6,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: [
            "You are a grounded synthesis voice for the URA astrology system.",
            "Rules:",
            "- Use ONLY the provided phase/orisha information. Do not add external astrology.",
            "- No predictions. No fate statements. No emojis. No fluff.",
            "- Keep tone calm, practical, and oriented toward action.",
            "- Output valid JSON only.",
          ].join("\n"),
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

function buildMockSynthesis(lunarPhase: PhaseId, solarPhase: number | null): SynthesisResult {
  const lunar = microcopyForPhase(lunarPhase);
  const now = new Date();

  return {
    headline: `${lunar.orisha} guides today's rhythm`,
    guidance: `Today is shaped by Lunar Phase ${lunarPhase} (${lunar.orisha}): ${lunar.oneLine}` +
      (solarPhase ? ` Your Solar URA is Phase ${solarPhase}, adding context to how this unfolds.` : "") +
      " This is a mock synthesis. Enable OPENAI_API_KEY for full LLM synthesis.",
    actionHint: lunar.actionHint || "Start with one clear action.",
    journalPrompt: lunar.journalPrompt,
    generatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

async function generateSynthesis(
  lunarPhaseId: PhaseId,
  solarPhase: number | null,
  moonSign: string | null
): Promise<SynthesisResult> {
  const lunar = microcopyForPhase(lunarPhaseId);
  const now = new Date();

  // If no API key, return mock
  if (!process.env.OPENAI_API_KEY) {
    return buildMockSynthesis(lunarPhaseId, solarPhase);
  }

  const prompt = `
Generate a daily synthesis using the URA system: Planet (force) → Orisha (motion) → Phase (timing).

TODAY'S CONTEXT:
- Lunar Phase: ${lunarPhaseId} (${lunar.orisha}) — ${lunar.header}
- Lunar Phase Meaning: ${lunar.oneLine}
- Lunar Phase Description: ${lunar.description}
${solarPhase ? `- Solar URA Phase: ${solarPhase}` : ""}
${moonSign ? `- Moon Sign: ${moonSign}` : ""}

ORISHA CONTEXT:
${lunar.orisha} represents the motion/energy quality of this phase:
- Action hint: ${lunar.actionHint || "None specified"}
- Journal prompt: ${lunar.journalPrompt}

OUTPUT: Return JSON with this exact structure:
{
  "headline": "A short (5-10 word) headline capturing today's energy",
  "guidance": "2-3 sentences synthesizing the phase energy with practical orientation. No predictions.",
  "actionHint": "One specific action for today",
  "journalPrompt": "One reflective question"
}

Keep it grounded, practical, and oriented toward what the user can actually do today.
`.trim();

  const { content } = await callLLM(prompt);
  const parsed = safeJsonParse(content);

  return {
    headline: parsed.headline || `${lunar.orisha} guides today`,
    guidance: parsed.guidance || lunar.description,
    actionHint: parsed.actionHint || lunar.actionHint || "Start with one clear action.",
    journalPrompt: parsed.journalPrompt || lunar.journalPrompt,
    generatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  };
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
    select: { timezone: true, lunationJson: true },
  });

  const tz = profile?.timezone || "America/New_York";
  const todayKey = getLocalDayKey(tz);
  const cacheKey = getCacheKey(userId, todayKey);

  // 3. Check cache
  const cached = synthesisCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({
      ok: true,
      cached: true,
      synthesis: cached.synthesis,
    });
  }

  // 4. Extract lunar phase from profile's lunationJson
  const lunation = profile?.lunationJson as any;
  let lunarPhaseId: PhaseId = 1;
  let solarPhase: number | null = null;
  let moonSign: string | null = null;

  // Try to extract phase info from lunation data
  if (lunation) {
    const lun = lunation?.lunation || lunation?.data?.lunation || lunation;
    const phaseAngle = lun?.phaseAngle ?? lun?.separation ?? null;

    if (typeof phaseAngle === "number") {
      // Convert phase angle to phase ID (0-360 degrees -> 1-8 phases)
      const normalized = ((phaseAngle % 360) + 360) % 360;
      const idx = Math.floor((normalized + 22.5) / 45) % 8;
      lunarPhaseId = ((idx + 1) as PhaseId) || 1;
    }

    // Try to get moon sign
    moonSign = lun?.moonSign || lunation?.astro?.moonSign || null;

    // Try to get solar phase from calendar data
    solarPhase = lunation?.solar?.phase ?? null;
  }

  // 5. Generate synthesis
  try {
    const synthesis = await generateSynthesis(lunarPhaseId, solarPhase, moonSign);

    // 6. Cache it until end of day
    const expiresAt = getEndOfDayMs(tz);
    synthesisCache.set(cacheKey, { synthesis, expiresAt });

    return NextResponse.json({
      ok: true,
      cached: false,
      synthesis,
      lunarPhaseId,
      solarPhase,
    });
  } catch (err: any) {
    // On error, return mock synthesis so user still gets something
    const mockSynthesis = buildMockSynthesis(lunarPhaseId, solarPhase);

    return NextResponse.json({
      ok: true,
      cached: false,
      error: err?.message,
      synthesis: mockSynthesis,
      lunarPhaseId,
      solarPhase,
      isFallback: true,
    });
  }
}
