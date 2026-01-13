// src/app/api/astrology/synthesize/route.ts
import { NextResponse } from "next/server";
import doctrine from "@/lib/doctrine/doctrine.generated.json";

type Lens =
  | "general"
  | "relationships"
  | "work"
  | "health"
  | "creativity"
  | "spiritual"
  | "shadow"
  | "growth";

type Mode = "placement" | "pair" | "mini_chart";

type ReqBody = {
  version: "1.0";
  mode: Mode;
  keys: string[]; // doctrine keys only: planet|sign|house (but we accept loose casing)
  lens?: Lens;
  question?: string;
  output?: {
    format?: "short" | "standard" | "deep";
    maxBullets?: number;
    includeJournalPrompts?: boolean;
  };
};

type DoctrineCard = any;

const CARDS: DoctrineCard[] = (doctrine as any).cards ?? [];

/**
 * Normalize doctrine keys so lookups work even if the UI sends:
 * - moon|capricorn vs Moon|Capricorn
 * - extra spaces
 * - "north node" vs "northNode" (basic tolerance)
 */
function normKey(k: string) {
  return String(k || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*\|\s*/g, "|");
}

function normPlanetToken(p: string) {
  const x = normKey(p).replace(/\s/g, "");
  // normalize common node forms
  if (x === "northnode" || x === "truenode" || x === "meannode" || x === "node") return "northnode";
  if (x === "southnode") return "southnode";
  return x;
}

function normSignToken(s: string) {
  return normKey(s).replace(/\s/g, "");
}

function canonizeIncomingKey(raw: string) {
  const k = normKey(raw);
  if (!k.includes("|")) return k;

  const [a, b] = k.split("|");
  // a should be planet, b should be sign/house token
  const A = normPlanetToken(a);
  const B = normSignToken(b);
  return `${A}|${B}`;
}

// Exact map (original keys)
const LOOKUP_EXACT = new Map<string, DoctrineCard>(CARDS.map((c) => [c.key, c]));

// Normalized map (case-insensitive / tolerant)
const LOOKUP_NORM = new Map<string, DoctrineCard>();
for (const c of CARDS) {
  const nk = canonizeIncomingKey(c.key);
  if (!LOOKUP_NORM.has(nk)) LOOKUP_NORM.set(nk, c);
}

// Resolve incoming keys against both maps
function resolveCard(key: string) {
  const exact = LOOKUP_EXACT.get(key);
  if (exact) return exact;

  const nk = canonizeIncomingKey(key);
  return LOOKUP_NORM.get(nk) ?? null;
}

function bad(msg: string, code: string = "BAD_REQUEST", status = 400) {
  return NextResponse.json({ ok: false, error: msg, code }, { status });
}

function validateModeCount(mode: Mode, n: number) {
  if (mode === "placement") return n === 1;
  if (mode === "pair") return n === 2;
  if (mode === "mini_chart") return n >= 3 && n <= 6;
  return false;
}

function pickBullets(arr: string[], max = 5) {
  return Array.isArray(arr) ? arr.slice(0, Math.max(1, Math.min(max, arr.length))) : [];
}

function buildMock(keys: string[], lens: Lens, question?: string) {
  const cards = keys.map((k) => resolveCard(k)).filter(Boolean);
  const headline =
    lens === "relationships"
      ? "Pattern shows up most clearly through partnership dynamics."
      : "Grounded theme, expressed through lived choices.";
  const coreTheme =
    `This synthesis is generated without an LLM (mock mode). It is grounded in: ${keys.join(", ")}. ` +
    `Use it to verify the pipeline; switch on OPENAI_API_KEY to enable the real synthesis layer.` +
    (question ? ` Question: ${question}` : "");

  const strengths = pickBullets(cards.flatMap((c: any) => c.strengths ?? []), 5);
  const shadows = pickBullets(cards.flatMap((c: any) => c.shadows ?? []), 5);
  const directives = pickBullets(cards.flatMap((c: any) => c.directives ?? []), 5);

  const placements = cards.map((c: any) => ({
    key: c.key,
    placement: c.labels?.placement ?? c.key,
    functionCore: c.function?.core ?? "",
    styleStrategy: c.style?.strategy ?? "",
    arenaDomain: c.arena?.domain ?? "",
  }));

  return {
    ok: true,
    version: "1.0" as const,
    mode:
      keys.length === 1 ? ("placement" as const) : keys.length === 2 ? ("pair" as const) : ("mini_chart" as const),
    lens,
    usedKeys: keys,
    output: {
      headline,
      coreTheme,
      strengths,
      shadows,
      directives,
      livedExamples: ["This is a baseline synthesis. When the LLM is enabled, you’ll get clearer situational phrasing."],
      journalPrompts: [
        "Where is this pattern most visible in my week right now?",
        "What boundary or habit would make this placement cleaner?",
        "What am I avoiding that this placement is asking me to face?",
      ],
      watchFors: ["If you notice you’re spiraling, return to the directives and pick one action you can complete today."],
    },
    grounding: { placements },
    meta: { model: "mock", latencyMs: 0 },
  };
}

