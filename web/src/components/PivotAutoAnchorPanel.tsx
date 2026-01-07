// src/components/PivotAutoAnchorPanel.tsx
"use client";

import React, { useMemo, useState } from "react";
import PivotPrecheckPanel, { type PivotPrecheckResult } from "@/components/PivotPrecheckPanel";

type Timeframe = "1d" | "4h" | "1h";

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
  candles: { t: string; o: number; h: number; l: number; c: number; v?: number }[];
  note?: string;
};

type ScanRes = ScanOk | { ok: false; error: string };

type Props = {
  kind: "crypto" | "stock";
  symbol: string;
  /** default timeframe shown */
  defaultTimeframe?: Timeframe;
};

export default function PivotAutoAnchorPanel({ kind, symbol, defaultTimeframe = "1d" }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultTimeframe);
  const [lookbackBars, setLookbackBars] = useState<number>(180);

  const [res, setRes] = useState<ScanRes | null>(null);
  const [loading, setLoading] = useState(false);

  // You said in URA the 9th phase is an interphase — we’ll keep space for that later.
  // For now: scan proposes pivot candidates; you choose one consciously.

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
    } catch (e: any) {
      setRes({ ok: false, error: e?.message || "Scan failed" });
    } finally {
      setLoading(false);
    }
  }

  // Placeholder proposal: “best pivot” selection will evolve.
  // For now, we just surface the scan + let precheck scoring exist.
  const scanMeta = useMemo(() => {
    if (!res?.ok) return null;
    return `${res.kind.toUpperCase()} • ${res.symbol} • ${res.timeframe} (returned ${res.returnedBars}/${res.requestedBars})`;
  }, [res]);

  const errorText = res && !res.ok ? res.error : null;

  return (
    <div style={panel}>
      <div style={topRow}>
        <div>
          <div style={title}>Auto Pivot Finder</div>
          <div style={subtitle}>
            Scores swing pivots for leg birth, structure, follow-through, and time symmetry — then proposes the best anchor date/price.
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
            <div style={miniHeader}>Pre-check (manual)</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
              This doesn’t auto-apply anything. Use it to judge the candidate pivot you’re considering.
            </div>

            <PivotPrecheckPanel onChange={(v: PivotPrecheckResult) => void v} />
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

/* ---------- styles (matches your chart theme) ---------- */

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
  gridTemplateColumns: "auto auto 1fr",
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
  gridTemplateColumns: "1fr 1.4fr",
  gap: 14,
  borderTop: "1px solid rgba(58,69,80,0.6)",
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
