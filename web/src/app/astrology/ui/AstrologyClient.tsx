// src/app/astrology/ui/AstrologyClient.tsx
"use client";

import { useMemo, useState } from "react";

type ApiOk = { ok: true; key: string; card: any };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

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

export default function AstrologyClient() {
  const [q, setQ] = useState("Mars in Virgo 6th house");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<ApiResp | null>(null);

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

  async function run() {
    const query = q.trim();
    if (!query) return;

    setLoading(true);
    setResp(null);

    try {
      const r = await fetch(`/api/astrology?q=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: { "Accept": "application/json" },
      });
      const data = (await r.json()) as ApiResp;
      setResp(data);
    } catch (e: any) {
      setResp({ ok: false, error: e?.message || "Request failed." });
    } finally {
      setLoading(false);
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
              if (e.key === "Enter") run();
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
            onClick={run}
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

      {/* Output */}
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
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(244,235,221,0.62)" }}>
                  Function (Planet)
                </div>
                <div>{card.function?.core}</div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(244,235,221,0.62)" }}>
                  Style (Sign)
                </div>
                <div>{card.style?.strategy}</div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(244,235,221,0.62)" }}>
                  Arena (House)
                </div>
                <div>{card.arena?.domain}</div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(244,235,221,0.62)" }}>
                  Synthesis
                </div>
                <div>{card.synthesis}</div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                <div className="sm:w-1/2">
                  <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(244,235,221,0.62)" }}>
                    Strengths
                  </div>
                  <ul className="mt-1 list-disc pl-5">
                    {(card.strengths ?? []).map((x: string) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div className="sm:w-1/2">
                  <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(244,235,221,0.62)" }}>
                    Shadows
                  </div>
                  <ul className="mt-1 list-disc pl-5">
                    {(card.shadows ?? []).map((x: string) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(244,235,221,0.62)" }}>
                  Directives
                </div>
                <ul className="mt-1 list-disc pl-5">
                  {(card.directives ?? []).map((x: string) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
