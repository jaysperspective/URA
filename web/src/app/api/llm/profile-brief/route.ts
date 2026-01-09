import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type OrientationContext = {
  season: string;
  phaseId: number;
  phaseHeader: string;
  phaseOneLine: string;
  phaseDescription: string;
  phaseActionHint?: string | null;
  cyclePosDeg: number | null;
  degIntoPhase: number | null;
  phaseProgress01: number | null;

  currentSun: string; // formatted already
  lunation: string; // formatted already
  progressed: string; // formatted already
  asOf: string; // formatted already
};

type ProfileBrief = {
  headline: string;
  meaning: string;
  do_now: string[];
  avoid: string[];
  journal: string;
  confidence: "low" | "medium" | "high";
};

function isProfileBrief(x: any): x is ProfileBrief {
  if (!x || typeof x !== "object") return false;
  if (typeof x.headline !== "string") return false;
  if (typeof x.meaning !== "string") return false;
  if (!Array.isArray(x.do_now) || x.do_now.some((s: any) => typeof s !== "string")) return false;
  if (!Array.isArray(x.avoid) || x.avoid.some((s: any) => typeof s !== "string")) return false;
  if (typeof x.journal !== "string") return false;
  if (!["low", "medium", "high"].includes(x.confidence)) return false;
  return true;
}

const SYSTEM_RULES = `
You are an interpretive assistant for the URA system.

Hard rules:
- Use ONLY the provided input data. Never guess missing values.
- Do NOT predict outcomes or future events.
- Do NOT explain astrology mechanics or calculations.
- Keep language grounded, practical, concise.
- Do NOT mention degrees unless they already appear in the provided strings.
- Output ONLY valid JSON matching the required schema.

Schema:
{
  "headline": string,
  "meaning": string,
  "do_now": string[],   // max 3 items
  "avoid": string[],    // max 2 items
  "journal": string,
  "confidence": "low"|"medium"|"high"
}
`.trim();

function buildUserPrompt(ctx: OrientationContext) {
  return `
Generate a short daily brief based on this URA orientation.

Orientation:
- Season: ${ctx.season}
- Phase: ${ctx.phaseId}
- Phase header: ${ctx.phaseHeader}
- Phase one-line: ${ctx.phaseOneLine}
- Phase description: ${ctx.phaseDescription}
- Action hint: ${ctx.phaseActionHint ?? "—"}
- Cycle position: ${ctx.cyclePosDeg ?? "—"}
- Degrees into phase: ${ctx.degIntoPhase ?? "—"}
- Phase progress (0..1): ${ctx.phaseProgress01 ?? "—"}

Sky context:
- Sun now: ${ctx.currentSun}
- Lunation: ${ctx.lunation}
- Progressed Sun/Moon: ${ctx.progressed}
- As of: ${ctx.asOf}

Requirements:
- Headline must be 1 sentence max.
- Meaning must be 2–4 sentences.
- do_now: max 3 bullets.
- avoid: max 2 bullets.
- journal: 1 question.
- confidence: low/medium/high depending on how complete the data is.

Return ONLY JSON.
`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const ctx = (await req.json()) as OrientationContext;

    // Minimal validation
    if (!ctx || typeof ctx.season !== "string" || typeof ctx.phaseId !== "number") {
      return NextResponse.json({ error: "Invalid context payload." }, { status: 400 });
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
        { role: "system", content: SYSTEM_RULES },
        { role: "user", content: buildUserPrompt(ctx) },
      ],
    });

    const content = completion.choices?.[0]?.message?.content ?? "";
    let parsed: any = null;

    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "Model returned non-JSON output.", raw: content.slice(0, 2000) },
        { status: 502 }
      );
    }

    // Enforce shape + limits
    if (!isProfileBrief(parsed)) {
      return NextResponse.json(
        { error: "Model returned JSON that does not match schema.", raw: parsed },
        { status: 502 }
      );
    }

    parsed.do_now = parsed.do_now.slice(0, 3);
    parsed.avoid = parsed.avoid.slice(0, 2);

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate brief.", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
