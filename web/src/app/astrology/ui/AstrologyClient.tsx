// src/app/astrology/ui/AstrologyClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

type LookupOk = { ok: true; key: string; card: any };
type LookupErr = { ok: false; error: string };
type LookupResp = LookupOk | LookupErr;

type SxOk = {
  ok: true;
  version: "1.0";
  mode: "placement" | "pair" | "mini_chart";
  lens: string;
  usedKeys: string[];
  output: any;
  meta?: any;
};
type SxErr = { ok: false; error: string; code?: string };
type SxResp = SxOk | SxErr;

type Mode = "placement" | "pair" | "mini_chart";
type Lens =
  | "general"
  | "relationships"
  | "work"
  | "health"
  | "creativity"
  | "spiritual"
  | "shadow"
  | "growth";

const TOKENS = {
  panelBg: "rgba(24, 44, 32, 0.68)",
  panelBgSoft: "rgba(28, 52, 38, 0.52)",
  panelBorder: "rgba(244,235,221,0.12)",
  inputBg: "rgba(24, 44, 32, 0.45)",
  inputBorder: "rgba(244,235,221,0.14)",
  text: "rgba(244,235,221,0.88)",
  textSoft: "rgba(244,235,221,0.70)",
  pillBg: "rgba(244,235,221,0.07)",
  pillBorder: "rgba(244,235,221,0.16)",
  buttonBg: "rgba(244,235,221,0.82)",
  buttonText: "rgba(15,26,18,0.92)",
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-xs"
      style={{
        borderColor: TOKENS.pillBorder,
        background: TOKENS.pillBg,
        color: TOKENS.text,
      }}
    >
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: TOKENS.textSoft }}>
      {children}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: TOKENS.panelBorder,
        background: TOKENS.panelBgSoft,
        backdropFilter: "blur(10px)",
      }}
    >
      {children}
    </div>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        borderColor: TOKENS.panelBorder,
        background: TOKENS.panelBg,
        backdropFilter: "blur(12px)",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Normalize natal chips like:
 *  - "Moon Capricorn 3° 46'" -> "Moon Capricorn"
 *  - "Mars Sagittarius 26° 10'" -> "Mars Sagittarius"
 *
 * If house exists ("Moon Cancer 4th house"), we keep it.
 */
