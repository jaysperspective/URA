// src/components/PivotAutoAnchorPanel.tsx
"use client";

import React, { useMemo, useState } from "react";
import PivotPrecheckPanel, { type PivotPrecheckResult } from "@/components/PivotPrecheckPanel";

type Timeframe = "1d" | "4h" | "1h";
type PivotType = "SWING_LOW" | "SWING_HIGH";
type AnchorBasis = "low" | "high" | "close" | "open";

type Candle = { t: string; o: number; h: number; l: number; c: number; v?: number };

type Candidate = {
  idx: number;
  pivotISO: string;
  pivotType: PivotType;
  anchorSource: "low" | "high"; // server may still send only these
  anchorPrice: number;
  score: number;
  breakdown: {
    legBirth: number;
    structure: number;
    followThrough: number;
    timeFit: number;
    sanity: number;
  };
  notes: string[];
};

type ScanOk = {
  ok: true;
  kind: "crypto" | "stock";
  provider: "coinbase" | "polygon";
  symbol: string;
  timeframe: Timeframe;
  granularity: number;
  requestedBars: number;
  returnedBars: number;
  startISO: string;
  endISO: string;
  candles: Candle[];
  candidates: Candidate[];
  recommended: Candidate | null;
  note?: string;
};

type ScanRes = ScanOk | { ok: false; error: string };

type ApplyPayload = {
  pivotISO: string;
  pivotLocalInput: string; // yyyy-mm-ddThh:mm for datetime-local
  anchorSource: AnchorBasis; // now supports open/close
  anchorPrice: number; // raw; parent will round to tick
  score: number;
  pivotType: PivotType;
};

type Props = {
  kind: "crypto" | "stock";
  symbol: string;
  defaultTimeframe?: Timeframe;
  tickSize?: number; // for display rounding
  onApply?: (p: ApplyPayload) => void;
};