// --- LLM CALL (OpenAI via fetch) ---
async function callLLM(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set.");

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const t0 = Date.now();
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You are a synthesis layer for a deterministic astrology doctrine.",
            "Rules:",
            "- Use ONLY the provided doctrine cards. Do not introduce new meanings, archetypes, or claims.",
            "- No predictions. No fate statements. No emojis. No fluff.",
            "- Output MUST be valid JSON only (no markdown, no extra text).",
            "- Keep tone grounded, precise, and practical.",
            "- If the user asks a question, answer it using only the doctrine content.",
          ].join("\n"),
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const json = await r.json();
  const latencyMs = Date.now() - t0;

  if (!r.ok) {
    const msg = json?.error?.message || `LLM error (status ${r.status})`;
    throw new Error(msg);
  }

  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty LLM response content.");

  return { content, model, latencyMs };
}

function safeJsonParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const chunk = s.slice(start, end + 1);
      return JSON.parse(chunk);
    }
    throw new Error("Failed to parse LLM JSON.");
  }
}

export async function POST(req: Request) {
  let body: ReqBody | null = null;

  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return bad("Invalid JSON body.");
  }

  if (!body || body.version !== "1.0") return bad("version must be '1.0'.");

  const mode = body.mode;
  const keysRaw = Array.isArray(body.keys) ? body.keys.map(String) : [];
  const lens: Lens = (body.lens as Lens) || "general";
  const question = (body.question || "").trim();

  if (!mode) return bad("mode is required.");
  if (keysRaw.length < 1) return bad("keys must be a non-empty array.");
  if (!validateModeCount(mode, keysRaw.length)) {
    return bad(`keys length does not match mode. mode=${mode} keys=${keysRaw.length}`);
  }

  // ✅ Keep original for usedKeys, but resolve tolerant
  const cards = keysRaw.map((k) => resolveCard(k));
  if (cards.some((c) => !c)) {
    const missing = keysRaw.filter((k) => !resolveCard(k));
    return bad(`Unknown doctrine keys: ${missing.join(", ")}`, "NOT_FOUND", 404);
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(buildMock(keysRaw, lens, question));
  }

  const maxBullets = body.output?.maxBullets ?? 5;
  const format = body.output?.format ?? "standard";
  const includeJournalPrompts = body.output?.includeJournalPrompts ?? true;

  const grounding = cards.map((c: any) => ({
    key: c.key,
    placement: c.labels?.placement ?? c.key,
    function: c.function?.core ?? "",
    style: `${c.style?.strategy ?? ""} (${c.labels?.modality ?? ""} ${c.labels?.element ?? ""})`.trim(),
    arena: c.arena?.domain ?? "",
    synthesis: c.synthesis ?? "",
    strengths: c.strengths ?? [],
    shadows: c.shadows ?? [],
    directives: c.directives ?? [],
  }));

  const schemaHint = {
    ok: true,
    version: "1.0",
    mode,
    lens,
    usedKeys: keysRaw,
    output: {
      headline: "string",
      coreTheme: "string",
      strengths: ["string"],
      shadows: ["string"],
      directives: ["string"],
      livedExamples: ["string"],
      journalPrompts: ["string"],
      watchFors: ["string"],
    },
    grounding: {
      placements: grounding.map((g: any) => ({
        key: g.key,
        placement: g.placement,
        functionCore: g.function,
        styleStrategy: g.style,
        arenaDomain: g.arena,
      })),
    },
  };

  const prompt = [
    `TASK: Synthesize the doctrine grounding into a ${format} interpretation.`,
    `LENS: ${lens}`,
    question ? `USER_QUESTION: ${question}` : "",
    `CONSTRAINTS:`,
    `- Do not add new meanings. Use only grounding.`,
    `- No predictions.`,
    `- Keep it practical and clear.`,
    `OUTPUT: Return JSON matching this shape (values real, not placeholders):`,
    JSON.stringify(schemaHint, null, 2),
    `GROUNDING (authoritative doctrine cards):`,
    JSON.stringify(grounding, null, 2),
    `BULLET_LIMIT: ${maxBullets}`,
    `INCLUDE_JOURNAL_PROMPTS: ${includeJournalPrompts ? "true" : "false"}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const { content, model, latencyMs } = await callLLM(prompt);
    const parsed = safeJsonParse(content);

    parsed.ok = true;
    parsed.version = "1.0";
    parsed.mode = mode;
    parsed.lens = lens;
    parsed.usedKeys = keysRaw;

    const out = parsed.output || {};
    out.strengths = pickBullets(out.strengths || [], maxBullets);
    out.shadows = pickBullets(out.shadows || [], maxBullets);
    out.directives = pickBullets(out.directives || [], maxBullets);
    if (!includeJournalPrompts) out.journalPrompts = [];

    parsed.output = out;

    parsed.grounding = {
      placements: grounding.map((g: any) => ({
        key: g.key,
        placement: g.placement,
        functionCore: g.function,
        styleStrategy: g.style,
        arenaDomain: g.arena,
      })),
    };

    parsed.meta = { model, latencyMs };

    return NextResponse.json(parsed);
  } catch (err: any) {
    return bad(err?.message || "LLM synthesis error.", "LLM_ERROR", 500);
  }
}