function normalizePlacementForLookup(raw: string) {
  let s = (raw || "").trim();
  if (!s) return "";

  // remove “prime” type characters that sometimes survive the degree regex
  // (', ’, ′, ″) — these are NOT meaningful for doctrine lookup
  s = s.replace(/[’'′″]/g, "");

  // Preserve explicit house patterns
  const hasHouse = /\b(1[0-2]|[1-9])(?:st|nd|rd|th)?\s+house\b/i.test(s);
  if (hasHouse) {
    // Still strip degrees
    s = s.replace(/\b\d{1,2}\s*°\s*\d{1,2}\b/g, "").trim();
    s = s.replace(/\b\d{1,2}\s*°\b/g, "").trim();
    s = s.replace(/\s{2,}/g, " ").trim();
    return s;
  }

  // Remove degree/minute chunks
  s = s.replace(/\b\d{1,2}\s*°\s*\d{1,2}\b/g, "").trim();
  s = s.replace(/\b\d{1,2}\s*°\b/g, "").trim();
  s = s.replace(/\s{2,}/g, " ").trim();

  // Remove stray punctuation
  s = s.replace(/[•·]/g, " ").replace(/\s{2,}/g, " ").trim();

  return s;
}

/**
 * Canonicalize user input to increase hit rate:
 * - trims
 * - collapses spaces
 * - title-cases planet/sign words (Moon Capricorn, not moon capricorn)
 * - keeps "North Node" / "South Node" as two words
 * - keeps "10th house" as-is
 */
function canonicalizeQuery(raw: string) {
  let s = normalizePlacementForLookup(raw);
  if (!s) return "";

  // collapse spaces
  s = s.replace(/\s+/g, " ").trim();

  // If it includes "house", just title-case the planet/sign portion and leave house intact.
  const mHouse = s.match(/^(.+?)\s+((?:1[0-2]|[1-9])(?:st|nd|rd|th)?\s+house)$/i);
  const base = mHouse ? mHouse[1] : s;
  const housePart = mHouse ? ` ${mHouse[2].toLowerCase()}` : "";

  // normalize common multiword planets/nodes
  const baseLower = base.toLowerCase();

  const planetVariants: Array<[RegExp, string]> = [
    [/^north\s*node\b/i, "North Node"],
    [/^south\s*node\b/i, "South Node"],
    [/^true\s*node\b/i, "North Node"],
    [/^mean\s*node\b/i, "North Node"],
  ];

  let rewritten = base;
  for (const [rx, rep] of planetVariants) {
    if (rx.test(baseLower)) {
      rewritten = rewritten.replace(rx, rep);
      break;
    }
  }

  // title-case each word except small ordinals are already handled via housePart
  const words = rewritten.split(" ").filter(Boolean);
  const tc = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

  // keep common planet abbreviations clean if user types weird
  const out = words.map(tc).join(" ");

  return (out + housePart).trim();
}

function readAutoParam(): string | null {
  try {
    const sp = new URLSearchParams(window.location.search);
    return sp.get("auto");
  } catch {
    return null;
  }
}

export default function AstrologyClient() {
  const [mode, setMode] = useState<Mode>("placement");
  const [natalExpanded, setNatalExpanded] = useState(false);

  // Single
  const [q, setQ] = useState("Mars Virgo");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<LookupResp | null>(null);

  // Pair
  const [pairA, setPairA] = useState("Venus Scorpio");
  const [pairB, setPairB] = useState("Mars Virgo");
  const [pairLoading, setPairLoading] = useState(false);
  const [pairCards, setPairCards] = useState<{ key: string; card: any }[] | null>(null);
  const [pairErr, setPairErr] = useState<string | null>(null);

  // Mini (3–6)
  const [miniInputs, setMiniInputs] = useState<string[]>(["Sun Capricorn", "Moon Cancer", "Mercury Aquarius"]);
  const [miniLoading, setMiniLoading] = useState(false);
  const [miniCards, setMiniCards] = useState<{ key: string; card: any }[] | null>(null);
  const [miniErr, setMiniErr] = useState<string | null>(null);

  // Shared synthesis
  const [lens, setLens] = useState<Lens>("general");
  const [question, setQuestion] = useState("");
  const [sxLoading, setSxLoading] = useState(false);
  const [sx, setSx] = useState<SxResp | null>(null);

  // Natal placements
  const [natalPlacements, setNatalPlacements] = useState<string[]>([]);

  const examples = useMemo(
    () => [
      "Sun Capricorn",
      "Moon Cancer",
      "Mercury Aquarius",
      "Venus Scorpio",
      "Mars Virgo",
      "Chiron Aries",
      "North Node Aquarius",
      "South Node Leo",
      "Sun Capricorn 10th house",
      "Moon Cancer 4th house",
    ],
    []
  );

  function resetSynthesis() {
    setSx(null);
  }

  // Load natal placements once (client only)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ura:natalPlacements");
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed?.placements) ? parsed.placements : [];
      const cleaned = arr
        .map((x: any) => String(x || ""))
        .map((x: string) => x.trim())
        .filter(Boolean);

      setNatalPlacements(cleaned);

      const auto = readAutoParam();
      if (auto === "natal" && cleaned.length > 0) {
        const normalized = canonicalizeQuery(cleaned[0]);
        setMode("placement");
        setQ(normalized);
        setTimeout(() => runLookup(normalized), 0);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function lookupOne(queryRaw: string): Promise<{ key: string; card: any }> {
    const query = canonicalizeQuery(queryRaw);
    const r = await fetch(`/api/astrology?q=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const data = (await r.json()) as LookupResp;
    if (!data.ok) throw new Error((data as any).error || "Lookup failed.");
    return { key: (data as any).key, card: (data as any).card };
  }

  async function runLookup(forceQuery?: string) {
    const query = canonicalizeQuery((forceQuery ?? q).trim());
    if (!query) return;

    setLoading(true);
    setResp(null);
    resetSynthesis();

    try {
      const out = await lookupOne(query);
      setResp({ ok: true, key: out.key, card: out.card });
    } catch (e: any) {
      setResp({ ok: false, error: e?.message || "Lookup failed." });
    } finally {
      setLoading(false);
    }
  }

  async function runPairLookup() {
    setPairLoading(true);
    setPairErr(null);
    setPairCards(null);
    resetSynthesis();

    try {
      const a = await lookupOne(pairA.trim());
      const b = await lookupOne(pairB.trim());
      setPairCards([a, b]);
    } catch (e: any) {
      setPairErr(e?.message || "Pair lookup failed.");
    } finally {
      setPairLoading(false);
    }
  }

  async function runMiniLookup() {
    setMiniLoading(true);
    setMiniErr(null);
    setMiniCards(null);
    resetSynthesis();

    try {
      const cleaned = miniInputs.map((x) => canonicalizeQuery(x)).filter(Boolean);
      if (cleaned.length < 3 || cleaned.length > 6) throw new Error("Mini chart needs 3–6 placements.");

      const outs: { key: string; card: any }[] = [];
      for (const entry of cleaned) outs.push(await lookupOne(entry));
      setMiniCards(outs);
    } catch (e: any) {
      setMiniErr(e?.message || "Mini lookup failed.");
    } finally {
      setMiniLoading(false);
    }
  }

  async function runSynthesis(keys: string[], sxMode: Mode) {
    setSxLoading(true);
    setSx(null);

    try {
      const r = await fetch(`/api/astrology/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          version: "1.0",
          mode: sxMode,
          keys,
          lens,
          question: question.trim() || undefined,
          output: { format: "standard", maxBullets: 5, includeJournalPrompts: true },
          constraints: { noPrediction: true, noNewClaims: true, citeDoctrineKeys: true },
        }),
      });

      const data = (await r.json()) as SxResp;
      setSx(data);
    } catch (e: any) {
      setSx({ ok: false, error: e?.message || "Synthesis failed." });
    } finally {
      setSxLoading(false);
    }
  }

  function renderDoctrineCard(card: any) {
    return (
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: TOKENS.text }}>
        <div className="flex flex-wrap gap-2">
          {card.labels?.element ? <Pill>Element: {card.labels.element}</Pill> : null}
          {card.labels?.modality ? <Pill>Modality: {card.labels.modality}</Pill> : null}
          <Pill>Key: {card.key}</Pill>
        </div>

        {card.function?.core ? (
          <div>
            <SectionTitle>Function (Planet)</SectionTitle>
            <div>{card.function.core}</div>
          </div>
        ) : null}

        {card.style?.strategy ? (
          <div>
            <SectionTitle>Style (Sign)</SectionTitle>
            <div>{card.style.strategy}</div>
          </div>
        ) : null}

        {card.arena?.domain ? (
          <div>
            <SectionTitle>Arena (House)</SectionTitle>
            <div>{card.arena.domain}</div>
          </div>
        ) : null}

        {card.synthesis ? (
          <div>
            <SectionTitle>Synthesis</SectionTitle>
            <div>{card.synthesis}</div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          <div className="sm:w-1/2">
            <SectionTitle>Strengths</SectionTitle>
            <ul className="mt-1 list-disc pl-5">
              {(card.strengths ?? []).map((x: string) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>

          <div className="sm:w-1/2">
            <SectionTitle>Shadows</SectionTitle>
            <ul className="mt-1 list-disc pl-5">
              {(card.shadows ?? []).map((x: string) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <SectionTitle>Directives</SectionTitle>
          <ul className="mt-1 list-disc pl-5">
            {(card.directives ?? []).map((x: string) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  function renderSynthesis() {
    if (!sx) return null;
    if (!sx.ok) {
      return (
        <p className="mt-3 text-sm" style={{ color: "rgba(255,180,180,0.95)" }}>
          {sx.error}
        </p>
      );
    }

    return (
      <div
        className="mt-4 rounded-xl border p-4"
        style={{
          borderColor: TOKENS.panelBorder,
          background: TOKENS.panelBgSoft,
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Pill>LLM keys: {sx.usedKeys.join(", ")}</Pill>
          {sx.meta?.model && <Pill>Model: {sx.meta.model}</Pill>}
        </div>

        <div className="mt-4 space-y-3 text-sm leading-relaxed" style={{ color: TOKENS.text }}>
          <div>
            <SectionTitle>Headline</SectionTitle>
            <div className="text-base font-semibold" style={{ color: "rgba(244,235,221,0.92)" }}>
              {sx.output?.headline}
            </div>
          </div>

          <div>
            <SectionTitle>Core theme</SectionTitle>
            <div>{sx.output?.coreTheme}</div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <div className="sm:w-1/2">
              <SectionTitle>Strengths</SectionTitle>
              <ul className="mt-1 list-disc pl-5">
                {(sx.output?.strengths ?? []).map((x: string) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            <div className="sm:w-1/2">
              <SectionTitle>Shadows</SectionTitle>
              <ul className="mt-1 list-disc pl-5">
                {(sx.output?.shadows ?? []).map((x: string) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <SectionTitle>Directives</SectionTitle>
            <ul className="mt-1 list-disc pl-5">
              {(sx.output?.directives ?? []).map((x: string) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>

          {(sx.output?.livedExamples?.length ?? 0) > 0 && (
            <div>
              <SectionTitle>Lived examples</SectionTitle>
              <ul className="mt-1 list-disc pl-5">
                {(sx.output?.livedExamples ?? []).map((x: string) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}

          {(sx.output?.journalPrompts?.length ?? 0) > 0 && (
            <div>
              <SectionTitle>Journal prompts</SectionTitle>
              <ul className="mt-1 list-disc pl-5">
                {(sx.output?.journalPrompts ?? []).map((x: string) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}

          {(sx.output?.watchFors?.length ?? 0) > 0 && (
            <div>
              <SectionTitle>Watch for</SectionTitle>
              <ul className="mt-1 list-disc pl-5">
                {(sx.output?.watchFors ?? []).map((x: string) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Natal Chart - Collapsible */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          borderColor: TOKENS.panelBorder,
          background: TOKENS.panelBg,
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Collapsed header - always visible */}
        <button
          type="button"
          onClick={() => setNatalExpanded((v) => !v)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition"
        >
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: TOKENS.textSoft }}>
              Natal Chart
            </div>
            <div className="mt-1 text-sm" style={{ color: TOKENS.textSoft }}>
              {natalPlacements.length > 0
                ? `${natalPlacements.length} placements loaded`
                : "No placements loaded yet"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setResp(null);
                setPairCards(null);
                setMiniCards(null);
                resetSynthesis();
                try {
                  const raw = sessionStorage.getItem("ura:natalPlacements");
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    const arr = Array.isArray(parsed?.placements) ? parsed.placements : [];
                    const cleaned = arr
                      .map((x: any) => String(x || ""))
                      .map((x: string) => x.trim())
                      .filter(Boolean);
                    setNatalPlacements(cleaned);
                  }
                } catch {
                  // ignore
                }
              }}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold transition"
              style={{ background: TOKENS.buttonBg, color: TOKENS.buttonText }}
            >
              Refresh
            </button>

            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: TOKENS.pillBg, border: `1px solid ${TOKENS.pillBorder}` }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: TOKENS.text, transition: "transform 150ms", transform: natalExpanded ? "rotate(180deg)" : "" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </button>

        {/* Expanded content */}
        {natalExpanded && (
          <div className="px-5 pb-5 pt-1" style={{ borderTop: `1px solid ${TOKENS.panelBorder}` }}>
            {natalPlacements.length === 0 ? (
              <div className="py-4 text-sm text-center" style={{ color: TOKENS.textSoft }}>
                No natal placements loaded. Visit your profile to load natal data.
              </div>
            ) : (
              <>
                <div className="text-xs mb-3" style={{ color: TOKENS.textSoft }}>
                  Click a placement to look it up in the doctrine.
                </div>

                {/* Two-column list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {natalPlacements.map((raw) => {
                    const normalized = canonicalizeQuery(raw);
                    return (
                      <button
                        key={raw}
                        type="button"
                        onClick={() => {
                          setMode("placement");
                          setQ(normalized);
                          resetSynthesis();
                          runLookup(normalized);
                        }}
                        className="rounded-xl px-4 py-2.5 text-left text-sm font-medium transition hover:bg-white/[0.04]"
                        style={{
                          background: TOKENS.pillBg,
                          border: `1px solid ${TOKENS.pillBorder}`,
                          color: TOKENS.text,
                        }}
                        title={`Lookup: ${normalized}`}
                      >
                        {raw}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mode + Lens + Optional Question */}
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["placement", "pair", "mini_chart"] as Mode[]).map((m) => {
              const label = m === "placement" ? "Single" : m === "pair" ? "Pair" : "Mini chart";
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setResp(null);
                    setPairCards(null);
                    setMiniCards(null);
                    resetSynthesis();
                  }}
                  className="rounded-full border px-4 py-2 text-sm font-semibold transition"
                  style={{
                    borderColor: TOKENS.pillBorder,
                    background: active ? TOKENS.buttonBg : TOKENS.pillBg,
                    color: active ? TOKENS.buttonText : TOKENS.text,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs" style={{ color: TOKENS.textSoft }}>
              Lens
            </label>
            <select
              value={lens}
              onChange={(e) => setLens(e.target.value as Lens)}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: TOKENS.inputBorder,
                background: TOKENS.inputBg,
                color: TOKENS.text,
              }}
            >
              <option value="general">General</option>
              <option value="relationships">Relationships</option>
              <option value="work">Work</option>
              <option value="health">Health</option>
              <option value="creativity">Creativity</option>
              <option value="spiritual">Spiritual</option>
              <option value="shadow">Shadow</option>
              <option value="growth">Growth</option>
            </select>
          </div>
        </div>

        <div className="mt-3">
          <label className="text-xs" style={{ color: TOKENS.textSoft }}>
            Optional question
          </label>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What’s the cleanest way to work with this pattern?"
            className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={{
              borderColor: TOKENS.inputBorder,
              background: TOKENS.inputBg,
              color: TOKENS.text,
            }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setQ(ex);
                resetSynthesis();
              }}
              className="text-left"
              title="Use example"
            >
              <Pill>{ex}</Pill>
            </button>
          ))}
        </div>
      </Panel>

      {/* SINGLE */}
      {mode === "placement" && (
        <>
          <Panel>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runLookup();
                }}
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                style={{
                  borderColor: TOKENS.inputBorder,
                  background: TOKENS.inputBg,
                  color: TOKENS.text,
                }}
              />
              <button
                onClick={() => runLookup()}
                disabled={loading}
                className="rounded-xl px-5 py-3 text-sm font-semibold transition"
                style={{
                  background: loading ? "rgba(244,235,221,0.18)" : TOKENS.buttonBg,
                  color: TOKENS.buttonText,
                  opacity: loading ? 0.75 : 1,
                }}
              >
                {loading ? "Running…" : "Lookup"}
              </button>
            </div>

            {resp && !resp.ok && (
              <p className="mt-3 text-sm" style={{ color: "rgba(255,180,180,0.95)" }}>
                {resp.error}
              </p>
            )}
          </Panel>

          {resp && resp.ok && (
            <CardShell>
              <h2 className="text-lg font-semibold" style={{ color: "rgba(244,235,221,0.92)" }}>
                {resp.card.labels?.placement ?? "Placement"}
              </h2>

              <div className="mt-4">{renderDoctrineCard(resp.card)}</div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => runSynthesis([resp.key], "placement")}
                  disabled={sxLoading}
                  className="rounded-xl px-4 py-2 text-sm font-semibold transition"
                  style={{
                    background: sxLoading ? "rgba(244,235,221,0.18)" : TOKENS.buttonBg,
                    color: TOKENS.buttonText,
                    opacity: sxLoading ? 0.75 : 1,
                  }}
                >
                  {sxLoading ? "Synthesizing…" : "Synthesize (LLM)"}
                </button>
              </div>

              {renderSynthesis()}
            </CardShell>
          )}
        </>
      )}

      {/* PAIR */}
      {mode === "pair" && (
        <CardShell>
          <h2 className="text-lg font-semibold" style={{ color: "rgba(244,235,221,0.92)" }}>
            Pair mode
          </h2>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={pairA}
              onChange={(e) => setPairA(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
              style={{ borderColor: TOKENS.inputBorder, background: TOKENS.inputBg, color: TOKENS.text }}
            />
            <input
              value={pairB}
              onChange={(e) => setPairB(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
              style={{ borderColor: TOKENS.inputBorder, background: TOKENS.inputBg, color: TOKENS.text }}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={runPairLookup}
              disabled={pairLoading}
              className="rounded-xl px-4 py-2 text-sm font-semibold transition"
              style={{
                background: pairLoading ? "rgba(244,235,221,0.18)" : TOKENS.buttonBg,
                color: TOKENS.buttonText,
                opacity: pairLoading ? 0.75 : 1,
              }}
            >
              {pairLoading ? "Looking up…" : "Lookup pair"}
            </button>

            <button
              onClick={() => pairCards && runSynthesis(pairCards.map((x) => x.key), "pair")}
              disabled={sxLoading || !pairCards}
              className="rounded-xl px-4 py-2 text-sm font-semibold transition"
              style={{
                background: sxLoading || !pairCards ? "rgba(244,235,221,0.18)" : TOKENS.buttonBg,
                color: TOKENS.buttonText,
                opacity: sxLoading || !pairCards ? 0.75 : 1,
              }}
            >
              {sxLoading ? "Synthesizing…" : "Synthesize pair (LLM)"}
            </button>
          </div>

          {pairErr && (
            <p className="mt-3 text-sm" style={{ color: "rgba(255,180,180,0.95)" }}>
              {pairErr}
            </p>
          )}

          {pairCards && (
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {pairCards.map((x) => (
                <div key={x.key}>
                  <h3 className="text-base font-semibold" style={{ color: "rgba(244,235,221,0.92)" }}>
                    {x.card.labels?.placement ?? "Placement"}
                  </h3>
                  <div className="mt-3">{renderDoctrineCard(x.card)}</div>
                </div>
              ))}
            </div>
          )}

          {renderSynthesis()}
        </CardShell>
      )}

      {/* MINI */}
      {mode === "mini_chart" && (
        <CardShell>
          <h2 className="text-lg font-semibold" style={{ color: "rgba(244,235,221,0.92)" }}>
            Mini chart mode
          </h2>
          <p className="mt-1 text-sm" style={{ color: TOKENS.textSoft }}>
            Add 3–6 placements (planets / chiron / nodes). Houses optional.
          </p>

          <div className="mt-4 space-y-2">
            {miniInputs.map((val, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={val}
                  onChange={(e) => {
                    const next = [...miniInputs];
                    next[idx] = e.target.value;
                    setMiniInputs(next);
                    resetSynthesis();
                  }}
                  className="w-full rounded-xl border px-4 py-2 text-sm outline-none"
                  style={{ borderColor: TOKENS.inputBorder, background: TOKENS.inputBg, color: TOKENS.text }}
                />
                <button
                  onClick={() => {
                    const next = miniInputs.filter((_, i) => i !== idx);
                    setMiniInputs(next.length ? next : [""]);
                    resetSynthesis();
                  }}
                  className="rounded-xl border px-3 py-2 text-sm font-semibold"
                  style={{
                    borderColor: TOKENS.inputBorder,
                    background: TOKENS.pillBg,
                    color: TOKENS.text,
                  }}
                  title="Remove"
                >
                  –
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (miniInputs.length >= 6) return;
                setMiniInputs([...miniInputs, ""]);
                resetSynthesis();
              }}
              className="rounded-xl border px-3 py-2 text-sm font-semibold"
              style={{ borderColor: TOKENS.inputBorder, background: TOKENS.pillBg, color: TOKENS.text }}
            >
              + Add placement
            </button>

            <button
              onClick={runMiniLookup}
              disabled={miniLoading}
              className="rounded-xl px-4 py-2 text-sm font-semibold transition"
              style={{
                background: miniLoading ? "rgba(244,235,221,0.18)" : TOKENS.buttonBg,
                color: TOKENS.buttonText,
                opacity: miniLoading ? 0.75 : 1,
              }}
            >
              {miniLoading ? "Looking up…" : "Lookup mini chart"}
            </button>

            <button
              onClick={() => miniCards && runSynthesis(miniCards.map((x) => x.key), "mini_chart")}
              disabled={sxLoading || !miniCards}
              className="rounded-xl px-4 py-2 text-sm font-semibold transition"
              style={{
                background: sxLoading || !miniCards ? "rgba(244,235,221,0.18)" : TOKENS.buttonBg,
                color: TOKENS.buttonText,
                opacity: sxLoading || !miniCards ? 0.75 : 1,
              }}
            >
              {sxLoading ? "Synthesizing…" : "Synthesize mini (LLM)"}
            </button>
          </div>

          {miniErr && (
            <p className="mt-3 text-sm" style={{ color: "rgba(255,180,180,0.95)" }}>
              {miniErr}
            </p>
          )}

          {miniCards && (
            <div className="mt-6 space-y-6">
              {miniCards.map((x) => (
                <div key={x.key}>
                  <h3 className="text-base font-semibold" style={{ color: "rgba(244,235,221,0.92)" }}>
                    {x.card.labels?.placement ?? "Placement"}
                  </h3>
                  <div className="mt-3">{renderDoctrineCard(x.card)}</div>
                </div>
              ))}
            </div>
          )}

          {renderSynthesis()}
        </CardShell>
      )}
    </section>
  );
}
