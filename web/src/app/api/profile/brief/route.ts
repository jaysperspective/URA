// src/app/api/profile/brief/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { elementForSunSign, type ElementInfo } from "@/lib/calendar/element";

export const runtime = "nodejs";

type BriefOutput = {
  headline: string;
  meaning: string;
  story: string;
  do_now: string[];
  avoid: string[];
  journal: string;
  confidence: "low" | "medium" | "high";
  usedFields?: string[];
  element?: {
    name: string;
    meaning: string;
  };
};

type BriefOk = {
  ok: true;
  version: "1.0";
  cached?: boolean;
  output: BriefOutput;
  meta?: { model?: string };
};

type BriefErr = { ok: false; error: string; code?: string };

function getApiKey() {
  return (process.env.OPENAI_API_KEY || process.env.URA_OPENAI_API_KEY || process.env.OPENAI_KEY || "").trim();
}

function getModel() {
  return (process.env.URA_OPENAI_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini").trim();
}

function asString(v: any, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNumber(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function asStringArray(v: any, max = 8): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x) => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

function clampInt(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.trunc(n)));
}

function extractSunSign(currentSunLabel: string): string {
  // Extract sign from labels like "Aqu 15° 30'" or "Aquarius 15° 30'"
  const parts = (currentSunLabel || "").trim().split(/\s+/);
  return parts[0] || "Aries";
}

function systemPrompt(elementInfo: ElementInfo) {
  return `
You write URA's Daily Brief.

Voice (strict):
- Practical, disciplined, unsentimental. Short sentences. No hype.
- Value + stewardship lens: time, money, energy, commitments, craft, boundaries.
- Clear priorities. Concrete actions.

ELEMENT LENS (CRITICAL):
The current Sun is in a ${elementInfo.element} sign. This shapes everything today.
Element meaning: "${elementInfo.meaning}"
Filter ALL guidance through this ${elementInfo.element} lens:
- ${elementInfo.element === "Fire" ? "Energy for initiation, separation from old patterns, sparking new directions." : ""}
- ${elementInfo.element === "Earth" ? "Ground ideas in reality, be practical, focus on tangible results." : ""}
- ${elementInfo.element === "Air" ? "Emphasis on communication, sharing ideas, mental clarity, connection through words." : ""}
- ${elementInfo.element === "Water" ? "Emphasis on emotional connection, intuition, joining and bonding." : ""}

Hard bans (do NOT use these words or close variants):
astrology, zodiac, sign, house, planet, sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto,
lunation, retrograde, transit, progressed, ascendant, asc, mc, degree weather, sabian, horoscope, element (when referring to fire/earth/air/water)

Rules:
- Use ONLY the provided inputs.
- No predictions. No guaranteed outcomes. No "will happen".
- "do_now" must be concrete behaviors (imperatives).
- Keep "meaning" to 3–4 sentences max. The meaning MUST reflect the ${elementInfo.element} element lens.
- "story" is a SHORT imaginative vignette (2-3 sentences) using the symbol, phase orisha, and element. It should feel poetic but grounded.
- Journal must be specific and NOT generic. Avoid repeating templates.

Return ONLY valid JSON:
{
  "headline": "short title",
  "meaning": "3–4 sentences max, filtered through ${elementInfo.element} element lens",
  "story": "2-3 sentence imaginative vignette incorporating the symbol, phase energy, and element quality",
  "do_now": ["1–3 bullets"],
  "avoid": ["0–2 bullets"],
  "journal": "one question",
  "confidence": "low|medium|high",
  "usedFields": ["optional list of input fields you relied on"]
}
`.trim();
}

