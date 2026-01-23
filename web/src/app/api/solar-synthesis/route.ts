// src/app/api/solar-synthesis/route.ts
// LLM-powered Solar Synthesis endpoint - COLLECTIVE only, NO personal data
// Now includes Collective Signals (news themes + market state)
import { NextRequest, NextResponse } from "next/server";
import { withStandardRateLimit } from "@/lib/withRateLimit";
import { z } from "zod";
import { getCollectiveData } from "@/lib/sun/collectiveData";
import {
  getCollectiveSignals,
  signalsToResponse,
  buildSignalsBrief,
  type CollectiveSignalsResponse,
} from "@/lib/collectiveSignals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOG_PREFIX = "[solar-synthesis]";

// ============================================
// OUTPUT SCHEMA (zod)
// ============================================
const SolarSynthesisSchema = z.object({
  summary_sentence: z.string().max(200),
  dominant_layer: z.enum(["solar", "lunar", "transitional"]),
  recommended_posture: z.enum(["act", "stabilize", "observe", "release"]),
  caution_note: z.string().max(100),
  signals: z.tuple([z.string().max(50), z.string().max(50), z.string().max(50)]),
  collective_context: z.string().max(150).optional(), // NEW: integrates signals with solar phase
});

type SolarSynthesisOutput = z.infer<typeof SolarSynthesisSchema>;

// ============================================
// SYSTEM PROMPT (UPDATED WITH COLLECTIVE SIGNALS RULES)
// ============================================
const SYSTEM_PROMPT = `You are URA's Solar Synthesis engine.

Purpose
- Produce a concise, grounded "collective orientation" for the current moment.
- This is NOT a personal reading. It is NOT advice. It is NOT predictive.
- All meaning is anchored to the tropical zodiac with 0° Aries as the collective origin.

Hard Rules
- Do NOT use birth chart, houses, Ascendant, or any personal data. If any personal fields are present, ignore them.
- Do NOT address the user directly as "you." Use impersonal language: "this period," "the moment," "collectively."
- Do NOT claim certainty about outcomes. No promises. No fate talk.
- Do NOT add astrological facts that are not provided in the input (no invented aspects, no invented ingresses).
- Do NOT be poetic, mystical, or chatty. Keep it Saturnine: clear, sparse, adult.
- Use only the provided URA ontology text for phase meanings and directives.

COLLECTIVE SIGNALS RULES (CRITICAL)
- You may receive structured data about news themes and market conditions.
- You may reference signals only as domains active (e.g. "geopolitics + markets are dominant themes").
- You may NOT mention specific tragedies, deaths, violence details, or sensational content.
- You may NOT name political parties or advocate policy.
- You may NOT make predictions about markets, politics, or world events.
- Signals are context overlays, not the primary content. Solar/lunar inputs remain canonical.
- If signals are unavailable, do not mention them.

Inputs You Will Receive (JSON)
- now: ISO timestamp and timezone
- solar: sunSign, sunDegreeInSign, solarSeasonLabel, solarPhaseLabel (collective definitions)
- lunar: phaseName, dayInPhase, lunarDirective (collective definitions)
- ura: foundationPrinciples (short list), optional microcopy excerpts (collective)
- signals: (optional) news themes summary and market state
- optional context: "recentShift" or "transitionFlag" if provided by the system

Your Task
1) Determine which layer is dominant for orientation today:
   - "solar" when long-arc framing is more important,
   - "lunar" when short-arc cadence is more important,
   - "transitional" when the system indicates a shift, threshold, or ambiguity.
2) Generate a short synthesis that prioritizes clarity and action posture WITHOUT giving personal advice.
3) If signals are provided, generate a brief "collective_context" sentence (1-2 sentences max) that integrates the solar phase with the collective signals. Focus on tempo and domains, not specific events.
4) Return only valid JSON matching the schema below. No extra keys. No markdown.

Output Schema (JSON only)
{
  "summary_sentence": string,          // 1 sentence, max 18 words
  "dominant_layer": "solar" | "lunar" | "transitional",
  "recommended_posture": "act" | "stabilize" | "observe" | "release",
  "caution_note": string,              // short clause, max 9 words
  "signals": [string, string, string], // 3 short signal phrases, max 6 words each
  "collective_context": string         // optional, 1-2 sentences about collective tempo/domains
}

Style Constraints
- summary_sentence: concrete, non-poetic, non-psychological.
- signals: should read like "conditions," not instructions (e.g., "clarify priorities," "reduce noise," "hold the line").
- collective_context: grounded observation of collective activity, no predictions or judgments.
- Keep vocabulary simple. Avoid jargon.`;

