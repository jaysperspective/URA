// scripts/generate-sabian.mjs
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const ROOT = process.cwd();

// Load Next-style env files (.env.local wins)
dotenv.config({ path: path.resolve(ROOT, ".env") });
dotenv.config({ path: path.resolve(ROOT, ".env.local"), override: true });

const OUT_PATH = path.resolve(ROOT, "src/lib/sabian/uraSabian.ts");

const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

function mustEnv(...names) {
  for (const name of names) {
    const v = process.env[name];
    if (v && String(v).trim()) return String(v).trim();
  }
  throw new Error(`Missing env. Tried: ${names.join(", ")}`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildDegreeKeys() {
  const keys = [];
  for (let s = 0; s < 12; s++) {
    for (let d = 1; d <= 30; d++) {
      const idx = s * 30 + (d - 1);
      keys.push({ idx, sign: SIGNS[s], degree: d, key: `${SIGNS[s]} ${d}` });
    }
  }
  return keys;
}

function systemPrompt() {
  return `
You are generating URA's Sabian Degree Reference dataset.

Hard rules:
- Write ORIGINAL text. Do NOT reproduce canonical Sabian phrases.
- No prediction or fortune telling.
- Write in grounded, practical URA language.

Return JSON ONLY:
{
  "entries": [
    {
      "idx": number,
      "key": string,
      "sign": string,
      "degree": number,
      "symbol": string,
      "signal": string,
      "shadow": string,
      "directive": string,
      "practice": string,
      "journal": string,
      "tags": string[]
    }
  ]
}
`.trim();
}

function userPrompt(batch) {
  return `
Generate URA Sabian entries for these degrees:

${batch.map((x) => `${x.idx}: ${x.key}`).join("\n")}

Rules:
- One symbolic image line
- Practical directive + practice
- One sharp journal question

Return JSON only.
`.trim();
}

async function callOpenAI({ apiKey, model, content }) {
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

  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `OpenAI error ${r.status}`);
  return JSON.parse(data.choices[0].message.content);
}

function validate(entries) {
  if (!Array.isArray(entries)) throw new Error("entries must be array");
  return entries;
}

/* =======================
   MAIN ENTRY POINT
   ======================= */
async function main() {
  const apiKey = mustEnv(
    "OPENAI_API_KEY",
    "URA_OPENAI_API_KEY",
    "OPENAI_KEY"
  );

  const model =
    process.env.URA_OPENAI_MODEL ||
    process.env.OPENAI_MODEL ||
    "gpt-4.1-mini";

  const all = buildDegreeKeys();
  const batchSize = 12;
  const out = new Array(360);

  for (let i = 0; i < all.length; i += batchSize) {
    const batch = all.slice(i, i + batchSize);
    console.log(`Generating ${batch[0].idx}–${batch.at(-1).idx}`);

    const json = await callOpenAI({
      apiKey,
      model,
      content: userPrompt(batch),
    });

    const entries = validate(json.entries);

    for (const e of entries) out[e.idx] = e;

    await sleep(800);
  }

  if (out.some((x) => !x)) throw new Error("Missing entries");

  fs.writeFileSync(
    OUT_PATH,
    `export const URA_SABIAN = ${JSON.stringify(out, null, 2)};`,
    "utf8"
  );

  console.log(`✅ Sabian dataset written to ${OUT_PATH}`);
}

main().catch((e) => {
  console.error("❌ generate-sabian failed:", e);
  process.exit(1);
});