export default function PivotAutoAnchorPanel({
  kind,
  symbol,
  defaultTimeframe = "1d",
  tickSize = 0.01,
  onApply,
}: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultTimeframe);
  const [lookbackBars, setLookbackBars] = useState<number>(180);
  const [anchorBasis, setAnchorBasis] = useState<AnchorBasis>("close");

  const [res, setRes] = useState<ScanRes | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedISO, setSelectedISO] = useState<string | null>(null);
  const [precheck, setPrecheck] = useState<PivotPrecheckResult | null>(null);

  async function runScan() {
    if (!symbol.trim()) {
      setRes({ ok: false, error: "Symbol is required." });
      return;
    }

    setLoading(true);
    setRes(null);

    try {
      const r = await fetch("/api/pivot-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.trim(),
          kind,
          timeframe,
          lookbackBars,
        }),
      });

      const json = (await r.json()) as ScanRes;
      setRes(json);

      if (json.ok && json.recommended) {
        setSelectedISO(json.recommended.pivotISO);
      }
    } catch (e: any) {
      setRes({ ok: false, error: e?.message || "Scan failed" });
    } finally {
      setLoading(false);
    }
  }

  const scanMeta = useMemo(() => {
    if (!res?.ok) return null;
    return `${res.kind.toUpperCase()} • ${res.symbol} • ${res.timeframe} (returned ${res.returnedBars}/${res.requestedBars})`;
  }, [res]);

  const errorText = res && !res.ok ? res.error : null;

  const candidates = res?.ok ? res.candidates : [];
  const selected = useMemo(() => {
    if (!res?.ok) return null;
    if (!selectedISO) return res.recommended;
    return res.candidates.find((c) => c.pivotISO === selectedISO) ?? res.recommended;
  }, [res, selectedISO]);

  const selectedCandle = useMemo(() => {
    if (!res?.ok || !selected) return null;
    const idx = selected.idx;
    const c = res.candles[idx];
    return c ?? null;
  }, [res, selected]);

  function anchorPriceFromBasis(c: Candidate, candle: Candle | null) {
    if (!candle) return c.anchorPrice; // fallback
    if (anchorBasis === "low") return candle.l;
    if (anchorBasis === "high") return candle.h;
    if (anchorBasis === "open") return candle.o;
    return candle.c; // close default
  }

  function apply(c: Candidate) {
    const pivotLocalInput = isoToLocalInput(c.pivotISO);
    const candle = selectedCandle;
    const anchorPrice = anchorPriceFromBasis(c, candle);

    onApply?.({
      pivotISO: c.pivotISO,
      pivotLocalInput,
      anchorSource: anchorBasis,
      anchorPrice,
      score: c.score,
      pivotType: c.pivotType,
    });
  }

  const canApply = useMemo(() => {
    if (!selected) return false;
    if (!precheck) return true; // allow if user hasn't scored yet
    return precheck.recommendedAction !== "REJECT";
  }, [precheck, selected]);

  return (
    <div style={panel}>
      <div style={topRow}>
        <div>
          <div style={title}>Auto Pivot Finder</div>
          <div style={subtitle}>
            Uses swing structure for pivot timing, then lets you choose the anchor price basis (Close/Open/High/Low).
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div style={pillMuted}>{res?.ok ? "Data loaded" : "No data"}</div>
          <button type="button" onClick={runScan} style={btn} disabled={loading}>
            {loading ? "Scanning…" : "Run scan"}
          </button>
        </div>
      </div>

      <div style={controlsRow}>
        <div style={controlBlock}>
          <div style={label}>Timeframe</div>
          <Segmented
            value={timeframe}
            options={[
              { value: "1d", label: "1d" },
              { value: "4h", label: "4h" },
              { value: "1h", label: "1h" },
            ]}
            onChange={(v) => setTimeframe(v as Timeframe)}
          />
        </div>

        <div style={controlBlock}>
          <div style={label}>Lookback (bars)</div>
          <input
            value={String(lookbackBars)}
            onChange={(e) => setLookbackBars(Number(e.target.value || 0))}
            inputMode="numeric"
            style={input}
          />
          <div style={hint}>Capped at 300 (Coinbase limit).</div>
        </div>

        <div style={controlBlock}>
          <div style={label}>Anchor basis (price)</div>
          <Segmented
            value={anchorBasis}
            options={[
              { value: "close", label: "Close" },
              { value: "open", label: "Open" },
              { value: "high", label: "High" },
              { value: "low", label: "Low" },
            ]}
            onChange={(v) => setAnchorBasis(v as AnchorBasis)}
          />
          <div style={hint}>Close is usually the cleanest “consensus” anchor.</div>
        </div>

        <div style={controlBlockWide}>
          <div style={label}>Instrument</div>
          <div style={instrumentLine}>
            <strong style={{ opacity: 0.95 }}>{kind.toUpperCase()}</strong>
            <span style={{ opacity: 0.75 }}>•</span>
            <strong style={{ opacity: 0.95 }}>{symbol || "—"}</strong>
          </div>

          {scanMeta ? <div style={hint}>{scanMeta}</div> : <div style={hint}>Click Run scan when you’re ready.</div>}
        </div>
      </div>

      {errorText ? (
        <div style={errorBox}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>Pivot scan failed</div>
          <div style={{ opacity: 0.9 }}>{errorText}</div>
        </div>
      ) : null}

      {res?.ok ? (
        <div style={bodyGrid}>
          {/* Left */}
          <div style={stackCol}>
            <div style={miniCard}>
              <div style={miniHeader}>Scan window</div>
              <div style={miniLine}>
                <span style={{ opacity: 0.75 }}>Start</span>
                <span style={{ fontWeight: 700 }}>{res.startISO.slice(0, 19).replace("T", " ")}</span>
              </div>
              <div style={miniLine}>
                <span style={{ opacity: 0.75 }}>End</span>
                <span style={{ fontWeight: 700 }}>{res.endISO.slice(0, 19).replace("T", " ")}</span>
              </div>
              <div style={miniLine}>
                <span style={{ opacity: 0.75 }}>Bars</span>
                <span style={{ fontWeight: 700 }}>
                  {res.returnedBars} / {res.requestedBars}
                </span>
              </div>
              {res.note ? <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>{res.note}</div> : null}
            </div>

            <div style={miniCard}>
              <div style={miniHeader}>Ranked pivot candidates</div>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
                Pick one — then Apply to push it into Market Inputs.
              </div>

              {candidates.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {candidates.map((c, idx) => {
                    const active = c.pivotISO === selectedISO;
                    const dt = isoToLocalLabel(c.pivotISO);

                    const candle = res.candles[c.idx];
                    const anchorPx = roundToTick(
                      candle ? (anchorBasis === "close" ? candle.c : anchorBasis === "open" ? candle.o : anchorBasis === "high" ? candle.h : candle.l) : c.anchorPrice,
                      tickSize
                    );

                    return (
                      <button
                        key={c.pivotISO}
                        type="button"
                        onClick={() => setSelectedISO(c.pivotISO)}
                        style={{ ...candRow, ...(active ? candRowActive : null) }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 900, fontSize: 12 }}>
                            #{idx + 1} • {c.pivotType === "SWING_LOW" ? "Swing Low" : "Swing High"}
                          </div>
                          <div style={{ fontWeight: 900, fontSize: 12 }}>Score {c.score}/10</div>
                        </div>

                        <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, opacity: 0.85 }}>
                          <div>{dt}</div>
                          <div>
                            Anchor {anchorBasis.toUpperCase()}: <strong>{formatNum(anchorPx)}</strong>
                          </div>
                        </div>

                        <div style={{ marginTop: 6, fontSize: 11, opacity: 0.7 }}>
                          Leg {c.breakdown.legBirth} • Struct {c.breakdown.structure} • Follow {c.breakdown.followThrough} • Time {c.breakdown.timeFit} • Sanity {c.breakdown.sanity}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12, opacity: 0.75 }}>No candidates found in this window. Try a larger lookback.</div>
              )}
            </div>
          </div>

          {/* Right */}
          <div style={stackCol}>
            <div style={miniCard}>
              <div style={miniHeader}>Selected pivot</div>

              {selected ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>
                      {selected.pivotType === "SWING_LOW" ? "Swing Low" : "Swing High"} • Score {selected.score}/10
                    </div>
                    <div style={{ opacity: 0.85 }}>{isoToLocalLabel(selected.pivotISO)}</div>
                  </div>

                  {selectedCandle ? (
                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85, lineHeight: 1.4 }}>
                      Candle OHLC:{" "}
                      <strong>
                        O {formatNum(selectedCandle.o)} • H {formatNum(selectedCandle.h)} • L {formatNum(selectedCandle.l)} • C {formatNum(selectedCandle.c)}
                      </strong>
                    </div>
                  ) : null}

                  <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, opacity: 0.9 }}>
                    <div>
                      Anchor basis: <strong>{anchorBasis.toUpperCase()}</strong>
                    </div>
                    <div>
                      Anchor price:{" "}
                      <strong>
                        {formatNum(roundToTick(anchorPriceFromBasis(selected, selectedCandle), tickSize))}
                      </strong>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <button type="button" style={{ ...btn, ...(canApply ? null : btnDisabled) }} onClick={() => apply(selected)} disabled={!canApply}>
                      Apply to Market Inputs
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, opacity: 0.75 }}>Run scan to generate a recommendation.</div>
              )}
            </div>

            <div style={miniCard}>
              <div style={miniHeader}>Pre-check (manual)</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
                This does not auto-apply. Use it to sanity-check the pivot you chose.
              </div>
              <PivotPrecheckPanel onChange={(r) => setPrecheck(r)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={segWrap}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} style={{ ...segBtn, ...(active ? segBtnActive : null) }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- helpers ---------- */

function isoToLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isoToLocalLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function roundToTick(x: number, tick: number) {
  const t = Number(tick) || 0.01;
  return Math.round(x / t) * t;
}

function formatNum(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return String(n);
  return x.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

/* ---------- styles ---------- */

const panel: React.CSSProperties = {
  marginTop: 14,
  background: "#243039",
  borderRadius: 20,
  border: "1px solid rgba(58,69,80,0.9)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
  overflow: "hidden",
};

const topRow: React.CSSProperties = {
  padding: "14px 14px 10px",
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap",
  alignItems: "flex-start",
  borderBottom: "1px solid rgba(58,69,80,0.6)",
};

const title: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 0.3,
  color: "#EDE3CC",
};

const subtitle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  lineHeight: 1.4,
  opacity: 0.78,
  color: "#EDE3CC",
  maxWidth: 820,
};