// ============================================
// SIMPLE TIME-BUCKET CACHE
// ============================================
type CacheEntry = {
  data: SolarSynthesisOutput;
  collectiveSignals?: CollectiveSignalsResponse;
  exp: number;
};
const synthesisCache = new Map<string, CacheEntry>();

function getCacheKey(params: {
  sunSign: string;
  sunDegreeInSign: number;
  phaseName: string;
  signalsHash?: string;
}) {
  // 15-minute bucket + core parameters + signals hash
  const now = new Date();
  const bucket = Math.floor(now.getTime() / (15 * 60 * 1000));
  const base = `synthesis:${bucket}:${params.sunSign}:${params.sunDegreeInSign}:${params.phaseName}`;
  return params.signalsHash ? `${base}:${params.signalsHash}` : base;
}

function getCachedSynthesis(key: string): CacheEntry | null {
  const entry = synthesisCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.exp) {
    synthesisCache.delete(key);
    return null;
  }
  return entry;
}

function setCachedSynthesis(
  key: string,
  data: SolarSynthesisOutput,
  collectiveSignals: CollectiveSignalsResponse | undefined,
  ttlMs: number
) {
  synthesisCache.set(key, { data, collectiveSignals, exp: Date.now() + ttlMs });
}

// Clean old entries periodically
let lastCleanup = Date.now();
function cleanupCache() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;
  for (const [key, entry] of synthesisCache.entries()) {
    if (entry.exp < now) synthesisCache.delete(key);
  }
}

// ============================================
// LLM CALL
// ============================================
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
      temperature: 0.3, // Low temperature for consistency
      max_tokens: 400, // Slightly increased for collective_context
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
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

// ============================================
// SAFE JSON PARSE
// ============================================
function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    // Try to extract JSON from markdown-wrapped response
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(s.slice(start, end + 1));
    }
    throw new Error("Failed to parse LLM JSON");
  }
}

// ============================================
// FALLBACK (non-LLM)
// ============================================
function buildFallbackSynthesis(params: {
  solarPhaseLabel: string;
  phaseName: string;
  solarMicrocopy: string;
  lunarDirective: string;
  hasSignals: boolean;
}): SolarSynthesisOutput {
  const { solarPhaseLabel, phaseName, hasSignals } = params;

  // Determine dominant layer based on lunar phase
  const isNewOrFull = phaseName === "New Moon" || phaseName === "Full Moon";
  const dominant_layer = isNewOrFull ? "lunar" : "solar";

  // Map solar phase to posture
  const postureMap: Record<string, SolarSynthesisOutput["recommended_posture"]> = {
    Emergence: "act",
    Establishment: "stabilize",
    Assertion: "act",
    Illumination: "observe",
    Integration: "stabilize",
    Reorientation: "release",
    Withdrawal: "observe",
    Dissolution: "release",
  };
  const recommended_posture = postureMap[solarPhaseLabel] || "observe";

  const result: SolarSynthesisOutput = {
    summary_sentence: `${solarPhaseLabel} phase under ${phaseName}. Collective rhythm favors ${recommended_posture === "act" ? "movement" : recommended_posture === "stabilize" ? "consolidation" : recommended_posture === "observe" ? "assessment" : "release"}.`,
    dominant_layer,
    recommended_posture,
    caution_note: "Verify before committing resources.",
    signals: [
      "check foundational stability",
      "note timing dependencies",
      "maintain orientation clarity",
    ],
  };

  if (hasSignals) {
    result.collective_context = "External activity noted; maintain focus on core orientation.";
  }

  return result;
}

