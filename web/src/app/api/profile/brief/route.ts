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
  return (
    process.env.OPENAI_API_KEY ||
    process.env.URA_OPENAI_API_KEY ||
    process.env.OPENAI_KEY ||
    ""
  ).trim();
}

function getModel() {
  return (
    process.env.URA_OPENAI_MODEL ||
    process.env.OPENAI_MODEL ||
    "gpt-4.1-mini"
  ).trim();
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
You are URA's Daily Brief engine.

Your job:
- Produce a grounded daily brief using ONLY the provided inputs: URA Phase lens + Sun degree Sabian lens + lunation/progressions context.
- The Sabian entry is an anchor for today's symbolic "degree weather". Weave it into the meaning + actions.
- No predictions. No fortune-telling. No guarantees. No timelines like "will happen".
- Be concise, direct, and practical. "Do now" must be behaviors.

Return ONLY valid JSON with this shape:
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
  const sab = input?.sabian ?? null;

  return `
INPUTS

URA ORIENTATION
- season: ${asString(ctx.season, "—")}
- phaseId: ${asNumber(ctx.phaseId) ?? "—"}
- cyclePosDeg: ${asNumber(ctx.cyclePosDeg) ?? "—"}
- degIntoPhase: ${asNumber(ctx.degIntoPhase) ?? "—"}
- phaseProgress01: ${asNumber(ctx.phaseProgress01) ?? "—"}

PHASE LENS
- phaseHeader: ${asString(ctx.phaseHeader, "—")}
- phaseOneLine: ${asString(ctx.phaseOneLine, "—")}
- phaseDescription: ${asString(ctx.phaseDescription, "—")}
- phaseActionHint: ${asString(ctx.phaseActionHint, "—")}
- journalPrompt: ${asString(ctx.journalPrompt, "—")}
- journalHelper: ${asString(ctx.journalHelper, "—")}

SKY SNAPSHOT
- currentSun: ${asString(ctx.currentSun, "—")}
- lunation: ${asString(ctx.lunation, "—")}
- progressed: ${asString(ctx.progressed, "—")}
- asOf: ${asString(ctx.asOf, "—")}

SABIAN DEGREE (Sun anchor)
${
  sab
    ? `- key: ${asString(sab.key, "—")}
- symbol: ${asString(sab.symbol, "—")}
- signal: ${asString(sab.signal, "—")}
- shadow: ${asString(sab.shadow, "—")}
- directive: ${asString(sab.directive, "—")}
- practice: ${asString(sab.practice, "—")}
- journal: ${asString(sab.journal, "—")}
- tags: ${(asStringArray(sab.tags, 10) || []).join(", ")}`
    : "- (missing sabian)"
}

OUTPUT LIMITS
- maxDoNow: ${clampInt(Number(input?.output?.maxDoNow ?? 3), 1, 5)}
- maxAvoid: ${clampInt(Number(input?.output?.maxAvoid ?? 2), 0, 3)}
- maxSentencesMeaning: ${clampInt(Number(input?.output?.maxSentencesMeaning ?? 4), 2, 6)}

CONSTRAINTS
- noPrediction: ${Boolean(input?.constraints?.noPrediction)}
- noNewClaims: ${Boolean(input?.constraints?.noNewClaims)}
- citeInputs: ${Boolean(input?.constraints?.citeInputs)}

Task:
Write the Daily Brief JSON.
- Put Sabian into meaning AND at least 1 "do_now" bullet.
- Make "do_now" concrete (walk / write / call / clean / schedule / send / build / review).
- Avoid should be the typical failure mode of the phase + sabian shadow (if present).
- Journal question should be sharp and singular.

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
      temperature: 0.35,
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
        error:
          "Missing OPENAI_API_KEY. Add it to .env.local (server) and restart the process.",
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
