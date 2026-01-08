// src/app/astrology/ui/AstrologyClient.tsx
"use client";

import { useMemo, useState } from "react";

type LookupOk = { ok: true; key: string; card: any };
type LookupErr = { ok: false; error: string };
type LookupResp = LookupOk | LookupErr;

type SxOk = { ok: true; version: "1.0"; usedKeys: string[]; output: any; grounding?: any; meta?: any };
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

export default function AstrologyClient() {
  const [q, setQ] = useState("Mars in Virgo 6th house");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<LookupResp | null>(null);

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

  async function runLookup() {
    const query = q.trim();
    if (!query) return;

    setLoading(true);
    setResp(null);
    setSx(null); // clear synthesis when new lookup runs

    try {
      const r = await fetch(`/api/astrology?q=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const data = (await r.json()) as LookupResp;
      setResp(data);
    } catch (e: any) {
      setResp({ ok: false, error: e?.message || "Lookup failed." });
    } finally {
      setLoading(false);
    }
  }

  async function runSynthesis() {
    if (!resp || !resp.ok) return;

    setSxLoading(true);
    setSx(null);

    try {
      const r = await fetch(`/api/astrology/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          version: "1.0",
          mode: "placement",
          keys: [resp.key],
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

  const card = resp && resp.ok ? resp.card : null;

  return (
    <section className="space-y-4">
      {/* Input */}
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

        <div className="mt-3 flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setQ(ex);
                setResp(null);
                setSx(null);
              }}
              className="text-left"
              title="Use example"
            >
              <Pill>{ex}</Pill>
            </button>
          ))}
        </div>

        {resp && !resp.ok && (
          <p className="mt-3 text-sm" style={{ color: "rgba(255,180,180,0.95)" }}>
            {resp.error}
          </p>
        )}
      </div>

      {/* Doctrine Output */}
      {card && (
        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: "rgba(244,235,221,0.14)",
            background: "rgba(244,235,221,0.08)",
          }}
        >
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">{card.labels?.placement ?? "Placement"}</h2>

            <div className="flex flex-wrap gap-2">
              <Pill>Element: {card.labels?.element}</Pill>
              <Pill>Modality: {card.labels?.modality}</Pill>
              <Pill>Key: {card.key}</Pill>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed" style={{ color: "rgba(244,235,221,0.86)" }}>
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

              <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
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

            {/* LLM Layer Controls */}
            <div className="mt-6 rounded-xl border p-4" style={{ borderColor: "rgba(244,235,221,0.14)", background: "rgba(15,26,18,0.35)" }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

                <button
                  onClick={runSynthesis}
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

              <div className="mt-3">
                <label className="text-xs" style={{ color: "rgba(244,235,221,0.70)" }}>
                  Optional question
                </label>
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. How does this show up when I’m under stress?"
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{
                    borderColor: "rgba(244,235,221,0.16)",
                    background: "rgba(15,26,18,0.55)",
                    color: "rgba(244,235,221,0.92)",
                  }}
                />
              </div>

              {sx && !sx.ok && (
                <p className="mt-3 text-sm" style={{ color: "rgba(255,180,180,0.95)" }}>
                  {sx.error}
                </p>
              )}
            </div>

            {/* LLM Output */}
            {sx && sx.ok && (
              <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "rgba(244,235,221,0.14)", background: "rgba(244,235,221,0.06)" }}>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill>LLM keys: {sx.usedKeys.join(", ")}</Pill>
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
            )}
          </div>
        </div>
      )}
    </section>
  );
}
