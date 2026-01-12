// src/app/api/profile/brief/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type BriefOk = {
  ok: true;
  version: "1.0";
  output: {
    headline: string;
    meaning: string;
    do_now: string[];
    avoid: string[];
    journal: string;
    confidence: "low" | "medium" | "high";
    usedFields?: string[];
  };
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

function systemPrompt() {
  return `
You write URA's Daily Brief.

Voice (strict):
- Practical, disciplined, unsentimental. Short sentences. No hype.
- Value + stewardship lens: time, money, energy, commitments, craft, boundaries.
- Clear priorities. Concrete actions.

Hard bans (do NOT use these words or close variants):
astrology, zodiac, sign, house, planet, sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto,
lunation, retrograde, transit, progressed, ascendant, asc, mc, degree weather, sabian, horoscope

Rules:
- Use ONLY the provided inputs.
- No predictions. No guaranteed outcomes. No “will happen”.
- "do_now" must be concrete behaviors (imperatives).
- Keep "meaning" to 3–4 sentences max.
- Journal must be specific and NOT generic. Avoid repeating templates like:
  "What structure would protect the truth of this beginning?"
  or "What is one thing you can do today?"
  Make it clearly distinct each day.

Return ONLY valid JSON:
{
  "headline": "short title",
  "meaning": "3–4 sentences max",
  "do_now": ["1–3 bullets"],
  "avoid": ["0–2 bullets"],
  "journal": "one question",
  "confidence": "low|medium|high",
  "usedFields": ["optional list of input fields you relied on"]
}
`.trim();
}

function userPrompt(input: any) {
  const ctx = input?.context ?? {};
  const sym = input?.sabian ?? null;
  const dayKey = asString(input?.dayKey, "—");

  return `
INPUTS (do not name these categories in the output)

DAILY KEY (use this as a differentiator)
- dayKey: ${dayKey}

ORIENTATION
- season: ${asString(ctx.season, "—")}
- phaseId: ${asNumber(ctx.phaseId) ?? "—"}
- cyclePosDeg: ${asNumber(ctx.cyclePosDeg) ?? "—"}
- degIntoPhase: ${asNumber(ctx.degIntoPhase) ?? "—"}
- phaseProgress01: ${asNumber(ctx.phaseProgress01) ?? "—"}

PHASE GUIDANCE
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
- Integrate the DEGREE SYMBOL into the meaning AND at least one "do_now" bullet.
- Journal question MUST be distinct for dayKey ${dayKey}. Make it specific to the symbol/practice/directive.
- Avoid generic journal templates. Ask about a concrete choice, boundary, or craft decision.
- "do_now" must be concrete actions (call, clean, schedule, send, build, review, practice).
- "avoid" should reflect typical failure modes from the guidance + the symbol’s shadow (if present).
- No astrology vocabulary. No mystical language. No predictions.

Return JSON only.
`.trim();
}

async function callOpenAI(apiKey: string, model: string, content: string) {
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
        { role: "system", content: systemPrompt() },
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

function validateAndCoerce(out: any, limits: { maxDoNow: number; maxAvoid: number }) {
  const headline = asString(out?.headline).trim();
  const meaning = asString(out?.meaning).trim();
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
    do_now,
    avoid,
    journal,
    confidence: confidence as "low" | "medium" | "high",
    usedFields: usedFields.length ? usedFields : undefined,
  };
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

    const model = getModel();
    const maxDoNow = clampInt(Number(body?.output?.maxDoNow ?? 3), 1, 5);
    const maxAvoid = clampInt(Number(body?.output?.maxAvoid ?? 2), 0, 3);

    const prompt = userPrompt(body);
    const json = await callOpenAI(apiKey, model, prompt);

    const output = validateAndCoerce(json, { maxDoNow, maxAvoid });

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
