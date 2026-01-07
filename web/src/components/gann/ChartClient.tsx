// src/components/gann/ChartClient.tsx
"use client";

import React, { useMemo, useState, type CSSProperties } from "react";
import PivotAutoAnchorPanel from "@/components/PivotAutoAnchorPanel";
import SquareOfNinePanel from "@/components/gann/SquareOfNinePanel";

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

const DEFAULT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const FIXED_ANGLES = DEFAULT_ANGLES;
const ALWAYS_INCLUDE_DOWNSIDE = true;

// “In sync” tolerance (degrees) for time-vs-price comparison
const SYNC_TOL_DEG = 12;

export default function ChartClient() {
  const [mode, setMode] = useState<Mode>("market");

  // MARKET inputs
  const [symbol, setSymbol] = useState("SOL-USD");
  const [anchorPrice, setAnchorPrice] = useState("200");
  const [tickSize, setTickSize] = useState("0.01");

  // Market marker: pivot datetime + cycle length
  const [pivotDateTime, setPivotDateTime] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`;
  });
  const [marketCycleDays, setMarketCycleDays] = useState("90");

  // Pivot → anchor autofill
  const [pivotAnchorMode, setPivotAnchorMode] = useState<PivotAnchorMode>("close");
  const [candleRes, setCandleRes] = useState<CandleResponse | null>(null);
  const [loadingCandle, setLoadingCandle] = useState(false);

  // Current price (manual refresh only)
  const [priceRes, setPriceRes] = useState<MarketPriceResponse | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // PERSONAL inputs
  const [anchorDateTime, setAnchorDateTime] = useState("1990-01-24T01:39");
  const [cycleDays, setCycleDays] = useState("365.2425");

  const [res, setRes] = useState<GannResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const angles = useMemo(() => FIXED_ANGLES.slice(), []);

  // Infer market kind from symbol. Adjust later if you add an explicit toggle.
  const marketKind = useMemo<"crypto" | "stock">(() => {
    const s = (symbol || "").toUpperCase();
    if (s.includes("BTC") || s.includes("ETH") || s.includes("SOL") || s.includes("-USD")) return "crypto";
    return "stock";
  }, [symbol]);

  async function run() {
    setLoading(true);
    setRes(null);

    try {
      const payload =
        mode === "market"
          ? {
              mode,
              symbol: symbol.trim() || undefined,
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

      const json = (await r.json()) as GannResponse;
      setRes(json);
    } catch (e: any) {
      setRes({ ok: false, error: e?.message || "Unknown error" });
    } finally {
      setLoading(false);
    }
  }

  async function autofillAnchorFromPivot() {
    if (!symbol.trim()) {
      setCandleRes({ ok: false, error: "Symbol is required for autofill." });
      return;
    }
    if (!pivotDateTime) {
      setCandleRes({ ok: false, error: "Pivot date/time is required for autofill." });
      return;
    }

    setLoadingCandle(true);
    setCandleRes(null);

    try {
      const pivotISO = new Date(pivotDateTime).toISOString();

      const r = await fetch("/api/market-candle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.trim(), pivotISO }),
      });

      const json = (await r.json()) as CandleResponse;
      setCandleRes(json);

      if (!json.ok) return;

      const pivot = json.candles.find((x) => x.label === "Pivot");
      if (!pivot) {
        setCandleRes({ ok: false, error: "No Pivot candle returned for that date." });
        return;
      }

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

      setAnchorPrice(String(rounded.toFixed(decimalsFromTick(t))));
    } catch (e: any) {
      setCandleRes({ ok: false, error: e?.message || "Autofill failed" });
    } finally {
      setLoadingCandle(false);
    }
  }

  async function refreshCurrentPrice() {
    if (!symbol.trim()) {
      setPriceRes({ ok: false, error: "Symbol is required for current price." });
      return;
    }

    setLoadingPrice(true);
    setPriceRes(null);

    try {
      const r = await fetch("/api/market-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.trim() }),
      });

      const json = (await r.json()) as MarketPriceResponse;
      setPriceRes(json);
    } catch (e: any) {
      setPriceRes({ ok: false, error: e?.message || "Price fetch failed" });
    } finally {
      setLoadingPrice(false);
    }
  }

  const cardTitle = mode === "market" ? "Gann — Market" : "Gann — Personal";

  const pivotCandleForCard =
    candleRes && candleRes.ok ? candleRes.candles.find((x) => x.label === "Pivot") ?? null : null;

  // Price marker: inverse of the Square-of-9 mapping used for targets (coherent)
  const priceMarkerDeg = useMemo(() => {
    if (mode !== "market") return null;
    if (!priceRes || !priceRes.ok) return null;

    const a = Number(anchorPrice);
    const p = Number(priceRes.price);
    if (!Number.isFinite(a) || a <= 0) return null;
    if (!Number.isFinite(p) || p <= 0) return null;

    const raw = (Math.sqrt(p) - Math.sqrt(a)) * 180;
    const deg = ((raw % 360) + 360) % 360;
    return deg;
  }, [mode, priceRes, anchorPrice]);

  return (
    <div style={pageStyle}>
      <div style={wrapStyle}>
        {/* Top bar */}
        <div style={topBarStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ opacity: 0.85 }}>Chart mode</span>

            <Segmented
              value={mode}
              options={[
                { value: "market", label: "Market" },
                { value: "personal", label: "Personal" },
              ]}
              onChange={(v) => setMode(v as Mode)}
            />
          </div>

          <button type="button" onClick={run} style={{ ...buttonStyle, paddingInline: 14 }}>
            {loading ? "Running…" : "Run"}
          </button>
        </div>

        <div style={gridStyle}>
          {/* Inputs */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>{cardTitle} Inputs</div>

            {mode === "market" ? (
              <>
                <Field label="Symbol (optional)">
                  <input value={symbol} onChange={(e) => setSymbol(e.target.value)} style={inputStyle} />
                </Field>

                {/* Current price (manual) */}
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(58,69,80,0.6)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, opacity: 0.9 }}>Current Price</div>
                    <button type="button" onClick={refreshCurrentPrice} style={buttonStyle} disabled={loadingPrice}>
                      {loadingPrice ? "Fetching…" : "Refresh"}
                    </button>
                  </div>

                  {priceRes?.ok ? (
                    <div style={{ ...miniCardStyle, marginTop: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12 }}>
                        <div style={{ fontWeight: 700 }}>{priceRes.symbol}</div>
                        <div style={{ opacity: 0.85 }}>{priceRes.provider}</div>
                      </div>

                      <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800 }}>{formatNum(priceRes.price)}</div>

                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                        As of {String(priceRes.asOfISO).slice(0, 19).replace("T", " ")}
                      </div>

                      {priceMarkerDeg != null ? (
                        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                          Price angle (relative to anchor): <strong>{formatNum(priceMarkerDeg)}°</strong>
                        </div>
                      ) : null}
                    </div>
                  ) : priceRes && !priceRes.ok ? (
                    <div style={{ ...errorStyle, marginTop: 10 }}>Price fetch error: {priceRes.error}</div>
                  ) : (
                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                      Change the symbol, then hit Refresh to fetch the price.
                    </div>
                  )}
                </div>

                <Field label="Anchor price (required)">
                  <input
                    value={anchorPrice}
                    onChange={(e) => setAnchorPrice(e.target.value)}
                    inputMode="decimal"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Tick size (rounding)">
                  <input
                    value={tickSize}
                    onChange={(e) => setTickSize(e.target.value)}
                    inputMode="decimal"
                    style={inputStyle}
                  />
                </Field>

                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(58,69,80,0.6)" }}>
                  <div style={{ fontWeight: 700, fontSize: 12, opacity: 0.9, marginBottom: 8 }}>
                    Market Marker (time → angle)
                  </div>

                  <Field label="Pivot date/time (local)">
                    <input
                      type="datetime-local"
                      value={pivotDateTime}
                      onChange={(e) => setPivotDateTime(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Market cycle length (days)">
                    <input
                      value={marketCycleDays}
                      onChange={(e) => setMarketCycleDays(e.target.value)}
                      inputMode="decimal"
                      style={inputStyle}
                    />
                  </Field>

                  {/* Pivot → anchor autofill */}
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontSize: 12, opacity: 0.85 }}>Auto-fill anchor from pivot (1D candle)</div>

                      <button type="button" onClick={autofillAnchorFromPivot} style={buttonStyle} disabled={loadingCandle}>
                        {loadingCandle ? "Fetching…" : "Auto-fill"}
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>Use</div>
                      <Segmented
                        value={pivotAnchorMode}
                        options={[
                          { value: "close", label: "Close" },
                          { value: "open", label: "Open" },
                          { value: "low", label: "Low" },
                          { value: "high", label: "High" },
                        ]}
                        onChange={(v) => setPivotAnchorMode(v as PivotAnchorMode)}
                      />
                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        Close/Open balance the read; High/Low are “extremes”.
                      </div>
                    </div>

                    {candleRes?.ok && pivotCandleForCard ? (
                      <div style={miniCardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12 }}>
                          <div style={{ fontWeight: 700 }}>{candleRes.symbol} • 1D</div>
                          <div style={{ opacity: 0.85 }}>
                            {candleRes.provider} • {candleRes.sessionDayYMD} ({candleRes.timezoneUsed})
                          </div>
                        </div>

                        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>{candleRes.bucketRule}</div>

                        <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12 }}>
                          <div>
                            O: <strong>{formatNum(pivotCandleForCard.o)}</strong>
                          </div>
                          <div>
                            H: <strong>{formatNum(pivotCandleForCard.h)}</strong>
                          </div>
                          <div>
                            L: <strong>{formatNum(pivotCandleForCard.l)}</strong>
                          </div>
                          <div>
                            C: <strong>{formatNum(pivotCandleForCard.c)}</strong>
                          </div>
                        </div>

                        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                          Selected anchor source: <strong>{pivotAnchorMode.toUpperCase()}</strong>
                        </div>
                      </div>
                    ) : candleRes && !candleRes.ok ? (
                      <div style={{ ...errorStyle }}>Candle fetch error: {candleRes.error}</div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Field label="Anchor date/time (local)">
                  <input
                    type="datetime-local"
                    value={anchorDateTime}
                    onChange={(e) => setAnchorDateTime(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Cycle length (days)">
                  <input
                    value={cycleDays}
                    onChange={(e) => setCycleDays(e.target.value)}
                    inputMode="decimal"
                    style={inputStyle}
                  />
                </Field>
              </>
            )}

            {res && !res.ok && (
              <div style={{ ...errorStyle, marginTop: 12 }}>
                Error: {res.error}
                {res.retryAfterSeconds ? ` (retry after ${res.retryAfterSeconds}s)` : null}
              </div>
            )}
          </div>

          {/* Visualization (Angle Ring + Square of 9) */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>Visuals</div>

            {res?.ok ? (
              <div style={{ padding: 0 }}>
                <AngleRing
                  angles={angles}
                  markerDeg={res.data?.markerDeg ?? null}
                  priceDeg={mode === "market" ? priceMarkerDeg : null}
                  subtitle={
                    mode === "market"
                      ? `Primary: Anchor ${formatNum(res.data.anchor)}${res.input.symbol ? ` (${res.input.symbol})` : ""}`
                      : `Primary: Now @ ${formatNum(res.data.markerDeg)}° of cycle`
                  }
                />

                {/* Square of 9 replaces the “second wheel” */}
                {mode === "market" ? (
                  <div style={{ padding: 12, paddingTop: 0 }}>
                    <SquareOfNinePanel
                      anchor={Number(anchorPrice)}
                      tickSize={Number(tickSize) || 0.01}
                      targets={Array.isArray(res.data?.targets) ? res.data.targets : []}
                      currentPrice={priceRes?.ok ? priceRes.price : null}
                    />
                  </div>
                ) : null}

                <div style={midNoteStyle}>
                  <div style={{ opacity: 0.9, fontWeight: 700, marginBottom: 6 }}>Time vs Price alignment</div>
                  <div>
                    Positive gap = <strong>time</strong> is ahead of <strong>price</strong> around the ring.
                  </div>
                  <div>
                    Negative gap = <strong>price</strong> is ahead of <strong>time</strong> around the ring.
                  </div>
                  <div style={{ marginTop: 6, opacity: 0.8 }}>
                    (If the gap is small, we label it <strong>IN SYNC</strong>.)
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ opacity: 0.8, padding: 12 }}>Run to generate the ring and outputs.</div>
            )}
          </div>

          {/* Outputs */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>Outputs</div>

            {res?.ok ? mode === "market" ? <TargetsPanel data={res.data} /> : <PersonalPanel data={res.data} /> : (
              <div style={{ opacity: 0.8, padding: 12 }}>Outputs appear here.</div>
            )}
          </div>
        </div>

        {/* Bottom: Auto Pivot Finder (manual run only) */}
        {mode === "market" ? (
          <div style={{ marginTop: 14 }}>
            <PivotAutoAnchorPanel
              kind={marketKind}
              symbol={symbol}
              tickSize={Number(tickSize) || 0.01}
              onApply={(p) => {
                if (p?.pivotLocalInput) setPivotDateTime(p.pivotLocalInput);

                // IMPORTANT: only “low/high” can be auto-selected from the scan result.
                // You can still choose Close/Open in the UI anytime.
                if (p?.anchorSource) setPivotAnchorMode(p.anchorSource);

                const t = Number(tickSize) || 0.01;
                const rounded = Math.round(Number(p.anchorPrice) / t) * t;
                setAnchorPrice(String(rounded.toFixed(decimalsFromTick(t))));

                setCandleRes(null);
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