function userPrompt(input: any, elementInfo: ElementInfo) {
  const ctx = input?.context ?? {};
  const sym = input?.sabian ?? null;
  const dayKey = asString(input?.dayKey, "—");

  // Extract orisha from phase header if available
  const phaseHeader = asString(ctx.phaseHeader, "");

  return `
INPUTS (do not name these categories in the output)

DAILY KEY (use this as a differentiator)
- dayKey: ${dayKey}

CURRENT ELEMENT LENS (MUST shape all output)
- element: ${elementInfo.element}
- elementMeaning: ${elementInfo.meaning}

ORIENTATION
- season: ${asString(ctx.season, "—")}
- phaseId: ${asNumber(ctx.phaseId) ?? "—"}
- cyclePosDeg: ${asNumber(ctx.cyclePosDeg) ?? "—"}
- degIntoPhase: ${asNumber(ctx.degIntoPhase) ?? "—"}
- phaseProgress01: ${asNumber(ctx.phaseProgress01) ?? "—"}

PHASE GUIDANCE (includes orisha for story)
- header: ${asString(ctx.phaseHeader, "—")}
- oneLine: ${asString(ctx.phaseOneLine, "—")}
- description: ${asString(ctx.phaseDescription, "—")}
- actionHint: ${asString(ctx.phaseActionHint, "—")}
- journalPrompt: ${asString(ctx.journalPrompt, "—")}
- journalHelper: ${asString(ctx.journalHelper, "—")}

CONTEXT LABELS (treat as neutral time/context labels; do not use astronomy/astrology language)
- currentLabel: ${asString(ctx.currentSun, "—")}
- cycleMood: ${asString(ctx.lunation, "—")}
- internalRhythm: ${asString(ctx.progressed, "—")}
- asOf: ${asString(ctx.asOf, "—")}

DEGREE SYMBOL (anchor image; do not name the tradition)
${
  sym
    ? `- key: ${asString(sym.key, "—")}
- symbol: ${asString(sym.symbol, "—")}
- signal: ${asString(sym.signal, "—")}
- shadow: ${asString(sym.shadow, "—")}
- directive: ${asString(sym.directive, "—")}
- practice: ${asString(sym.practice, "—")}
- journal: ${asString(sym.journal, "—")}
- tags: ${(asStringArray(sym.tags, 10) || []).join(", ")}`
    : "- (missing symbol entry)"
}

OUTPUT LIMITS
- maxDoNow: ${clampInt(Number(input?.output?.maxDoNow ?? 3), 1, 5)}
- maxAvoid: ${clampInt(Number(input?.output?.maxAvoid ?? 2), 0, 3)}
- maxSentencesMeaning: ${clampInt(Number(input?.output?.maxSentencesMeaning ?? 4), 2, 6)}

CONSTRAINTS
- noPrediction: ${Boolean(input?.constraints?.noPrediction)}
- noNewClaims: ${Boolean(input?.constraints?.noNewClaims)}
- citeInputs: ${Boolean(input?.constraints?.citeInputs)}

TASK
Write the Daily Brief JSON.

Requirements:
- The "meaning" MUST be filtered through the ${elementInfo.element} element lens (${elementInfo.meaning}).
- The "story" should be a short (2-3 sentences) imaginative vignette that weaves together:
  * The degree symbol/image
  * The current phase energy and its orisha (from header)
  * The ${elementInfo.element} element quality
  Story should feel evocative but practical—not mystical or predictive.
- Integrate the DEGREE SYMBOL into the meaning AND at least one "do_now" bullet.
- Journal question MUST be distinct for dayKey ${dayKey}. Make it specific to the symbol/practice/directive.
- Avoid generic journal templates. Ask about a concrete choice, boundary, or craft decision.
- "do_now" must be concrete actions (call, clean, schedule, send, build, review, practice).
- "avoid" should reflect typical failure modes from the guidance + the symbol's shadow (if present).
- No astrology vocabulary. No mystical language. No predictions.

Return JSON only.
`.trim();
}

async function callOpenAI(apiKey: string, model: string, content: string, elementInfo: ElementInfo) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt(elementInfo) },
        { role: "user", content },
      ],
    }),
  });

  const data = await r.json().catch(() => null);

  if (!r.ok) {
    const msg = data?.error?.message || `OpenAI error ${r.status}`;
    throw new Error(msg);
  }

  const txt = data?.choices?.[0]?.message?.content || "";
  return JSON.parse(txt);
}