// ============================================
// SIGNALS HASH (for cache key differentiation)
// Uses stable, minimal fields only - no raw titles
// ============================================
function computeSignalsHash(signals: CollectiveSignalsResponse | undefined): string {
  if (!signals) return "none";

  // Create a stable hash from derived/categorical fields only
  const parts: string[] = [];

  // Tempo level
  if (signals.tempo?.level) {
    parts.push(`t:${signals.tempo.level}`);
  }

  // Market state (categorical values, not raw numbers)
  if (signals.markets) {
    parts.push(`r:${signals.markets.riskTone}`);
    parts.push(`v:${signals.markets.volatility}`);
    parts.push(`b:${signals.markets.breadth}`);
    // Round snapshot to 1 decimal for stability
    if (typeof signals.markets.snapshot.sp500ChangePct === "number") {
      parts.push(`sp:${Math.round(signals.markets.snapshot.sp500ChangePct * 10) / 10}`);
    }
  }

  // Top 3 news categories with counts (stable, no titles)
  if (signals.newsThemes?.length) {
    const topCats = signals.newsThemes
      .slice(0, 3)
      .map((c) => `${c.key}:${c.count}`)
      .join(",");
    parts.push(`n:${topCats}`);
  }

  return parts.join("|") || "empty";
}

// ============================================
// GET COLLECTIVE DATA (direct function call, no HTTP)
// ============================================
async function fetchCollectiveData(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tzOffsetMin = Number(searchParams.get("tzOffsetMin") ?? "0");
  const lat = Number(searchParams.get("lat") ?? "0");
  const lon = Number(searchParams.get("lon") ?? "0");

  return getCollectiveData({ tzOffsetMin, latitude: lat, longitude: lon });
}

