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
  v?: number;
};

type CandleResponse =
  | {
      ok: true;
      kind: "stock" | "crypto";
      provider: "polygon" | "coinbase";
      symbol: string;
      pivotISO: string;
      bucketRule: string;
      timezoneUsed: "America/New_York" | "UTC";
      sessionDayYMD: string;
      candles: Candle[];
      rawCount: number;
    }
  | { ok: false; error: string };

type MarketPriceResponse =
  | {
      ok: true;
      kind: "stock" | "crypto";
      provider: "polygon" | "coinbase";
      symbol: string;
      price: number;
      asOfISO: string;
      note?: string;
    }
  | { ok: false; error: string };

/* -------------------- Constants -------------------- */

const DEFAULT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const ALWAYS_INCLUDE_DOWNSIDE = true;
const SYNC_TOL_DEG = 12;

/* -------------------- Component -------------------- */

export default function ChartClient() {
  const [mode, setMode] = useState<Mode>("market");

  // Market inputs
  const [symbol, setSymbol] = useState("SOL-USD");
  const [anchorPrice, setAnchorPrice] = useState("200");
  const [tickSize, setTickSize] = useState("0.01");

  const [pivotDateTime, setPivotDateTime] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const [marketCycleDays, setMarketCycleDays] = useState("90");
  const [pivotAnchorMode, setPivotAnchorMode] =
    useState<PivotAnchorMode>("close");

  const [candleRes, setCandleRes] = useState<CandleResponse | null>(null);
  const [priceRes, setPriceRes] = useState<MarketPriceResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingCandle, setLoadingCandle] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Personal
  const [anchorDateTime, setAnchorDateTime] =
    useState("1990-01-24T01:39");
  const [cycleDays, setCycleDays] = useState("365.2425");

  const [res, setRes] = useState<GannResponse | null>(null);

  const angles = useMemo(() => [...DEFAULT_ANGLES], []);

  const marketKind = useMemo<"crypto" | "stock">(() => {
    const s = symbol.toUpperCase();
    if (s.includes("-USD") || s.includes("BTC") || s.includes("ETH"))
      return "crypto";
    return "stock";
  }, [symbol]);

  /* -------------------- Actions -------------------- */

  async function run() {
    setLoading(true);
    setRes(null);

    try {
      const payload =
        mode === "market"
          ? {
              mode,
              symbol: symbol.trim(),
              anchor: Number(anchorPrice),
              tickSize: Number(tickSize),
              angles,
              includeDownside: ALWAYS_INCLUDE_DOWNSIDE,
              pivotDateTime,
              cycleDays: Number(marketCycleDays),
            }
          : {
              mode,
              anchorDateTime,
              cycleDays: Number(cycleDays),
              angles,
            };

      const r = await fetch("/api/gann", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setRes(await r.json());
    } catch (e: any) {
      setRes({ ok: false, error: e?.message ?? "Unknown error" });
    } finally {
      setLoading(false);
    }
  }

  async function autofillAnchorFromPivot() {
    setLoadingCandle(true);
    setCandleRes(null);

    try {
      const r = await fetch("/api/market-candle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.trim(),
          pivotISO: new Date(pivotDateTime).toISOString(),
        }),
      });

      const json = (await r.json()) as CandleResponse;
      setCandleRes(json);

      if (!json.ok) return;

      const pivot = json.candles.find((c) => c.label === "Pivot");
      if (!pivot) return;

      const picked =
        pivotAnchorMode === "low"
          ? pivot.l
          : pivotAnchorMode === "high"
          ? pivot.h
          : pivotAnchorMode === "open"
          ? pivot.o
          : pivot.c;

      const t = Number(tickSize) || 0.01;
      const rounded = Math.round(picked / t) * t;

      setAnchorPrice(
        rounded.toFixed(decimalsFromTick(t))
      );
    } finally {
      setLoadingCandle(false);
    }
  }

  async function refreshCurrentPrice() {
    setLoadingPrice(true);
    setPriceRes(null);

    try {
      const r = await fetch("/api/market-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.trim() }),
      });

      setPriceRes(await r.json());
    } finally {
      setLoadingPrice(false);
    }
  }

  const priceMarkerDeg = useMemo(() => {
    if (!priceRes?.ok) return null;
    const a = Number(anchorPrice);
    const p = priceRes.price;
    if (a <= 0 || p <= 0) return null;
    return (((Math.sqrt(p) - Math.sqrt(a)) * 180) % 360 + 360) % 360;
  }, [priceRes, anchorPrice]);

  /* -------------------- Render -------------------- */

  return (
    <div style={pageStyle}>
      <div style={wrapStyle}>
        {/* Top bar */}
        <div style={topBarStyle}>
          <div>
            Mode:&nbsp;
            <button onClick={() => setMode("market")}>Market</button>
            <button onClick={() => setMode("personal")}>Personal</button>
          </div>
          <button onClick={run}>
            {loading ? "Running…" : "Run"}
          </button>
        </div>

        <div style={gridStyle}>
          {/* Inputs */}
          <div style={panelStyle}>
            <h3>Inputs</h3>

            {mode === "market" && (
              <>
                <input value={symbol} onChange={(e) => setSymbol(e.target.value)} />
                <input value={anchorPrice} onChange={(e) => setAnchorPrice(e.target.value)} />
                <input value={tickSize} onChange={(e) => setTickSize(e.target.value)} />

                <input
                  type="datetime-local"
                  value={pivotDateTime}
                  onChange={(e) => setPivotDateTime(e.target.value)}
                />

                <button onClick={autofillAnchorFromPivot}>
                  Auto-fill from pivot
                </button>

                <button onClick={refreshCurrentPrice}>
                  Refresh price
                </button>
              </>
            )}
          </div>

          {/* Visuals */}
          <div style={panelStyle}>
            <h3>Visuals</h3>

            {res?.ok && mode === "market" && (
              <SquareOfNinePanel
                anchor={Number(anchorPrice)}
                tickSize={Number(tickSize)}
                targets={res.data.targets ?? []}
                currentPrice={priceRes?.ok ? priceRes.price : null}
              />
            )}
          </div>

          {/* Outputs */}
          <div style={panelStyle}>
            <h3>Outputs</h3>
            <pre style={{ fontSize: 11 }}>
              {JSON.stringify(res, null, 2)}
            </pre>
          </div>
        </div>

        {mode === "market" && (
          <PivotAutoAnchorPanel
            kind={marketKind}
            symbol={symbol}
            tickSize={Number(tickSize)}
            onApply={(p) => {
              if (p?.pivotLocalInput) setPivotDateTime(p.pivotLocalInput);
              if (p?.anchorSource) setPivotAnchorMode(p.anchorSource);
              setAnchorPrice(String(p.anchorPrice));
            }}
          />
        )}
      </div>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

function decimalsFromTick(tick: number) {
  if (!Number.isFinite(tick)) return 0;
  const s = String(tick);
  const i = s.indexOf(".");
  return i === -1 ? 0 : Math.min(12, s.length - i - 1);
}

/* -------------------- Styles -------------------- */

const pageStyle: CSSProperties = {
  background: "#1B1F24",
  minHeight: "100vh",
  padding: 20,
  color: "#EDE3CC",
};

const wrapStyle: CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 12,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 12,
};

const panelStyle: CSSProperties = {
  background: "#243039",
  borderRadius: 12,
  padding: 12,
};
