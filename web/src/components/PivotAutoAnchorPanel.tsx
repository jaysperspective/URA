// src/components/PivotAutoAnchorPanel.tsx
"use client";

import React, { useMemo, useState } from "react";

type Timeframe = "1d" | "4h" | "1h";
type AnchorSource = "close" | "open" | "high" | "low";
type Kind = "stock" | "crypto";

export default function PivotAutoAnchorPanel(props: {
  kind: Kind;                 // coming from ChartClient (stock/crypto)
  symbol: string;             // e.g. LUNR or BTC-USD
  tickSize: number;
  onApply: (p: { pivotLocalInput: string; anchorPrice: number; anchorSource: AnchorSource }) => void;
}) {
  const { kind, symbol, tickSize, onApply } = props;

  const [timeframe, setTimeframe] = useState<Timeframe>("1d");
  const [lookback, setLookback] = useState("180");
  const [anchorSource, setAnchorSource] = useState<AnchorSource>("close");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const instrumentText = useMemo(() => `${kind.toUpperCase()}  •  ${(symbol || "").toUpperCase() || "—"}`, [kind, symbol]);

  function roundToTick(x: number) {
    const t = Number(tickSize) || 0.01;
    return Math.round(x / t) * t;
  }

  function toDatetimeLocal(ms: number) {
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function runScan() {
    setLoading(true);
    setErr(null);
    setData(null);

    try {
      const r = await fetch("/api/pivot-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: (symbol || "").trim(),
          timeframe,
          lookback: Number(lookback) || 180,
        }),
      });

      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "Pivot scan failed");
      setData(j);
    } catch (e: any) {
      setErr(e?.message || "Pivot scan failed");
    } finally {
      setLoading(false);
    }
  }

  function apply() {
    if (!data?.pivot) return;

    const p = data.pivot;
    const picked =
      anchorSource === "low" ? Number(p.l)
      : anchorSource === "high" ? Number(p.h)
      : anchorSource === "open" ? Number(p.o)
      : Number(p.c);

    const anchor = roundToTick(picked);
    onApply({
      pivotLocalInput: toDatetimeLocal(Number(p.t)),
      anchorPrice: anchor,
      anchorSource,
    });
  }

  return (
    <div style={wrap}>
      <div style={headRow}>
        <div>
          <div style={title}>Auto Pivot Finder</div>
          <div style={sub}>Uses swing structure for pivot timing, then lets you choose the anchor price basis (Close/Open/High/Low).</div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={pill}>{data?.ok ? "Ready" : "No data"}</div>
          <button onClick={runScan} style={btn} disabled={loading}>
            {loading ? "Scanning…" : "Run scan"}
          </button>
        </div>
      </div>

      <div style={row}>
        <div style={col}>
          <div style={label}>Timeframe</div>
          <div style={seg}>
            {(["1d", "4h", "1h"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                style={{ ...segBtn, ...(timeframe === tf ? segBtnOn : null) }}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div style={col}>
          <div style={label}>Lookback (bars)</div>
          <input style={inp} value={lookback} onChange={(e) => setLookback(e.target.value)} />
          <div style={hint}>
            {kind === "crypto" ? "Capped at ~300 (Coinbase typical window)." : "Polygon supports larger windows."}
          </div>
        </div>

        <div style={col}>
          <div style={label}>Anchor basis (price)</div>
          <div style={seg}>
            {(["close", "open", "high", "low"] as AnchorSource[]).map((a) => (
              <button
                key={a}
                style={{ ...segBtn, ...(anchorSource === a ? segBtnOn : null) }}
                onClick={() => setAnchorSource(a)}
              >
                {a[0].toUpperCase() + a.slice(1)}
              </button>
            ))}
          </div>
          <div style={hint}>Close is usually the cleanest “consensus” anchor.</div>
        </div>

        <div style={col}>
          <div style={label}>Instrument</div>
          <div style={instrument}>{instrumentText}</div>
          <div style={hint}>Click Run scan when you’re ready.</div>
        </div>
      </div>

      {err ? (
        <div style={errorBox}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Pivot scan failed</div>
          {err}
        </div>
      ) : null}

      {data?.pivot ? (
        <div style={resultBox}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div style={{ fontWeight: 800 }}>
              Pivot • {data.pivot.ymd} ({data.timezoneUsed})
            </div>
            <button onClick={apply} style={btn}>
              Apply
            </button>
          </div>

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div>O: <strong>{fmt(data.pivot.o)}</strong></div>
            <div>H: <strong>{fmt(data.pivot.h)}</strong></div>
            <div>L: <strong>{fmt(data.pivot.l)}</strong></div>
            <div>C: <strong>{fmt(data.pivot.c)}</strong></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function fmt(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return String(n);
  return x.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

const wrap: React.CSSProperties = {
  background: "#243039",
  borderRadius: 20,
  border: "1px solid rgba(58,69,80,0.9)",
  overflow: "hidden",
};

const headRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "14px 16px",
  borderBottom: "1px solid rgba(58,69,80,0.6)",
};

const title: React.CSSProperties = { fontWeight: 800, fontSize: 18, color: "#EDE3CC" };
const sub: React.CSSProperties = { marginTop: 4, fontSize: 13, opacity: 0.75, color: "#EDE3CC" };

const row: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 16,
  padding: 16,
};

const col: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8 };
const label: React.CSSProperties = { fontSize: 12, opacity: 0.8, color: "#EDE3CC" };
const hint: React.CSSProperties = { fontSize: 12, opacity: 0.65, color: "#EDE3CC" };
const instrument: React.CSSProperties = { fontWeight: 800, letterSpacing: 0.5, color: "#EDE3CC" };

const seg: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(58,69,80,0.9)",
  borderRadius: 999,
  overflow: "hidden",
};

const segBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: "8px 12px",
  color: "#EDE3CC",
  opacity: 0.75,
  cursor: "pointer",
};

const segBtnOn: React.CSSProperties = {
  background: "rgba(237,227,204,0.12)",
  opacity: 1,
};

const inp: React.CSSProperties = {
  background: "#1B1F24",
  border: "1px solid #3a4550",
  borderRadius: 10,
  padding: "10px 12px",
  color: "#EDE3CC",
  fontSize: 13,
  outline: "none",
};

const btn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #3a4550",
  borderRadius: 999,
  padding: "8px 12px",
  color: "#EDE3CC",
  fontSize: 12,
  cursor: "pointer",
};

const pill: React.CSSProperties = {
  border: "1px solid rgba(58,69,80,0.9)",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  opacity: 0.85,
  color: "#EDE3CC",
};

const errorBox: React.CSSProperties = {
  margin: 16,
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,80,80,0.35)",
  background: "rgba(255,80,80,0.12)",
  color: "#FFB0B0",
};

const resultBox: React.CSSProperties = {
  margin: 16,
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(58,69,80,0.6)",
  background: "rgba(0,0,0,0.14)",
  color: "#EDE3CC",
};