// ============================================
// MAIN HANDLER
// ============================================
async function handleGet(req: NextRequest) {
  cleanupCache();

  try {
    // 1. Fetch collective data (NO auth, NO personal data)
    const collective = await fetchCollectiveData(req);

    if (!collective.ok) {
      throw new Error(collective.error || "Failed to fetch collective data");
    }

    const { solar, lunar, ura, gregorian } = collective;

    // 2. Fetch collective signals (news + markets)
    let collectiveSignalsData: CollectiveSignalsResponse | undefined;
    let signalsBrief: string | undefined;

    try {
      const signals = await getCollectiveSignals({ timezone: "UTC" });
      collectiveSignalsData = signalsToResponse(signals);
      signalsBrief = buildSignalsBrief(signals);

      console.log(`${LOG_PREFIX} Signals fetched:`, {
        newsCategories: collectiveSignalsData.newsThemes?.length ?? 0,
        tempo: collectiveSignalsData.tempo?.level,
        riskTone: collectiveSignalsData.markets?.riskTone,
      });
    } catch (signalsErr: any) {
      console.warn(`${LOG_PREFIX} Signals fetch failed:`, signalsErr?.message);
      // Continue without signals - they're optional
    }

    // 3. Check cache
    const signalsHash = computeSignalsHash(collectiveSignalsData);
    const cacheKey = getCacheKey({
      sunSign: solar.sunSign,
      sunDegreeInSign: solar.sunDegreeInSign,
      phaseName: lunar.phaseName,
      signalsHash,
    });

    const cached = getCachedSynthesis(cacheKey);
    if (cached) {
      console.log(`${LOG_PREFIX} Cache HIT: ${cacheKey}`);
      return NextResponse.json({
        ok: true,
        cached: true,
        synthesis: cached.data,
        collective: {
          sunSign: solar.sunSign,
          sunDegreeInSign: solar.sunDegreeInSign,
          phaseName: lunar.phaseName,
          solarPhaseLabel: solar.solarPhaseLabel,
        },
        collectiveSignals: cached.collectiveSignals,
      });
    }

    console.log(`${LOG_PREFIX} Cache MISS: ${cacheKey}`);

    // 4. Build LLM prompt with ONLY collective data + signals
    const llmInput: Record<string, unknown> = {
      now: {
        isoUTC: gregorian.asOfUTC,
        timezone: "UTC",
      },
      solar: {
        sunSign: solar.sunSign,
        sunDegreeInSign: solar.sunDegreeInSign,
        solarSeasonLabel: solar.solarSeasonLabel,
        solarPhaseLabel: solar.solarPhaseLabel,
      },
      lunar: {
        phaseName: lunar.phaseName,
        dayInPhase: lunar.dayInPhase,
        lunarDirective: lunar.lunarDirective,
      },
      ura: {
        foundationPrinciples: ura.foundationPrinciples,
        microcopy: ura.microcopy,
      },
    };

    // Add signals brief if available
    if (signalsBrief) {
      llmInput.signals = signalsBrief;
    }

    const userPrompt = `Generate a Solar Synthesis for the current moment.

INPUT (collective data only):
${JSON.stringify(llmInput, null, 2)}

${signalsBrief ? `SIGNALS BRIEF:
${signalsBrief}

Remember: Reference signals only as collective domains/tempo. No specific events, predictions, or judgments.` : ""}

Return ONLY valid JSON matching the output schema. No markdown. No explanation.`;

    // 5. Call LLM (with retry on validation failure)
    let synthesis: SolarSynthesisOutput;
    let llmModel = "";
    let llmLatency = 0;

    if (!process.env.OPENAI_API_KEY) {
      // No API key - use fallback
      synthesis = buildFallbackSynthesis({
        solarPhaseLabel: solar.solarPhaseLabel,
        phaseName: lunar.phaseName,
        solarMicrocopy: ura.microcopy?.solar || "",
        lunarDirective: lunar.lunarDirective,
        hasSignals: !!signalsBrief,
      });
    } else {
      try {
        const { content, model, latencyMs } = await callLLM(userPrompt);
        llmModel = model;
        llmLatency = latencyMs;

        console.log(`${LOG_PREFIX} LLM response received: model=${model}, latency=${latencyMs}ms`);

        const parsed = safeJsonParse(content);
        const validated = SolarSynthesisSchema.safeParse(parsed);

        if (!validated.success) {
          console.warn(`${LOG_PREFIX} LLM validation failed, retrying...`);

          // Retry once with stricter instruction
          const retryPrompt = `${userPrompt}

IMPORTANT: Your previous response was invalid. Return valid JSON only. No markdown. Match the exact schema.`;

          const { content: retryContent, model: retryModel, latencyMs: retryLatency } = await callLLM(retryPrompt);
          llmModel = retryModel;
          llmLatency += retryLatency;

          const retryParsed = safeJsonParse(retryContent);
          const retryValidated = SolarSynthesisSchema.safeParse(retryParsed);

          if (!retryValidated.success) {
            console.warn(`${LOG_PREFIX} LLM retry failed, using fallback`);
            // Use fallback
            synthesis = buildFallbackSynthesis({
              solarPhaseLabel: solar.solarPhaseLabel,
              phaseName: lunar.phaseName,
              solarMicrocopy: ura.microcopy?.solar || "",
              lunarDirective: lunar.lunarDirective,
              hasSignals: !!signalsBrief,
            });
          } else {
            synthesis = retryValidated.data;
          }
        } else {
          synthesis = validated.data;
        }
      } catch (llmError: any) {
        console.error(`${LOG_PREFIX} LLM error:`, llmError?.message);
        // LLM failed - use fallback
        synthesis = buildFallbackSynthesis({
          solarPhaseLabel: solar.solarPhaseLabel,
          phaseName: lunar.phaseName,
          solarMicrocopy: ura.microcopy?.solar || "",
          lunarDirective: lunar.lunarDirective,
          hasSignals: !!signalsBrief,
        });
      }
    }

    // 6. Cache result (15 minutes)
    setCachedSynthesis(cacheKey, synthesis, collectiveSignalsData, 15 * 60 * 1000);

    console.log(`${LOG_PREFIX} Generated synthesis:`, {
      dominant: synthesis.dominant_layer,
      posture: synthesis.recommended_posture,
      hasCollectiveContext: !!synthesis.collective_context,
    });

    return NextResponse.json({
      ok: true,
      cached: false,
      synthesis,
      collective: {
        sunSign: solar.sunSign,
        sunDegreeInSign: solar.sunDegreeInSign,
        phaseName: lunar.phaseName,
        solarPhaseLabel: solar.solarPhaseLabel,
      },
      collectiveSignals: collectiveSignalsData,
      meta: {
        model: llmModel || undefined,
        latencyMs: llmLatency || undefined,
      },
    });
  } catch (err: any) {
    console.error(`${LOG_PREFIX} Error:`, err?.message);

    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Unknown error",
        synthesis: buildFallbackSynthesis({
          solarPhaseLabel: "Unknown",
          phaseName: "Unknown",
          solarMicrocopy: "",
          lunarDirective: "",
          hasSignals: false,
        }),
      },
      { status: 500 }
    );
  }
}

export const GET = withStandardRateLimit(handleGet);
