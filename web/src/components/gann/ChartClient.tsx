// src/components/gann/ChartClient.tsx
"use client";

import React, { useMemo, useState, type CSSProperties } from "react";
import PivotAutoAnchorPanel from "@/components/PivotAutoAnchorPanel";
import SquareOfNinePanel from "@/components/SquareOfNinePanel";

/* -------------------- Types -------------------- */

type Mode = "market" | "personal";
type PivotAnchorMode = "low" | "high" | "close" | "open";

type GannResponse =
  | { ok: true; mode: Mode; input: any; data: any }
  | { ok: false; error: string; retryAfterSeconds?: number };

type Candle = {
  dayKey: string;
  label: "Prior" | "Pivot" | "Next";
  o: number;
  h: number;
  l: number;
  c: number;
};

type CandleResponse =
  | {
      ok: true;
      provider: "polygon" | "coinbase";
      symbol: string;
      sessionDayYMD: string;
      timezoneUsed: "America/New_York" | "UTC";
      bucketRule: string;
      candles: Candle[];
    }
  | { ok: false; error: string };

type MarketPriceResponse =
  | {
      ok: true;
      provider: "polygon" | "coinbase";
      symbol: string;
      price: number;
      asOfISO: string;
    }
  | { ok: false; error: string };

const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const SYNC_TOL_DEG = 12;

/* -------------------- Component -------------------- */

