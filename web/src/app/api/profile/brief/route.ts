import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type BriefReq = {
  version: "1.0";
  context: {
    season: string; // "Spring"
    phaseId: number; // 1..8
    cyclePosDeg?: number | null;
    degIntoPhase?: number | null;
    phaseProgress01?: number | null;

    // URA phase copy (authoritative)
    phaseHeader: string;
    phaseOneLine: string;
    phaseDescription: string;
    phaseActionHint?: string | null;
    journalPrompt: string;
    journalHelper: string;

    // sky context (already formatted strings)
    currentSun: string; // e.g. "Cap 17° 41'"
    lunation: string; // e.g. "Waxing Crescent • Initiation"
    progressed: string; // e.g. "Pis 10° · Tau 2°"
    asOf: string; // formatted
  };
  output?: {
    maxDoNow?: number; // default 3
    maxAvoid?: number; // default 2
    maxSentencesMeaning?: number; // default 4
  };
  constraints?: {
    noPrediction?: boolean; // default true
    noNewClaims?: boolean; // default true
    citeInputs?: boolean; // default true (adds usedFields)
  };
};

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

function clampList(arr: unknown, max: number): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((x) => typeof x === "string" && x.trim()).slice(0, max);
}

function safeStr(x: unknown, fallback = ""): string {
  return typeof x === "string" ? x : fallback;
}

function safeConfidence(x: unknown): "low" | "medium" | "high" {
  return x === "low" || x === "medium" || x === "high" ? x : "medium";
}

const SYSTEM = `
You are URA's profile-brief generator.

Hard rules:
- Use ONLY the provided context fields. Never guess missing values.
- Do NOT predict outcomes or future events.
- Do NOT explain astrology mechanics or calculations.
- Keep it grounded, practical, concise.
- Output ONLY valid JSON. No markdown.

JSON schema (exact keys):
{
  "headline": string,                 // 1 sentence max
  "meaning": string,                  // 2–4 sentences max (unless overridden)
  "do_now": string[],                 // max N
  "avoid": string[],                  // max N
  "journal": string,                  // 1 question
  "confidence": "low"|"medium"|"high",
  "usedFields": string[]              // list of context keys used (if requested)
}
`.trim();

function buildPrompt(req: BriefReq) {
  const c = req.context;

  const maxDoNow = req.output?.maxDoNow ?? 3;
  const maxAvoid = req.output?.maxAvoid ?? 2;
  const maxSentencesMeaning = req.output?.maxSentencesMeaning ?? 4;

  const noPrediction = req.constraints?.noPrediction ?? true;
  const noNewClaims = req.constraints?.noNewClaims ?? true;
  const citeInputs = req.constraints?.citeInputs ?? true;

  return `
Generate a "daily brief" for a URA profile page.

Constraints:
- noPrediction=${String(noPrediction)}
- noNewClaims=${String(noNewClaims)}
- citeInputs=${String(citeInputs)}
- maxDoNow=${maxDoNow}
- maxAvoid=${maxAvoid}
- maxSentencesMeaning=${maxSentencesMeaning}

Context (authoritative):
- season: ${c.season}
- phaseId: ${c.phaseId}
- cyclePosDeg: ${c.cyclePosDeg ?? "—"}
- degIntoPhase: ${c.degIntoPhase ?? "—"}
- phaseProgress01: ${c.phaseProgress01 ?? "—"}

URA phase copy:
- phaseHeader: ${c.phaseHeader}
- phaseOneLine: ${c.phaseOneLine}
- phaseDescription: ${c.phaseDescription}
- phaseActionHint: ${c.phaseActionHint ?? "—"}
- journalPrompt: ${c.journalPrompt}
- journalHelper: ${c.journalHelper}

Sky context:
- currentSun: ${c.currentSun}
- lunation: ${c.lunation}
- progressed: ${c.progressed}
- asOf: ${c.asOf}

Output rules:
- headline: 1 sentence max
- meaning: 2–${maxSentencesMeaning} sentences max
- do_now: up to ${maxDoNow}
- avoid: up to ${maxAvoid}
- journal: exactly 1 question
- confidence: low if major values are missing; otherwise medium/high
- usedFields: list of context keys you actually relied on (only if citeInputs=true)

Return ONLY JSON.
`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BriefReq;

    if (!body || body.version !== "1.0" || !body.context) {
      const err: BriefErr = { ok: false, error: "Invalid request payload.", code: "BAD_REQUEST" };
      return NextResponse.json(err, { status: 400 });
    }

    const model =
      process.env.URA_OPENAI_MODEL?.toString().trim() ||
      process.env.OPENAI_MODEL?.toString().trim() ||
      "gpt-4.1-mini";

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: buildPrompt(body) },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const err: BriefErr = { ok: false, error: "Model returned non-JSON output.", code: "NON_JSON" };
      return NextResponse.json(err, { status: 502 });
    }

    const maxDoNow = body.output?.maxDoNow ?? 3;
    const maxAvoid = body.output?.maxAvoid ?? 2;

    const out: BriefOk = {
      ok: true,
      version: "1.0",
      output: {
        headline: safeStr(parsed.headline, ""),
        meaning: safeStr(parsed.meaning, ""),
        do_now: clampList(parsed.do_now, maxDoNow),
        avoid: clampList(parsed.avoid, maxAvoid),
        journal: safeStr(parsed.journal, ""),
        confidence: safeConfidence(parsed.confidence),
        usedFields: Array.isArray(parsed.usedFields)
          ? parsed.usedFields.filter((x: any) => typeof x === "string").slice(0, 40)
          : undefined,
      },
      meta: { model },
    };

    if (!out.output.headline || !out.output.meaning || !out.output.journal) {
      const err: BriefErr = { ok: false, error: "Model JSON missing required fields.", code: "BAD_SCHEMA" };
      return NextResponse.json(err, { status: 502 });
    }

    return NextResponse.json(out);
  } catch (e: any) {
    const err: BriefErr = { ok: false, error: e?.message ?? "Brief generation failed.", code: "SERVER_ERROR" };
    return NextResponse.json(err, { status: 500 });
  }
}
