// src/app/api/profile/brief/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type BriefReq = {
  version: "1.0";
  context: {
    season: string;
    phaseId: number;
    cyclePosDeg?: number | null;
    degIntoPhase?: number | null;
    phaseProgress01?: number | null;

    phaseHeader: string;
    phaseOneLine: string;
    phaseDescription: string;
    phaseActionHint?: string | null;
    journalPrompt: string;
    journalHelper: string;

    currentSun: string;
    lunation: string;
    progressed: string;
    asOf: string;
  };
  output?: {
    maxDoNow?: number;
    maxAvoid?: number;
    maxSentencesMeaning?: number;
  };
  constraints?: {
    noPrediction?: boolean;
    noNewClaims?: boolean;
    citeInputs?: boolean;
  };
};

type ProfileBrief = {
  headline: string;
  meaning: string;
  do_now: string[];
  avoid: string[];
  journal: string;
  confidence: "low" | "medium" | "high";
  usedFields?: string[];
};

type BriefOk = {
  ok: true;
  version: "1.0";
  output: ProfileBrief;
  meta?: { model?: string };
};

type BriefErr = { ok: false; error: string; code?: string };

function clampList(arr: unknown, max: number): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((x) => typeof x === "string" && x.trim())
    .map((s) => String(s).trim())
    .slice(0, max);
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

Return JSON with EXACT keys:
{
  "headline": string,
  "meaning": string,
  "do_now": string[],
  "avoid": string[],
  "journal": string,
  "confidence": "low"|"medium"|"high",
  "usedFields": string[]
}
`.trim();

function buildUserPrompt(body: BriefReq) {
  const c = body.context;

  const maxDoNow = body.output?.maxDoNow ?? 3;
  const maxAvoid = body.output?.maxAvoid ?? 2;
  const maxSentencesMeaning = body.output?.maxSentencesMeaning ?? 4;

  const noPrediction = body.constraints?.noPrediction ?? true;
  const noNewClaims = body.constraints?.noNewClaims ?? true;
  const citeInputs = body.constraints?.citeInputs ?? true;

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
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const err: BriefErr = { ok: false, error: "Missing OPENAI_API_KEY.", code: "NO_API_KEY" };
      return NextResponse.json(err, { status: 500 });
    }

    const body = (await req.json()) as BriefReq;

    if (!body || body.version !== "1.0" || !body.context) {
      const err: BriefErr = { ok: false, error: "Invalid request payload.", code: "BAD_REQUEST" };
      return NextResponse.json(err, { status: 400 });
    }

    const model =
      process.env.URA_OPENAI_MODEL?.toString().trim() ||
      process.env.OPENAI_MODEL?.toString().trim() ||
      "gpt-4.1-mini";

    // Chat Completions (works with response_format json_object)
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: buildUserPrompt(body) },
        ],
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      const errMsg =
        data?.error?.message ||
        data?.message ||
        `OpenAI error (${r.status})`;
      const err: BriefErr = { ok: false, error: errMsg, code: "OPENAI_ERROR" };
      return NextResponse.json(err, { status: 502 });
    }

    const raw = data?.choices?.[0]?.message?.content ?? "";
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
