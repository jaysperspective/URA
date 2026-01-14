// src/components/gann/ChartClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import PivotPrecheckPanel, { type PivotPrecheckResult } from "@/components/PivotPrecheckPanel";

type Mode = "market" | "personal";
type MarketKind = "stock" | "crypto";
type Timeframe = "1d" | "4h" | "1h";
type AnchorSource = "close" | "open" | "high" | "low";

type AutoPivotResp =
  | {
      ok: true;
      kind: MarketKind;
      provider: "polygon" | "coinbase";
      symbol: string;
      timeframe: Timeframe;
      lookbackUsed: number;
      timezoneUsed: string;
      last: { t: number; ymd: string; o: number; h: number; l: number; c: number; v: number };
      pivot: { t: number; ymd: string; o: number; h: number; l: number; c: number; idx: number } | null;
      note?: string;
    }
  | { ok: false; error: string };

type ScanRow = {
  symbol: string;
  kind: MarketKind;
  provider: "polygon" | "coinbase";
  pivotISO: string;
  timeDeg: number;
  priceDeg: number;
  anchorSource: AnchorSource;
  anchor: number;
  price: number;
  asOfISO: string;
  oppositionDist: number;
  gapSignedAbs: number;
};

type ScanResp =
  | {
      ok: true;
      timeDeg: number;
      tolDeg: number;
      matches: ScanRow[];
      closest: ScanRow[];
      errors: Array<{ ok: false; symbol: string; error: string }>;
    }
  | { ok: false; error: string };

function isCryptoSymbol(symbolRaw: string) {
  return symbolRaw.toUpperCase().trim().includes("-"); // e.g. BTC-USD
}

function formatNum(x: any, max = 4) {
  const n = Number(x);
  if (!Number.isFinite(n)) return String(x ?? "");
  return n.toLocaleString(undefined, { maximumFractionDigits: max });
}