const controlsRow: React.CSSProperties = {
  padding: 14,
  display: "grid",
  gridTemplateColumns: "auto auto auto 1fr",
  gap: 14,
  alignItems: "start",
};

const controlBlock: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  minWidth: 180,
};

const controlBlockWide: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const label: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.8,
  color: "#EDE3CC",
};

const hint: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  color: "#EDE3CC",
};

const instrumentLine: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  fontSize: 13,
  color: "#EDE3CC",
};

const input: React.CSSProperties = {
  background: "#1B1F24",
  border: "1px solid #3a4550",
  borderRadius: 8,
  padding: "8px 10px",
  color: "#EDE3CC",
  fontSize: 13,
  outline: "none",
  width: 120,
};

const btn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #3a4550",
  borderRadius: 999,
  padding: "7px 12px",
  color: "#EDE3CC",
  fontSize: 12,
  cursor: "pointer",
};

const btnDisabled: React.CSSProperties = {
  opacity: 0.45,
  cursor: "not-allowed",
};

const pillMuted: React.CSSProperties = {
  border: "1px solid rgba(58,69,80,0.9)",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  opacity: 0.85,
  color: "#EDE3CC",
  background: "rgba(0,0,0,0.14)",
};

const segWrap: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(58,69,80,0.9)",
  borderRadius: 999,
  overflow: "hidden",
};

const segBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#EDE3CC",
  padding: "8px 12px",
  fontSize: 12,
  cursor: "pointer",
  opacity: 0.8,
};

const segBtnActive: React.CSSProperties = {
  background: "rgba(237,227,204,0.12)",
  opacity: 1,
};

const errorBox: React.CSSProperties = {
  margin: "0 14px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255, 80, 80, 0.35)",
  background: "rgba(255, 80, 80, 0.12)",
  color: "#FFB0B0",
  padding: 12,
};

const bodyGrid: React.CSSProperties = {
  padding: 14,
  display: "grid",
  gridTemplateColumns: "1.05fr 1fr",
  gap: 14,
  borderTop: "1px solid rgba(58,69,80,0.6)",
};

const stackCol: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const miniCard: React.CSSProperties = {
  background: "rgba(0,0,0,0.18)",
  border: "1px solid rgba(58,69,80,0.6)",
  borderRadius: 14,
  padding: 12,
};

const miniHeader: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 0.2,
  opacity: 0.9,
  marginBottom: 10,
  color: "#EDE3CC",
};

const miniLine: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  fontSize: 12,
  color: "#EDE3CC",
  marginTop: 6,
};

const candRow: React.CSSProperties = {
  textAlign: "left",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(58,69,80,0.6)",
  borderRadius: 12,
  padding: 10,
  color: "#EDE3CC",
  cursor: "pointer",
};

const candRowActive: React.CSSProperties = {
  background: "rgba(237,227,204,0.08)",
  border: "1px solid rgba(237,227,204,0.22)",
};
