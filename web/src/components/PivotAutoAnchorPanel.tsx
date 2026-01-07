// src/components/PivotAutoAnchorPanel.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import PivotPrecheckPanel from "@/components/PivotPrecheckPanel";

type Market = "stock" | "crypto";
type Timeframe = "1d" | "4h" | "1h";

type ScoreState = {
  legBirth: 0 | 1 | 2 | 3;
  structure: 0 | 1 | 2;
  followThrough: 0 | 1 | 2;
  timeFit: 0 | 1 | 2;
  sanity: 0 | 1;
};

type ScoredPivot = {
  pivot: { idx: number; t: number; price: number; type: "swingLow" | "swingHigh" };
  score01: number;
  total10: number;
  state: ScoreState;
  reasons: string[];
  diagnostics: { moveAwayPct: number; structureOk: boolean; timeHits: number };
};

type ApiResp =
  | {
      ok: true;
      market: Market;
      tf: Timeframe;
      symbol: string;
      best: ScoredPivot;
      top: ScoredPivot[];
      asOf: string;
      nBars: number;
    }
  | { ok: false; error: string };

function fmtDate(ms: number) {
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export default function PivotAutoAnchorPanel(props: {
  market: Market;
  symbol: string;
  tf: Timeframe;
  lookbackDays?: number;
  onPickPivot?: (p: { t: number; price: number; type: "swingLow" | "swingHigh" }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResp | null>(null);
  const [picked, setPicked] = useState<ScoredPivot | null>(null);

  const query = useMemo(() => {
    const qs = new URLSearchParams({
      market: props.market,
      symbol: props.symbol,
      tf: props.tf,
      lookbackDays: String(props.lookbackDays ?? 365),
    });
    return `/api/pivot/auto?${qs.toString()}`;
  }, [props.market, props.symbol, props.tf, props.lookbackDays]);

  async function runScan() {
    if (!props.symbol.trim()) return;
    setLoading(true);
    setData(null);
    setPicked(null);

    try {
      const r = await fetch(query, { cache: "no-store" });
      const j = (await r.json()) as ApiResp;
      setData(j);
      if (j.ok) setPicked(j.best);
    } catch (e: any) {
      setData({ ok: false, error: e?.message ?? "Scan failed" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!props.symbol.trim()) return;
      setLoading(true);
      setData(null);
      setPicked(null);

      try {
        const r = await fetch(query, { cache: "no-store" });
        const j = (await r.json()) as ApiResp;
        if (cancelled) return;
        setData(j);
        if (j.ok) setPicked(j.best);
      } catch (e: any) {
        if (!cancelled) setData({ ok: false, error: e?.message ?? "Scan failed" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query, props.symbol]);

  const best = data?.ok ? (picked ?? data.best) : null;

  return (
    <section style={wrap}>
      <div style={topRow}>
        <div>
          <div style={kicker}>Auto Pivot Finder</div>
          <div style={headline}>
            {props.market.toUpperCase()} • {props.symbol} • {props.tf}
          </div>
          <div style={sub}>
            Scores swing pivots for leg birth, structure, follow-through, and time symmetry — then proposes the best
            anchor date/price.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={pill}>
            {loading ? "Scanning…" : data?.ok ? `${data.nBars} bars analyzed` : "No data"}
          </div>

          <button type="button" onClick={runScan} style={btn} disabled={loading}>
            Re-run scan
          </button>
        </div>
      </div>

      {!data ? <div style={skeleton}>Waiting for symbol…</div> : null}

      {data && !data.ok ? (
        <div style={errorBox}>
          <div style={{ fontWeight: 900, marginBottom: 4 }}>Pivot scan failed</div>
          <div style={{ color: "rgba(255,255,255,0.75)" }}>{data.error}</div>
        </div>
      ) : null}

      {data && data.ok && best ? (
        <div style={grid}>
          {/* LEFT */}
          <div style={leftCard}>
            <div style={cardTitle}>Best Pivot (auto)</div>

            <div style={bigRow}>
              <div style={bigDate}>{fmtDate(best.pivot.t)}</div>

              <div style={bigMeta}>
                <div style={bigPrice}>${best.pivot.price.toFixed(2)}</div>
                <div style={smallDim}>
                  {best.pivot.type === "swingLow" ? "Swing Low" : "Swing High"} • Score {best.total10}/10
                </div>
              </div>

              <button
                type="button"
                onClick={() => props.onPickPivot?.({ t: best.pivot.t, price: best.pivot.price, type: best.pivot.type })}
                style={btnPrimary}
              >
                Use this pivot
              </button>
            </div>

            <div style={miniGrid}>
              <MiniStat label="Move-away" value={`${(best.diagnostics.moveAwayPct * 100).toFixed(1)}%`} />
              <MiniStat label="Structure" value={best.diagnostics.structureOk ? "Clean" : "Mixed"} />
              <MiniStat label="Time hits" value={String(best.diagnostics.timeHits)} />
            </div>

            {best.reasons.length > 0 ? (
              <div style={notes}>
                <div style={notesTitle}>Notes</div>
                <ul style={notesList}>
                  {best.reasons.slice(0, 6).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div style={{ marginTop: 10 }}>
              <div style={cardTitle}>Top candidates</div>

              <div style={candList}>
                {data.top.map((p, i) => {
                  const active = best && p.pivot.t === best.pivot.t && p.pivot.type === best.pivot.type;
                  return (
                    <button
                      key={`${p.pivot.idx}:${p.pivot.type}:${i}`}
                      type="button"
                      onClick={() => setPicked(p)}
                      style={{ ...candBtn, ...(active ? candBtnActive : null) }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: 12 }}>{fmtDate(p.pivot.t)}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
                            {p.pivot.type === "swingLow" ? "Low" : "High"} • ${p.pivot.price.toFixed(2)}
                          </div>
                        </div>
                        <div style={{ fontWeight: 900, fontSize: 12 }}>{p.total10}/10</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={rightCard}>
            <PivotPrecheckPanel initial={best.state} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MiniStat(props: { label: string; value: string }) {
  return (
    <div style={miniStat}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 900 }}>{props.label}</div>
      <div style={{ fontSize: 13, fontWeight: 900 }}>{props.value}</div>
    </div>
  );
}

/* styles */
const wrap: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 20,
  border: "1px solid rgba(58,69,80,0.9)",
  background: "#243039",
  color: "#EDE3CC",
  boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
};

const topRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  flexWrap: "wrap",
  marginBottom: 12,
};

const kicker: React.CSSProperties = { fontSize: 11, fontWeight: 900, letterSpacing: 0.8, opacity: 0.8 };
const headline: React.CSSProperties = { fontSize: 14, fontWeight: 900, marginTop: 3 };
const sub: React.CSSProperties = { fontSize: 12, opacity: 0.82, marginTop: 4, maxWidth: 820, lineHeight: 1.35 };

const pill: React.CSSProperties = {
  fontSize: 12,
  padding: "7px 10px",
  borderRadius: 999,
  border: "1px solid rgba(58,69,80,0.9)",
  background: "rgba(0,0,0,0.18)",
};

const btn: React.CSSProperties = {
  fontSize: 12,
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #3a4550",
  background: "transparent",
  color: "#EDE3CC",
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  background: "rgba(237,227,204,0.12)",
  border: "1px solid rgba(237,227,204,0.22)",
  fontWeight: 900,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.1fr 1fr",
  gap: 14,
};

const leftCard: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(58,69,80,0.9)",
  background: "rgba(0,0,0,0.16)",
  padding: 12,
};

const rightCard: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(58,69,80,0.9)",
  background: "rgba(0,0,0,0.12)",
  padding: 10,
};

const cardTitle: React.CSSProperties = { fontSize: 12, fontWeight: 900, marginBottom: 8, opacity: 0.9 };

const bigRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  padding: 10,
  borderRadius: 16,
  border: "1px solid rgba(58,69,80,0.9)",
  background: "rgba(255,255,255,0.04)",
};

const bigDate: React.CSSProperties = { fontSize: 13, fontWeight: 900 };
const bigMeta: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 2, minWidth: 180 };
const bigPrice: React.CSSProperties = { fontSize: 14, fontWeight: 900 };
const smallDim: React.CSSProperties = { fontSize: 11, opacity: 0.8 };

const miniGrid: React.CSSProperties = {
  marginTop: 10,
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
};

const miniStat: React.CSSProperties = {
  padding: 10,
  borderRadius: 16,
  border: "1px solid rgba(58,69,80,0.9)",
  background: "rgba(0,0,0,0.14)",
};

const notes: React.CSSProperties = {
  marginTop: 10,
  padding: 10,
  borderRadius: 16,
  border: "1px solid rgba(58,69,80,0.9)",
  background: "rgba(0,0,0,0.14)",
};

const notesTitle: React.CSSProperties = { fontSize: 11, fontWeight: 900, marginBottom: 6, opacity: 0.9 };
const notesList: React.CSSProperties = { margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.45, opacity: 0.88 };

const candList: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 };

const candBtn: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: 10,
  borderRadius: 16,
  border: "1px solid rgba(58,69,80,0.9)",
  background: "rgba(0,0,0,0.14)",
  color: "#EDE3CC",
  cursor: "pointer",
};

const candBtnActive: React.CSSProperties = {
  background: "rgba(237,227,204,0.10)",
  border: "1px solid rgba(237,227,204,0.22)",
};

const skeleton: React.CSSProperties = {
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgba(58,69,80,0.9)",
  background: "rgba(0,0,0,0.14)",
  opacity: 0.9,
  fontSize: 12,
};

const errorBox: React.CSSProperties = {
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgba(255, 80, 80, 0.35)",
  background: "rgba(255, 80, 80, 0.12)",
  color: "#FFB0B0",
};