function parseSymbolsText(s: string) {
  return String(s ?? "")
    .replace(/\n/g, " ")
    .split(/[, ]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function toDatetimeLocal(ms: number) {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export default function ChartClient() {
  // --- core mode ---
  const [mode, setMode] = useState<Mode>("market");

  // --- market inputs ---
  const [marketKind, setMarketKind] = useState<MarketKind>("stock");
  const [symbol, setSymbol] = useState("LUNR");
  const [tickSize, setTickSize] = useState(0.01);

  // pivot + anchor inputs
  const [pivotDateTime, setPivotDateTime] = useState<string>(() => toDatetimeLocal(Date.now() - 10 * 86400 * 1000));
  const [pivotAnchorMode, setPivotAnchorMode] = useState<AnchorSource>("close");
  const [anchorPrice, setAnchorPrice] = useState<number>(10);

  // cycle
  const [marketCycleDays, setMarketCycleDays] = useState<number>(90);

  // --- pivot auto finder ---
  const [autoTf, setAutoTf] = useState<Timeframe>("1d");
  const [autoLookback, setAutoLookback] = useState<string>("180");
  const [autoAnchorBasis, setAutoAnchorBasis] = useState<AnchorSource>("close");
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoErr, setAutoErr] = useState<string | null>(null);
  const [autoData, setAutoData] = useState<AutoPivotResp | null>(null);

  // --- precheck verdict ---
  const [precheck, setPrecheck] = useState<PivotPrecheckResult | null>(null);

  // --- opposition scanner ---
  const [scanSymbolsText, setScanSymbolsText] = useState("LUNR, SPY, QQQ");
  const [scanTolDeg, setScanTolDeg] = useState<number>(5);
  const [scanMax, setScanMax] = useState<number>(15);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanErr, setScanErr] = useState<string | null>(null);
  const [scanRows, setScanRows] = useState<ScanRow[]>([]);

  // keep marketKind aligned with symbol format unless user explicitly changes it
  useEffect(() => {
    const inferred: MarketKind = isCryptoSymbol(symbol) ? "crypto" : "stock";
    // only auto-switch if it’s obviously inconsistent
    if (inferred !== marketKind && (symbol.includes("-") || marketKind === "crypto")) {
      setMarketKind(inferred);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  const instrumentText = useMemo(() => {
    const s = (symbol || "").toUpperCase().trim() || "—";
    return `${marketKind.toUpperCase()}  •  ${s}`;
  }, [marketKind, symbol]);

  function roundToTick(x: number) {
    const t = Number(tickSize) || 0.01;
    return Math.round(x / t) * t;
  }

  async function runAutoPivot() {
    setAutoLoading(true);
    setAutoErr(null);
    setAutoData(null);

    try {
      const r = await fetch("/api/pivot-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.trim(), timeframe: autoTf, lookback: Number(autoLookback) || 180 }),
      });

      const j = (await r.json()) as AutoPivotResp;
      if (!j.ok) throw new Error((j as any).error || "Pivot scan failed");

      setAutoData(j);

      // pre-select anchor basis on UI (doesn’t apply automatically)
      setPivotAnchorMode(autoAnchorBasis);
    } catch (e: any) {
      setAutoErr(e?.message || "Pivot scan failed");
    } finally {
      setAutoLoading(false);
    }
  }

  function applyAutoPivot() {
    if (!autoData || !autoData.ok) return;
    if (!autoData.pivot) {
      setAutoErr("No pivot was found in the lookback window. Increase lookback or switch timeframe.");
      return;
    }

    const p = autoData.pivot;
    const picked =
      autoAnchorBasis === "low"
        ? Number(p.l)
        : autoAnchorBasis === "high"
        ? Number(p.h)
        : autoAnchorBasis === "open"
        ? Number(p.o)
        : Number(p.c);

    const anchor = roundToTick(picked);

    setPivotDateTime(toDatetimeLocal(Number(p.t)));
    setAnchorPrice(anchor);
    setPivotAnchorMode(autoAnchorBasis);
  }

  async function scanOppositions() {
    setLoadingScan(true);
    setScanErr(null);
    setScanRows([]);

    try {
      if (mode !== "market") throw new Error("Scanner only runs in Market mode.");
      if (!pivotDateTime) throw new Error("Pivot date/time is required.");

      const pivotISO = new Date(pivotDateTime).toISOString();
      const symbols = parseSymbolsText(scanSymbolsText)
        .map((s) => s.toUpperCase())
        .slice(0, Math.max(1, Math.min(300, Number(scanMax) || 15)));

      if (!symbols.length) throw new Error("Enter at least one symbol to scan.");

      const r = await fetch("/api/gann-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbols,
          pivotISO,
          cycleDays: Number(marketCycleDays),
          tickSize: Number(tickSize) || 0.01,
          anchorSource: pivotAnchorMode,
          tolDeg: Number(scanTolDeg) || 5,
          maxSymbols: Number(scanMax) || 15,
          closestN: 8,
        }),
      });

      const j = (await r.json()) as ScanResp;
      if (!j.ok) throw new Error((j as any).error || "Scan failed");

      const rows = j.matches?.length ? j.matches : j.closest || [];
      setScanRows(rows);

      if (!j.matches?.length) {
        const errCount = Array.isArray(j.errors) ? j.errors.length : 0;
        setScanErr(
          `No matches within ±${scanTolDeg}° of opposition. Showing closest candidates${errCount ? ` (and ${errCount} errors)` : ""
          }.`
        );
      } else {
        const errCount = Array.isArray(j.errors) ? j.errors.length : 0;
        if (errCount) setScanErr(`${errCount} symbols failed to scan (API/data errors).`);
      }
    } catch (e: any) {
      setScanErr(e?.message || "Scan failed");
    } finally {
      setLoadingScan(false);
    }
  }

  return (
    <div style={page}>
      {/* top bar */}
      <div style={topBar}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={h1}>Gann Chart</div>

          <div style={pillGroup}>
            <button type="button" style={{ ...pillBtn, ...(mode === "market" ? pillBtnOn : null) }} onClick={() => setMode("market")}>
              Market
            </button>
            <button
              type="button"
              style={{ ...pillBtn, ...(mode === "personal" ? pillBtnOn : null) }}
              onClick={() => setMode("personal")}
            >
              Personal
            </button>
          </div>

          <div style={pillGroup}>
            <button
              type="button"
              style={{ ...pillBtn, ...(marketKind === "stock" ? pillBtnOn : null) }}
              onClick={() => setMarketKind("stock")}
            >
              Stock
            </button>
            <button
              type="button"
              style={{ ...pillBtn, ...(marketKind === "crypto" ? pillBtnOn : null) }}
              onClick={() => setMarketKind("crypto")}
            >
              Crypto
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div style={field}>
            <div style={label}>Symbol</div>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              style={input}
              placeholder={marketKind === "crypto" ? "BTC-USD" : "SPY"}
            />
          </div>

          <div style={field}>
            <div style={label}>Tick size</div>
            <input value={String(tickSize)} onChange={(e) => setTickSize(Number(e.target.value) || 0.01)} style={input} />
          </div>

          <div style={field}>
            <div style={label}>Cycle days</div>
            <input
              value={String(marketCycleDays)}
              onChange={(e) => setMarketCycleDays(Number(e.target.value) || 90)}
              style={input}
            />
          </div>

          <div style={field}>
            <div style={label}>Pivot (local)</div>
            <input type="datetime-local" value={pivotDateTime} onChange={(e) => setPivotDateTime(e.target.value)} style={input} />
          </div>

          <div style={field}>
            <div style={label}>Anchor</div>
            <input value={String(anchorPrice)} onChange={(e) => setAnchorPrice(Number(e.target.value) || 0)} style={input} />
          </div>

          <div style={field}>
            <div style={label}>Basis</div>
            <div style={seg}>
              {(["close", "open", "high", "low"] as AnchorSource[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setPivotAnchorMode(a)}
                  style={{ ...segBtn, ...(pivotAnchorMode === a ? segBtnOn : null) }}
                >
                  {a[0].toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Auto Pivot Finder */}
      <div style={card}>
        <div style={cardHead}>
          <div>
            <div style={cardTitle}>Auto Pivot Finder</div>
            <div style={cardSub}>
              Uses swing structure for pivot timing, then lets you choose the anchor price basis (Close/Open/High/Low).
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={miniPill}>{autoData && (autoData as any).ok ? "Ready" : "No data"}</div>
            <button type="button" onClick={runAutoPivot} style={btn} disabled={autoLoading}>
              {autoLoading ? "Running…" : "Run scan"}
            </button>
          </div>
        </div>

        <div style={cardBodyGrid}>
          <div style={fieldBlock}>
            <div style={label}>Timeframe</div>
            <div style={seg}>
              {(["1d", "4h", "1h"] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setAutoTf(tf)}
                  style={{ ...segBtn, ...(autoTf === tf ? segBtnOn : null) }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div style={fieldBlock}>
            <div style={label}>Lookback (bars)</div>
            <input value={autoLookback} onChange={(e) => setAutoLookback(e.target.value)} style={inputWide} />
            <div style={hint}>
              {marketKind === "crypto" ? "Capped ~300 (Coinbase typical window)." : "Polygon supports larger windows."}
            </div>
          </div>

          <div style={fieldBlock}>
            <div style={label}>Anchor basis (price)</div>
            <div style={seg}>
              {(["close", "open", "high", "low"] as AnchorSource[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAutoAnchorBasis(a)}
                  style={{ ...segBtn, ...(autoAnchorBasis === a ? segBtnOn : null) }}
                >
                  {a[0].toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
            <div style={hint}>Close is usually the cleanest “consensus” anchor.</div>
          </div>

          <div style={fieldBlock}>
            <div style={label}>Instrument</div>
            <div style={instrument}>{instrumentText}</div>
            <div style={hint}>Click Run scan when you’re ready.</div>
          </div>
        </div>

        {autoErr ? (
          <div style={errorBox}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Pivot scan failed</div>
            {autoErr}
          </div>
        ) : null}

        {autoData && (autoData as any).ok && (autoData as any).pivot ? (
          <div style={resultBox}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ fontWeight: 800 }}>
                Pivot • {(autoData as any).pivot.ymd} ({(autoData as any).timezoneUsed})
              </div>

              <button type="button" onClick={applyAutoPivot} style={btn}>
                Apply
              </button>
            </div>

            <div style={ohlcRow}>
              <div>
                O: <strong>{formatNum((autoData as any).pivot.o)}</strong>
              </div>
              <div>
                H: <strong>{formatNum((autoData as any).pivot.h)}</strong>
              </div>
              <div>
                L: <strong>{formatNum((autoData as any).pivot.l)}</strong>
              </div>
              <div>
                C: <strong>{formatNum((autoData as any).pivot.c)}</strong>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Pivot Precheck */}
      <div style={card}>
        <div style={cardHead}>
          <div>
            <div style={cardTitle}>Pivot Precheck</div>
            <div style={cardSub}>Optional: score the pivot before anchoring the cycle.</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={miniPill}>{precheck ? `Total ${precheck.total}/10` : "Not scored"}</div>
          </div>
        </div>

        <div style={{ padding: 14 }}>
          <PivotPrecheckPanel onChange={(r) => setPrecheck(r)} />
        </div>
      </div>

      {/* Opposition Scanner */}
      <div style={card}>
        <div style={cardHead}>
          <div>
            <div style={cardTitle}>Opposition Scanner</div>
            <div style={cardSub}>Finds symbols where time and price are ~180° apart (± tolerance).</div>
          </div>
        </div>

        <div style={{ padding: 14 }}>
          <div style={{ marginBottom: 10 }}>
            <div style={label}>Symbols (comma or space separated)</div>
            <textarea
              value={scanSymbolsText}
              onChange={(e) => setScanSymbolsText(e.target.value)}
              style={textarea}
              rows={3}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div style={fieldBlock}>
              <div style={label}>Opposition tolerance (degrees)</div>
              <input value={String(scanTolDeg)} onChange={(e) => setScanTolDeg(Number(e.target.value) || 5)} style={inputWide} />
            </div>

            <div style={fieldBlock}>
              <div style={label}>Max symbols</div>
              <input value={String(scanMax)} onChange={(e) => setScanMax(Number(e.target.value) || 15)} style={inputWide} />
            </div>

            <button type="button" onClick={scanOppositions} style={btn} disabled={loadingScan}>
              {loadingScan ? "Scanning…" : "Scan"}
            </button>
          </div>

          {scanErr ? <div style={warnBox}>{scanErr}</div> : null}

          {scanRows.length ? (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {scanRows.map((row, idx) => (
                <div key={`${row.symbol}-${idx}`} style={miniCardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 800 }}>
                      {row.symbol}{" "}
                      <span style={{ opacity: 0.75, fontWeight: 600 }}>
                        ({row.kind})
                      </span>
                    </div>
                    <div style={{ opacity: 0.85 }}>
                      opp dist: <strong>{formatNum(row.oppositionDist, 3)}°</strong>
                    </div>
                  </div>

                  <div style={miniRow}>
                    <div>
                      time: <strong>{formatNum(row.timeDeg, 3)}°</strong>
                    </div>
                    <div>
                      price: <strong>{formatNum(row.priceDeg, 3)}°</strong>
                    </div>
                    <div>
                      anchor: <strong>{formatNum(row.anchor, 6)}</strong> ({String(row.anchorSource).toUpperCase()})
                    </div>
                    <div>
                      price: <strong>{formatNum(row.price, 6)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : scanErr ? null : (
            <div style={{ marginTop: 12, opacity: 0.75, fontSize: 12 }}>No results yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/** styles */
const page: React.CSSProperties = {
  padding: 18,
  color: "rgba(255,255,255,0.92)",
};

const topBar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap",
  alignItems: "flex-start",
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  marginBottom: 14,
};

const h1: React.CSSProperties = {
  fontWeight: 900,
  letterSpacing: 0.3,
  fontSize: 18,
};

const pillGroup: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: 999,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.12)",
};

const pillBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "rgba(255,255,255,0.78)",
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: 12,
};

const pillBtnOn: React.CSSProperties = {
  background: "rgba(255,255,255,0.10)",
  color: "rgba(255,255,255,0.92)",
};

const field: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  minWidth: 150,
};

const label: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(255,255,255,0.70)",
};

const input: React.CSSProperties = {
  background: "rgba(0,0,0,0.20)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  padding: "10px 12px",
  color: "rgba(255,255,255,0.92)",
  outline: "none",
  fontSize: 13,
};

const inputWide: React.CSSProperties = { ...input, width: "100%" };

const card: React.CSSProperties = {
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  overflow: "hidden",
  marginBottom: 14,
};

const cardHead: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "14px 16px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  alignItems: "center",
};

const cardTitle: React.CSSProperties = { fontWeight: 900, fontSize: 18 };
const cardSub: React.CSSProperties = { marginTop: 4, fontSize: 13, opacity: 0.75, maxWidth: 820 };

const cardBodyGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 16,
  padding: 16,
};

const fieldBlock: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8 };

const seg: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 999,
  overflow: "hidden",
};

const segBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: "8px 12px",
  color: "rgba(255,255,255,0.78)",
  cursor: "pointer",
  fontSize: 12,
};

const segBtnOn: React.CSSProperties = {
  background: "rgba(255,255,255,0.10)",
  color: "rgba(255,255,255,0.92)",
};

const btn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "rgba(255,255,255,0.90)",
  borderRadius: 999,
  padding: "10px 14px",
  fontSize: 12,
  cursor: "pointer",
};

const miniPill: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  opacity: 0.9,
};

const hint: React.CSSProperties = { fontSize: 12, opacity: 0.65 };

const instrument: React.CSSProperties = { fontWeight: 900, letterSpacing: 0.5 };

const errorBox: React.CSSProperties = {
  margin: 16,
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,80,80,0.35)",
  background: "rgba(255,80,80,0.12)",
  color: "rgba(255,180,180,0.95)",
};

const resultBox: React.CSSProperties = {
  margin: 16,
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.12)",
};

const ohlcRow: React.CSSProperties = {
  marginTop: 10,
  fontSize: 12,
  opacity: 0.88,
  display: "flex",
  gap: 14,
  flexWrap: "wrap",
};

const textarea: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.20)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  padding: "10px 12px",
  color: "rgba(255,255,255,0.92)",
  outline: "none",
  fontSize: 13,
  resize: "vertical",
};

const warnBox: React.CSSProperties = {
  marginTop: 12,
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,120,120,0.30)",
  background: "rgba(255,120,120,0.10)",
  color: "rgba(255,210,210,0.95)",
};

const miniCardStyle: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.14)",
  padding: 12,
};

const miniRow: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  opacity: 0.88,
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};