function validateAndCoerce(out: any, limits: { maxDoNow: number; maxAvoid: number }, elementInfo: ElementInfo): BriefOutput {
  const headline = asString(out?.headline).trim();
  const meaning = asString(out?.meaning).trim();
  const story = asString(out?.story).trim();
  const journal = asString(out?.journal).trim();

  let confidence = asString(out?.confidence, "medium").trim().toLowerCase();
  if (!["low", "medium", "high"].includes(confidence)) confidence = "medium";

  const do_now = asStringArray(out?.do_now, 8).slice(0, limits.maxDoNow);
  const avoid = asStringArray(out?.avoid, 8).slice(0, limits.maxAvoid);

  const usedFields = asStringArray(out?.usedFields, 24);

  if (!headline || !meaning || !journal) {
    throw new Error("LLM output missing required fields.");
  }

  return {
    headline,
    meaning,
    story: story || "A moment of quiet attention reveals the day's essential task.",
    do_now,
    avoid,
    journal,
    confidence: confidence as "low" | "medium" | "high",
    usedFields: usedFields.length ? usedFields : undefined,
    element: {
      name: elementInfo.element,
      meaning: elementInfo.meaning,
    },
  };
}

function getDayKeyInTZ(tz: string, d = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      const err: BriefErr = {
        ok: false,
        code: "MISSING_API_KEY",
        error: "Missing OPENAI_API_KEY (or URA_OPENAI_API_KEY). Add it to .env.local and restart the server.",
      };
      return NextResponse.json(err, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      const err: BriefErr = { ok: false, code: "BAD_JSON", error: "Invalid JSON body." };
      return NextResponse.json(err, { status: 400 });
    }

    // Get user for caching
    const user = await getSessionUser(req);
    const userId = user?.id ?? null;

    // Determine timezone (from body or default)
    const timezone = asString(body?.timezone, "America/New_York") || "America/New_York";
    const ymdLocal = getDayKeyInTZ(timezone);

    // Check cache if user is logged in
    if (userId) {
      try {
        const cached = await prisma.dailyBriefCache.findUnique({
          where: {
            userId_ymdLocal: {
              userId,
              ymdLocal,
            },
          },
        });

        if (cached && cached.payloadJson) {
          const cachedPayload = cached.payloadJson as BriefOutput;
          const ok: BriefOk = {
            ok: true,
            version: "1.0",
            cached: true,
            output: cachedPayload,
            meta: { model: "cached" },
          };
          return NextResponse.json(ok, { status: 200 });
        }
      } catch (cacheErr) {
        // Cache lookup failed, continue to generate
        console.error("Daily brief cache lookup failed:", cacheErr);
      }
    }

    // Extract element from current sun label
    const currentSunLabel = asString(body?.context?.currentSun, "");
    const sunSign = extractSunSign(currentSunLabel);
    const elementInfo = elementForSunSign(sunSign);

    const model = getModel();
    const maxDoNow = clampInt(Number(body?.output?.maxDoNow ?? 3), 1, 5);
    const maxAvoid = clampInt(Number(body?.output?.maxAvoid ?? 2), 0, 3);

    const prompt = userPrompt(body, elementInfo);
    const json = await callOpenAI(apiKey, model, prompt, elementInfo);

    const output = validateAndCoerce(json, { maxDoNow, maxAvoid }, elementInfo);

    // Store in cache if user is logged in
    if (userId) {
      try {
        await prisma.dailyBriefCache.upsert({
          where: {
            userId_ymdLocal: {
              userId,
              ymdLocal,
            },
          },
          update: {
            payloadJson: output as any,
          },
          create: {
            userId,
            ymdLocal,
            payloadJson: output as any,
          },
        });
      } catch (cacheErr) {
        // Cache write failed, but we still return the result
        console.error("Daily brief cache write failed:", cacheErr);
      }
    }

    const ok: BriefOk = {
      ok: true,
      version: "1.0",
      output,
      meta: { model },
    };
    return NextResponse.json(ok, { status: 200 });
  } catch (e: any) {
    const err: BriefErr = {
      ok: false,
      code: "BRIEF_FAILED",
      error: e?.message || "Daily brief failed.",
    };
    return NextResponse.json(err, { status: 500 });
  }
}
