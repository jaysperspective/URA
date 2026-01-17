// src/app/api/solar-synthesis/route.ts
// LLM-powered Solar Synthesis endpoint - COLLECTIVE only, NO personal data
import { NextRequest, NextResponse } from "next/server";
import { withStandardRateLimit } from "@/lib/withRateLimit";
import { z } from "zod";
import { getCollectiveData } from "@/lib/sun/collectiveData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================
// OUTPUT SCHEMA (zod)
// ============================================
const SolarSynthesisSchema = z.object({
  summary_sentence: z.string().max(200),
  dominant_layer: z.enum(["solar", "lunar", "transitional"]),
  recommended_posture: z.enum(["act", "stabilize", "observe", "release"]),
  caution_note: z.string().max(100),
  signals: z.tuple([z.string().max(50), z.string().max(50), z.string().max(50)]),
});

type SolarSynthesisOutput = z.infer<typeof SolarSynthesisSchema>;

// ============================================
// SYSTEM PROMPT (EXACTLY AS SPECIFIED)
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

Inputs You Will Receive (JSON)
- now: ISO timestamp and timezone
- solar: sunSign, sunDegreeInSign, solarSeasonLabel, solarPhaseLabel (collective definitions)
- lunar: phaseName, dayInPhase, lunarDirective (collective definitions)
- ura: foundationPrinciples (short list), optional microcopy excerpts (collective)
- optional context: "recentShift" or "transitionFlag" if provided by the system

Your Task
1) Determine which layer is dominant for orientation today:
   - "solar" when long-arc framing is more important,
   - "lunar" when short-arc cadence is more important,
   - "transitional" when the system indicates a shift, threshold, or ambiguity.
2) Generate a short synthesis that prioritizes clarity and action posture WITHOUT giving personal advice.
3) Return only valid JSON matching the schema below. No extra keys. No markdown.

Output Schema (JSON only)
{
  "summary_sentence": string,          // 1 sentence, max 18 words
  "dominant_layer": "solar" | "lunar" | "transitional",
  "recommended_posture": "act" | "stabilize" | "observe" | "release",
  "caution_note": string,              // short clause, max 9 words
  "signals": [string, string, string]  // 3 short signal phrases, max 6 words each
}

Style Constraints
- summary_sentence: concrete, non-poetic, non-psychological.
- signals: should read like "conditions," not instructions (e.g., "clarify priorities," "reduce noise," "hold the line").
- Keep vocabulary simple. Avoid jargon.`;

// ============================================
// SIMPLE TIME-BUCKET CACHE
// ============================================
type CacheEntry = { data: SolarSynthesisOutput; exp: number };
const synthesisCache = new Map<string, CacheEntry>();

function getCacheKey(params: { sunSign: string; sunDegreeInSign: number; phaseName: string }) {
  // 15-minute bucket + core parameters
  const now = new Date();
  const bucket = Math.floor(now.getTime() / (15 * 60 * 1000));
  return `synthesis:${bucket}:${params.sunSign}:${params.sunDegreeInSign}:${params.phaseName}`;
}

function getCachedSynthesis(key: string): SolarSynthesisOutput | null {
  const entry = synthesisCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.exp) {
    synthesisCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedSynthesis(key: string, data: SolarSynthesisOutput, ttlMs: number) {
  synthesisCache.set(key, { data, exp: Date.now() + ttlMs });
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
      max_tokens: 300, // Tight limit
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
}): SolarSynthesisOutput {
  const { solarPhaseLabel, phaseName, solarMicrocopy, lunarDirective } = params;

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

  return {
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

    // 2. Check cache
    const cacheKey = getCacheKey({
      sunSign: solar.sunSign,
      sunDegreeInSign: solar.sunDegreeInSign,
      phaseName: lunar.phaseName,
    });

    const cached = getCachedSynthesis(cacheKey);
    if (cached) {
      return NextResponse.json({
        ok: true,
        cached: true,
        synthesis: cached,
        collective: {
          sunSign: solar.sunSign,
          sunDegreeInSign: solar.sunDegreeInSign,
          phaseName: lunar.phaseName,
          solarPhaseLabel: solar.solarPhaseLabel,
        },
      });
    }

    // 3. Build LLM prompt with ONLY collective data
    const llmInput = {
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

    const userPrompt = `Generate a Solar Synthesis for the current moment.

INPUT (collective data only):
${JSON.stringify(llmInput, null, 2)}

Return ONLY valid JSON matching the output schema. No markdown. No explanation.`;

    // 4. Call LLM (with retry on validation failure)
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
      });
    } else {
      try {
        const { content, model, latencyMs } = await callLLM(userPrompt);
        llmModel = model;
        llmLatency = latencyMs;

        const parsed = safeJsonParse(content);
        const validated = SolarSynthesisSchema.safeParse(parsed);

        if (!validated.success) {
          // Retry once with stricter instruction
          const retryPrompt = `${userPrompt}

IMPORTANT: Your previous response was invalid. Return valid JSON only. No markdown. Match the exact schema.`;

          const { content: retryContent, model: retryModel, latencyMs: retryLatency } = await callLLM(retryPrompt);
          llmModel = retryModel;
          llmLatency += retryLatency;

          const retryParsed = safeJsonParse(retryContent);
          const retryValidated = SolarSynthesisSchema.safeParse(retryParsed);

          if (!retryValidated.success) {
            // Use fallback
            synthesis = buildFallbackSynthesis({
              solarPhaseLabel: solar.solarPhaseLabel,
              phaseName: lunar.phaseName,
              solarMicrocopy: ura.microcopy?.solar || "",
              lunarDirective: lunar.lunarDirective,
            });
          } else {
            synthesis = retryValidated.data;
          }
        } else {
          synthesis = validated.data;
        }
      } catch (llmError: any) {
        // LLM failed - use fallback
        synthesis = buildFallbackSynthesis({
          solarPhaseLabel: solar.solarPhaseLabel,
          phaseName: lunar.phaseName,
          solarMicrocopy: ura.microcopy?.solar || "",
          lunarDirective: lunar.lunarDirective,
        });
      }
    }

    // 5. Cache result (15 minutes)
    setCachedSynthesis(cacheKey, synthesis, 15 * 60 * 1000);

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
      meta: {
        model: llmModel || undefined,
        latencyMs: llmLatency || undefined,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Unknown error",
        synthesis: buildFallbackSynthesis({
          solarPhaseLabel: "Unknown",
          phaseName: "Unknown",
          solarMicrocopy: "",
          lunarDirective: "",
        }),
      },
      { status: 500 }
    );
  }
}

export const GET = withStandardRateLimit(handleGet);
