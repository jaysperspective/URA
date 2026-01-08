// src/app/astrology/ui/AstrologyClient.tsx
"use client";

import { useMemo, useState } from "react";

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
  grounding?: any;
  meta?: any;
};
type SxErr = { ok: false; error: string; code?: string };
type SxResp = SxOk | SxErr;

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-xs"
      style={{
        borderColor: "rgba(244,235,221,0.18)",
        background: "rgba(244,235,221,0.08)",
        color: "rgba(244,235,221,0.82)",
      }}
    >
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-xs font-semibold uppercase tracking-wide"
      style={{ color: "rgba(244,235,221,0.62)" }}
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
        borderColor: "rgba(244,235,221,0.14)",
        background: "rgba(244,235,221,0.08)",
      }}
    >
      {children}
    </div>
  );
}

export default function AstrologyClient() {
  type Mode = "placement" | "pair" | "mini_chart";

  const [mode, setMode] = useState<Mode>("placement");

  // Placement input (single lookup)
  const [q, setQ] = useState("Mars in Virgo 6th house");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<LookupResp | null>(null);

  // Pair mode
  const [pairA, setPairA] = useState("Venus Scorpio 7th house");
  const [pairB, setPairB] = useState("Mars Virgo 6th house");
  const [pairLoading, setPairLoading] = useState(false);
  const [pairCards, setPairCards] = useState<{ key: string; card: any }[] | null>(null);
  const [pairErr, setPairErr] = useState<string | null>(null);

  // Mini chart mode (3–6)
  const [miniInputs, setMiniInputs] = useState<string[]>([
    "Sun Capricorn 10th house",
    "Moon Cancer 4th house",
    "Venus  Scorpio 1st house", // NOTE: not supported by doctrine unless you add ASC as a body
  ]);
  const [miniLoading, setMiniLoading] = useState(false);
  const [miniCards, setMiniCards] = useState<{ key: string; card: any }[] | null>(null);
  const [miniErr, setMiniErr] = useState<string | null>(null);

  // Synthesis controls (shared)
  const [lens, setLens] = useState<
    "general" | "relationships" | "work" | "health" | "creativity" | "spiritual" | "shadow" | "growth"
  >("general");
  const [question, setQuestion] = useState("");
  const [sxLoading, setSxLoading] = useState(false);
  const [sx, setSx] = useState<SxResp | null>(null);

  const examples = useMemo(
    () => [
      "Sun Capricorn 10th house",
      "Moon Cancer 4",
      "Mercury Aquarius 3rd",
      "Venus Scorpio 7th house",
      "Mars Virgo 6",
      "Chiron Aries 1st",
      "North Node Aquarius 11",
      "South Node Leo 5",
    ],
    []
  );

  function resetSynthesis() {
    setSx(null);
    setQuestion("");
  }

  async function lookupOne(query: string): Promise<{ key: string; card: any }> {
    const r = await fetch(`/api/astrology?q=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const data = (await r.json()) as LookupResp;
    if (!data.ok) throw new Error((data as any).error || "Lookup failed.");
    return { key: data.key, card: data.card };
  }

  // --- Placement lookup ---
  async function runLookup() {
    const query = q.trim();
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

  // --- Pair lookup ---
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

  // --- Mini chart lookup ---
  async function runMiniLookup() {
    setMiniLoading(true);
    setMiniErr(null);
    setMiniCards(null);
    resetSynthesis();

    try {
      const cleaned = miniInputs.map((x) => x.trim()).filter(Boolean);
      if (cleaned.length < 3 || cleaned.length > 6) {
        throw new Error("Mini chart needs 3–6 placements.");
      }
      const outs: { key: string; card: any }[] = [];
      for (const entry of cleaned) {
        // NOTE: Asc is not a doctrine body in current primitives.
        // If user includes Asc, this will error. We'll guide below.
        outs.push(await lookupOne(entry));
      }
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

  // Helpers to render doctrine card
  function renderDoctrineCard(card: any) {
    return (
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: "rgba(244,235,221,0.86)" }}>
        <div className="flex flex-wrap gap-2">
          <Pill>Element: {card.labels?.element}</Pill>
          <Pill>Modality: {card.labels?.modality}</Pill>
          <Pill>Key: {card.key}</Pill>
        </div>

        <div>
          <SectionTitle>Function (Planet)</SectionTitle>
          <div>{card.function?.core}</div>
        </div>

        <div>
          <SectionTitle>Style (Sign)</SectionTitle>
          <div>{card.style?.strategy}</div>
        </div>

        <div>
          <SectionTitle>Arena (House)</SectionTitle>
          <div>{card.arena?.domain}</div>
        </div>

        <div>
          <SectionTitle>Synthesis</SectionTitle>
          <div>{card.synthesis}</div>
        </div>

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
        style={{ borderColor: "rgba(244,235,221,0.14)", background: "rgba(244,235,221,0.06)" }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Pill>Mode: {sx.mode}</Pill>
          <Pill>Keys: {sx.usedKeys.join(", ")}</Pill>
          {sx.meta?.model && <Pill>Model: {sx.meta.model}</Pill>}
        </div>

        <div className="mt-4 space-y-3 text-sm leading-relaxed" style={{ color: "rgba(244,235,221,0.86)" }}>
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

  // IMPORTANT NOTE:
  // Your doctrine does NOT include Ascendant as a "body" yet.
  // So mini-chart defaults including "Asc" will fail lookup.
  // We'll keep the field but add a note.
  const ascNote =
    "Note: Ascendant isn’t in the doctrine bodies yet. For mini charts, use planets/nodes/chiron only (or we can add ASC as a special body).";

  return (
    <section className="space-y-4">
      {/* Mode selector */}
      <div
        className="rounded-2xl border p-4"
        style={{
          borderColor: "rgba(244,235,221,0.14)",
          background: "rgba(244,235,221,0.06)",
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setMode("placement");
                setResp(null);
                setPairCards(null);
                setMiniCards(null);
                resetSynthesis();
              }}
              className="rounded-full border px-4 py-2 text-sm font-semibold"
              style={{
                borderColor: "rgba(244,235,221,0.18)",
                background: mode === "placement" ? "rgba(244,235,221,0.82)" : "rgba(244,235,221,0.08)",
                color: mode === "placement" ? "rgba(15,26,18,0.92)" : "rgba(244,235,221,0.82)",
              }}
            >
              Single
            </button>

            <button
              onClick={() => {
                setMode("pair");
                setResp(null);
                setPairCards(null);
                setMiniCards(null);
                resetSynthesis();
              }}
              className="rounded-full border px-4 py-2 text-sm font-semibold"
              style={{
                borderColor: "rgba(244,235,221,0.18)",
                background: mode === "pair" ? "rgba(244,235,221,0.82)" : "rgba(244,235,221,0.08)",
                color: mode === "pair" ? "rgba(15,26,18,0.92)" : "rgba(244,235,221,0.82)",
              }}
            >
              Pair
            </button>

            <button
              onClick={() => {
                setMode("mini_chart");
                setResp(null);
                setPairCards(null);
                setMiniCards(null);
                resetSynthesis();
              }}
              className="rounded-full border px-4 py-2 text-sm font-semibold"
              style={{
                borderColor: "rgba(244,235,221,0.18)",
                background: mode === "mini_chart" ? "rgba(244,235,221,0.82)" : "rgba(244,235,221,0.08)",
                color: mode === "mini_chart" ? "rgba(15,26,18,0.92)" : "rgba(244,235,221,0.82)",
              }}
            >
              Mini chart
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-xs" style={{ color: "rgba(244,235,221,0.70)" }}>
              Lens
            </label>
            <select
              value={lens}
              onChange={(e) => setLens(e.target.value as any)}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: "rgba(244,235,221,0.16)",
                background: "rgba(15,26,18,0.55)",
                color: "rgba(244,235,221,0.92)",
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
          <label className="text-xs" style={{ color: "rgba(244,235,221,0.70)" }}>
            Optional question
          </label>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What’s the cleanest way to work with this pattern?"
            className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={{
              borderColor: "rgba(244,235,221,0.16)",
              background: "rgba(15,26,18,0.55)",
              color: "rgba(244,235,221,0.92)",
            }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setQ(ex);
                setResp(null);
                resetSynthesis();
              }}
              className="text-left"
              title="Use example"
            >
              <Pill>{ex}</Pill>
            </button>
          ))}
        </div>
      </div>

      {/* SINGLE MODE */}
      {mode === "placement" && (
        <>
          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: "rgba(244,235,221,0.14)",
              background: "rgba(244,235,221,0.06)",
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runLookup();
                }}
                placeholder="e.g. Mars in Virgo 6th house"
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                style={{
                  borderColor: "rgba(244,235,221,0.16)",
                  background: "rgba(15,26,18,0.55)",
                  color: "rgba(244,235,221,0.92)",
                }}
              />
              <button
                onClick={runLookup}
                disabled={loading}
                className="rounded-xl px-4 py-3 text-sm font-semibold transition"
                style={{
                  background: loading ? "rgba(244,235,221,0.18)" : "rgba(244,235,221,0.82)",
                  color: "rgba(15,26,18,0.92)",
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
          </div>

          {resp && resp.ok && (
            <CardShell>
              <h2 className="text-lg font-semibold">{resp.card.labels?.placement}</h2>
              <div className="mt-4">{renderDoctrineCard(resp.card)}</div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={() => runSynthesis([resp.key], "placement")}
                  disabled={sxLoading}
                  className="rounded-xl px-4 py-2 text-sm font-semibold transition"
                  style={{
                    background: sxLoading ? "rgba(244,235,221,0.18)" : "rgba(244,235,221,0.82)",
                    color: "rgba(15,26,18,0.92)",
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

      {/* PAIR MODE */}
      {mode === "pair" && (
        <CardShell>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Pair mode</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={pairA}
                onChange={(e) => setPairA(e.target.value)}
                placeholder="e.g. Venus Scorpio 7th house"
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                style={{
                  borderColor: "rgba(244,235,221,0.16)",
                  background: "rgba(15,26,18,0.55)",
                  color: "rgba(244,235,221,0.92)",
                }}
              />
              <input
                value={pairB}
                onChange={(e) => setPairB(e.target.value)}
                placeholder="e.g. Mars Virgo 6th house"
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                style={{
                  borderColor: "rgba(244,235,221,0.16)",
                  background: "rgba(15,26,18,0.55)",
                  color: "rgba(244,235,221,0.92)",
                }}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={runPairLookup}
                disabled={pairLoading}
                className="rounded-xl px-4 py-2 text-sm font-semibold transition"
                style={{
                  background: pairLoading ? "rgba(244,235,221,0.18)" : "rgba(244,235,221,0.82)",
                  color: "rgba(15,26,18,0.92)",
                  opacity: pairLoading ? 0.75 : 1,
                }}
              >
                {pairLoading ? "Looking up…" : "Lookup pair"}
              </button>

              <button
                onClick={() => {
                  if (!pairCards) return;
                  runSynthesis(pairCards.map((x) => x.key), "pair");
                }}
                disabled={sxLoading || !pairCards}
                className="rounded-xl px-4 py-2 text-sm font-semibold transition"
                style={{
                  background: sxLoading || !pairCards ? "rgba(244,235,221,0.18)" : "rgba(244,235,221,0.82)",
                  color: "rgba(15,26,18,0.92)",
                  opacity: sxLoading || !pairCards ? 0.75 : 1,
                }}
              >
                {sxLoading ? "Synthesizing…" : "Synthesize pair (LLM)"}
              </button>
            </div>

            {pairErr && (
              <p className="text-sm" style={{ color: "rgba(255,180,180,0.95)" }}>
                {pairErr}
              </p>
            )}

            {pairCards && (
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                {pairCards.map((x) => (
                  <div key={x.key}>
                    <h3 className="text-base font-semibold">{x.card.labels?.placement}</h3>
                    <div className="mt-3">{renderDoctrineCard(x.card)}</div>
                  </div>
                ))}
              </div>
            )}

            {renderSynthesis()}
          </div>
        </CardShell>
      )}

      {/* MINI CHART MODE */}
      {mode === "mini_chart" && (
        <CardShell>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Mini chart mode</h2>
            <p className="text-sm" style={{ color: "rgba(244,235,221,0.70)" }}>
              Add 3–6 placements. {ascNote}
            </p>

            <div className="space-y-2">
              {miniInputs.map((val, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={val}
                    onChange={(e) => {
                      const next = [...miniInputs];
                      next[idx] = e.target.value;
                      setMiniInputs(next);
                    }}
                    placeholder="e.g. Sun Capricorn 10th house"
                    className="w-full rounded-xl border px-4 py-2 text-sm outline-none"
                    style={{
                      borderColor: "rgba(244,235,221,0.16)",
                      background: "rgba(15,26,18,0.55)",
                      color: "rgba(244,235,221,0.92)",
                    }}
                  />
                  <button
                    onClick={() => {
                      const next = miniInputs.filter((_, i) => i !== idx);
                      setMiniInputs(next.length ? next : [""]);
                      resetSynthesis();
                    }}
                    className="rounded-xl border px-3 py-2 text-sm font-semibold"
                    style={{
                      borderColor: "rgba(244,235,221,0.16)",
                      background: "rgba(244,235,221,0.06)",
                      color: "rgba(244,235,221,0.82)",
                    }}
                    title="Remove"
                  >
                    –
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (miniInputs.length >= 6) return;
                  setMiniInputs([...miniInputs, ""]);
                  resetSynthesis();
                }}
                className="rounded-xl border px-3 py-2 text-sm font-semibold"
                style={{
                  borderColor: "rgba(244,235,221,0.16)",
                  background: "rgba(244,235,221,0.06)",
                  color: "rgba(244,235,221,0.82)",
                }}
              >
                + Add placement
              </button>

              <button
                onClick={runMiniLookup}
                disabled={miniLoading}
                className="rounded-xl px-4 py-2 text-sm font-semibold transition"
                style={{
                  background: miniLoading ? "rgba(244,235,221,0.18)" : "rgba(244,235,221,0.82)",
                  color: "rgba(15,26,18,0.92)",
                  opacity: miniLoading ? 0.75 : 1,
                }}
              >
                {miniLoading ? "Looking up…" : "Lookup mini chart"}
              </button>

              <button
                onClick={() => {
                  if (!miniCards) return;
                  runSynthesis(miniCards.map((x) => x.key), "mini_chart");
                }}
                disabled={sxLoading || !miniCards}
                className="rounded-xl px-4 py-2 text-sm font-semibold transition"
                style={{
                  background: sxLoading || !miniCards ? "rgba(244,235,221,0.18)" : "rgba(244,235,221,0.82)",
                  color: "rgba(15,26,18,0.92)",
                  opacity: sxLoading || !miniCards ? 0.75 : 1,
                }}
              >
                {sxLoading ? "Synthesizing…" : "Synthesize mini chart (LLM)"}
              </button>
            </div>

            {miniErr && (
              <p className="text-sm" style={{ color: "rgba(255,180,180,0.95)" }}>
                {miniErr}
              </p>
            )}

            {miniCards && (
              <div className="mt-4 space-y-6">
                {miniCards.map((x) => (
                  <div key={x.key}>
                    <h3 className="text-base font-semibold">{x.card.labels?.placement}</h3>
                    <div className="mt-3">{renderDoctrineCard(x.card)}</div>
                  </div>
                ))}
              </div>
            )}

            {renderSynthesis()}
          </div>
        </CardShell>
      )}
    </section>
  );
}