export default function ChartClient() {
  const [mode, setMode] = useState<Mode>("market");

  const [symbol, setSymbol] = useState("SOL-USD");
  const [anchorPrice, setAnchorPrice] = useState("200");
  const [tickSize, setTickSize] = useState("0.01");

  const [pivotDateTime, setPivotDateTime] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16);
  });

  const [marketCycleDays, setMarketCycleDays] = useState("90");
  const [pivotAnchorMode, setPivotAnchorMode] = useState<PivotAnchorMode>("close");

  const [candleRes, setCandleRes] = useState<CandleResponse | null>(null);
  const [priceRes, setPriceRes] = useState<MarketPriceResponse | null>(null);

  const [res, setRes] = useState<GannResponse | null>(null);
  const [loading, setLoading] = useState(false);

  /* -------------------- Derived -------------------- */

  const priceMarkerDeg = useMemo(() => {
    if (!priceRes?.ok) return null;
    const a = Number(anchorPrice);
    const p = Number(priceRes.price);
    if (!a || !p) return null;
    const raw = (Math.sqrt(p) - Math.sqrt(a)) * 180;
    return ((raw % 360) + 360) % 360;
  }, [priceRes, anchorPrice]);

  /* -------------------- Actions -------------------- */

  async function run() {
    setLoading(true);
    setRes(null);

    try {
      const r = await fetch("/api/gann", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          symbol,
          anchor: Number(anchorPrice),
          tickSize: Number(tickSize),
          pivotDateTime,
          cycleDays: Number(marketCycleDays),
          angles: ANGLES,
        }),
      });

      setRes(await r.json());
    } finally {
      setLoading(false);
    }
  }

  async function refreshCurrentPrice() {
    const r = await fetch("/api/market-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol }),
    });
    setPriceRes(await r.json());
  }

  /* -------------------- Render -------------------- */

  return (
    <div style={pageStyle}>
      <div style={wrapStyle}>
        {/* Top Bar */}
        <div style={topBarStyle}>
          <Segmented
            value={mode}
            options={[
              { value: "market", label: "Market" },
              { value: "personal", label: "Personal" },
            ]}
            onChange={(v) => setMode(v as Mode)}
          />
          <button onClick={run} style={buttonStyle}>
            {loading ? "Running…" : "Run"}
          </button>
        </div>

        {/* Main Grid */}
        <div style={gridStyle}>
          {/* Inputs */}
          <div style={panelStyle}>
            <PanelHeader title="Inputs" />
            <Field label="Symbol">
              <input value={symbol} onChange={(e) => setSymbol(e.target.value)} style={inputStyle} />
            </Field>

            <Field label="Anchor Price">
              <input value={anchorPrice} onChange={(e) => setAnchorPrice(e.target.value)} style={inputStyle} />
            </Field>

            <Field label="Tick Size">
              <input value={tickSize} onChange={(e) => setTickSize(e.target.value)} style={inputStyle} />
            </Field>

            <Field label="Pivot Date / Time">
              <input
                type="datetime-local"
                value={pivotDateTime}
                onChange={(e) => setPivotDateTime(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <button onClick={refreshCurrentPrice} style={buttonStyle}>
              Refresh Price
            </button>
          </div>

          {/* Angle Ring */}
          <div style={panelStyle}>
            <PanelHeader title="Angle Ring" />
            {res?.ok ? (
              <div style={{ padding: 12, textAlign: "center" }}>
                <div>Time Angle: {res.data.markerDeg?.toFixed(2)}°</div>
                {priceMarkerDeg != null && <div>Price Angle: {priceMarkerDeg.toFixed(2)}°</div>}
              </div>
            ) : (
              <div style={emptyStyle}>Run to generate</div>
            )}
          </div>

          {/* Outputs */}
          <div style={panelStyle}>
            <PanelHeader title="Outputs" />
            <pre style={jsonStyle}>{res?.ok ? JSON.stringify(res.data, null, 2) : "—"}</pre>
          </div>
        </div>

        {/* ✅ Square of 9 — FULL WIDTH MODULE */}
        {mode === "market" && res?.ok && (
          <div style={{ ...panelStyle, marginTop: 16 }}>
            <PanelHeader title="Square of 9" />
            <SquareOfNinePanel
              anchor={Number(anchorPrice)}
              tickSize={Number(tickSize)}
              targets={res.data.targets ?? []}
              currentPrice={priceRes?.ok ? priceRes.price : null}
            />
          </div>
        )}

        {/* Auto Pivot Finder */}
        {mode === "market" && (
          <div style={{ marginTop: 16 }}>
            <PivotAutoAnchorPanel kind="crypto" symbol={symbol} tickSize={Number(tickSize)} />
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------- Small UI Helpers -------------------- */

function PanelHeader({ title }: { title: string }) {
  return <div style={panelHeaderStyle}>{title}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
      <div style={{ fontSize: 12, opacity: 0.85 }}>{label}</div>
      {children}
    </label>
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
    <div style={segWrapStyle}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            ...segBtnStyle,
            ...(o.value === value ? segBtnActiveStyle : {}),
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------- Styles -------------------- */

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#1B1F24",
  padding: 20,
  color: "#EDE3CC",
};

const wrapStyle: CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#222933",
  padding: 12,
  borderRadius: 14,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "320px 1fr 360px",
  gap: 14,
};

const panelStyle: CSSProperties = {
  background: "#243039",
  borderRadius: 18,
  border: "1px solid #3a4550",
  overflow: "hidden",
};

const panelHeaderStyle: CSSProperties = {
  padding: "10px 14px",
  borderBottom: "1px solid #3a4550",
  fontWeight: 700,
};

const inputStyle: CSSProperties = {
  background: "#1B1F24",
  border: "1px solid #3a4550",
  borderRadius: 8,
  padding: "8px 10px",
  color: "#EDE3CC",
};

const buttonStyle: CSSProperties = {
  marginTop: 10,
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #3a4550",
  background: "transparent",
  color: "#EDE3CC",
  cursor: "pointer",
};

const segWrapStyle: CSSProperties = {
  display: "flex",
  borderRadius: 999,
  overflow: "hidden",
};

const segBtnStyle: CSSProperties = {
  padding: "8px 14px",
  border: "none",
  background: "transparent",
  color: "#EDE3CC",
  opacity: 0.7,
};

const segBtnActiveStyle: CSSProperties = {
  background: "rgba(237,227,204,0.15)",
  opacity: 1,
};

const emptyStyle: CSSProperties = {
  padding: 20,
  opacity: 0.6,
};

const jsonStyle: CSSProperties = {
  padding: 12,
  fontSize: 11,
  maxHeight: 400,
  overflow: "auto",
};
