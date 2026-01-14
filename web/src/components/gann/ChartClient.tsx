// src/components/gann/ChartClient.tsx
"use client";

import React, { useMemo, useState, type CSSProperties } from "react";
import PivotAutoAnchorPanel from "@/components/PivotAutoAnchorPanel";
import SquareOfNinePanel from "@/components/SquareOfNinePanel";

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

type ScanRow = {
  symbol: string;
  provider?: "polygon" | "coinbase";
  kind?: "stock" | "crypto";

  pivotISO: string;
  anchorSource: PivotAnchorMode;
  anchor: number;
  price: number;
  asOfISO: string;

  timeDeg: number;
  priceDeg: number;
  gapUnsigned: number; // 0..360
  gapSignedAbs: number; // 0..180 (abs of signed diff)
  oppositionDist: number; // abs(gapUnsigned - 180) in [0..180]
  leadLabel: "IN SYNC" | "TIME LEADS" | "PRICE LEADS";
};

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

  // Infer market kind from symbol.
  const marketKind = useMemo<"crypto" | "stock">(() => {
    const s = (symbol || "").toUpperCase();
    if (s.includes("BTC") || s.includes("ETH") || s.includes("SOL") || s.includes("-USD")) return "crypto";
    return "stock";
  }, [symbol]);

  // ✅ run can take overrides so the scanner can "load" a row and run deterministically
  async function run(overrides?: Partial<{
    mode: Mode;
    symbol: string;
    anchorPrice: string;
    tickSize: string;
    pivotDateTime: string;
    marketCycleDays: string;
    anchorDateTime: string;
    cycleDays: string;
  }>) {
    setLoading(true);
    setRes(null);

    try {
      const m = overrides?.mode ?? mode;

      const payload =
        m === "market"
          ? {
              mode: m,
              symbol: (overrides?.symbol ?? symbol).trim() || undefined,
              anchor: Number(overrides?.anchorPrice ?? anchorPrice),
              tickSize: Number(overrides?.tickSize ?? tickSize),
              angles,
              includeDownside: ALWAYS_INCLUDE_DOWNSIDE,
              pivotDateTime: overrides?.pivotDateTime ?? pivotDateTime,
              cycleDays: Number(overrides?.marketCycleDays ?? marketCycleDays),
            }
          : {
              mode: m,
              anchorDateTime: overrides?.anchorDateTime ?? anchorDateTime,
              cycleDays: Number(overrides?.cycleDays ?? cycleDays),
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

    const raw = (Math.sqrt(p) - Math.sqrt(a)) * 180; // can be negative
    const deg = ((raw % 360) + 360) % 360;
    return deg;
  }, [mode, priceRes, anchorPrice]);

  // TS-safe escape hatch (prevents props mismatch if your existing SquareOfNinePanel has a different Props type)
  const SquareOfNineAny = SquareOfNinePanel as any;

  // ---------- Opposition Scanner state ----------
  const [scanSymbolsText, setScanSymbolsText] = useState("LUNR, AAPL, MSFT, TSLA, NVDA");
  const [scanTolDeg, setScanTolDeg] = useState("5");
  const [scanMax, setScanMax] = useState("15");
  const [scanRows, setScanRows] = useState<ScanRow[]>([]);
  const [scanErr, setScanErr] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // derive time angle from last run if available; otherwise compute locally
  const timeDegForScan = useMemo(() => {
    if (mode !== "market") return null;
    const fromRun = res?.ok ? Number((res as any).data?.markerDeg) : NaN;
    if (Number.isFinite(fromRun)) return fromRun;
    // fallback
    const pdt = pivotDateTime;
    const cyc = Number(marketCycleDays);
    if (!pdt || !Number.isFinite(cyc) || cyc <= 0) return null;
    const pivotMs = new Date(pdt).getTime();
    if (!Number.isFinite(pivotMs)) return null;
    const nowMs = Date.now();
    const deltaDays = (nowMs - pivotMs) / (1000 * 60 * 60 * 24);
    const prog01 = ((deltaDays % cyc) + cyc) % cyc / cyc; // 0..1
    return prog01 * 360;
  }, [mode, res, pivotDateTime, marketCycleDays]);

  async function scanOppositions() {
    setScanErr(null);
    setScanRows([]);
    if (mode !== "market") {
      setScanErr("Scanner is available in Market mode only.");
      return;
    }
    if (!pivotDateTime) {
      setScanErr("Pivot date/time is required.");
      return;
    }
    const tol = Number(scanTolDeg);
    if (!Number.isFinite(tol) || tol <= 0 || tol > 45) {
      setScanErr("Tolerance must be a number between 0 and 45.");
      return;
    }
    const maxN = Math.max(1, Math.min(200, Math.floor(Number(scanMax) || 15)));

    const timeDeg = timeDegForScan;
    if (timeDeg == null) {
      setScanErr("Could not determine time angle. Run the chart once, or check pivot/cycle inputs.");
      return;
    }

    const symbols = parseSymbols(scanSymbolsText).slice(0, maxN);
    if (!symbols.length) {
      setScanErr("Enter at least one symbol.");
      return;
    }

    setScanning(true);

    try {
      const pivotISO = new Date(pivotDateTime).toISOString();
      const t = Number(tickSize) || 0.01;

      const out: ScanRow[] = [];

      // lightweight throttle to avoid your /api/gann and market endpoints limiter
      for (let i = 0; i < symbols.length; i++) {
        const sym = symbols[i];

        // 1) pivot candle → anchor
        const candle = await fetch("/api/market-candle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol: sym, pivotISO }),
        }).then((r) => r.json() as Promise<CandleResponse>);

        if (!candle.ok) {
          // keep going, but record as error row? We'll skip hard fails to keep results clean.
          await sleep(120);
          continue;
        }

        const pivot = candle.candles.find((x) => x.label === "Pivot");
        if (!pivot) {
          await sleep(120);
          continue;
        }

        const picked =
          pivotAnchorMode === "low"
            ? pivot.l
            : pivotAnchorMode === "high"
            ? pivot.h
            : pivotAnchorMode === "open"
            ? pivot.o
            : pivot.c;

        const anchor = roundToTick(picked, t);

        // 2) current price
        const price = await fetch("/api/market-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol: sym }),
        }).then((r) => r.json() as Promise<MarketPriceResponse>);

        if (!price.ok) {
          await sleep(120);
          continue;
        }

        // 3) angles
        const priceDeg = computePriceAngleDeg(anchor, price.price);
        if (priceDeg == null) {
          await sleep(120);
          continue;
        }

        const gapUnsigned = norm360(timeDeg - priceDeg); // 0..360
        const gapSigned = signedAngleDiffDeg(timeDeg, priceDeg); // (-180,180]
        const gapSignedAbs = Math.abs(gapSigned);
        const lead = getLeadReadout(timeDeg, priceDeg, SYNC_TOL_DEG)?.label ?? "IN SYNC";
        const oppositionDist = Math.abs(gapUnsigned - 180); // 0..180

        if (oppositionDist <= tol) {
          out.push({
            symbol: sym,
            provider: price.provider,
            kind: price.kind,
            pivotISO,
            anchorSource: pivotAnchorMode,
            anchor,
            price: price.price,
            asOfISO: price.asOfISO,
            timeDeg,
            priceDeg,
            gapUnsigned,
            gapSignedAbs,
            oppositionDist,
            leadLabel: lead,
          });
        }

        // minor throttle
        await sleep(140);
      }

      // sort: tightest opposition first
      out.sort((a, b) => a.oppositionDist - b.oppositionDist);

      setScanRows(out);
      if (!out.length) setScanErr(`No matches within ±${formatNum(tol)}° of opposition.`);
    } catch (e: any) {
      setScanErr(e?.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function loadScanRow(row: ScanRow) {
    // apply to main inputs + price card, then run
    setMode("market");
    setSymbol(row.symbol);
    setAnchorPrice(String(row.anchor.toFixed(decimalsFromTick(Number(tickSize) || 0.01))));

    // put fetched price into the current price card immediately
    setPriceRes({
      ok: true,
      kind: row.kind ?? "stock",
      provider: row.provider ?? "polygon",
      symbol: row.symbol,
      price: row.price,
      asOfISO: row.asOfISO,
    });

    // (optional) clear candle card so it doesn't look mismatched
    setCandleRes(null);

    // run with explicit overrides so we don't race React state timing
    await run({
      mode: "market",
      symbol: row.symbol,
      anchorPrice: String(row.anchor),
      tickSize,
      pivotDateTime,
      marketCycleDays,
    });
  }

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

          <button type="button" onClick={() => run()} style={{ ...buttonStyle, paddingInline: 14 }}>
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

                      <button
                        type="button"
                        onClick={autofillAnchorFromPivot}
                        style={buttonStyle}
                        disabled={loadingCandle}
                      >
                        {loadingCandle ? "Fetching…" : "Auto-fill"}
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>Use</div>
                      <Segmented
                        value={pivotAnchorMode}
                        options={[
                          { value: "low", label: "Low" },
                          { value: "high", label: "High" },
                          { value: "close", label: "Close" },
                          { value: "open", label: "Open" },
                        ]}
                        onChange={(v) => setPivotAnchorMode(v as PivotAnchorMode)}
                      />
                      <div style={{ fontSize: 12, opacity: 0.75 }}>(Low = swing-low pivot, High = swing-high pivot)</div>
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

          {/* Visuals */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>Angle Ring</div>

            {res?.ok ? (
              <div style={{ padding: 0 }}>
                <AngleRing
                  angles={angles}
                  markerDeg={res.data?.markerDeg ?? null}
                  priceDeg={mode === "market" ? priceMarkerDeg : null}
                  subtitle={
                    mode === "market"
                      ? `Primary (run): Anchor ${formatNum(res.data.anchor)}${res.input.symbol ? ` (${res.input.symbol})` : ""}`
                      : `Primary: Now @ ${formatNum(res.data.markerDeg)}° of cycle`
                  }
                />

                {mode === "market" ? (
                  <div style={{ padding: 12, paddingTop: 0 }}>
                    <div style={panelSubHeaderStyle}>Square of 9</div>
                    <SquareOfNineAny
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

            {res?.ok ? (
              mode === "market" ? (
                <TargetsPanel data={res.data} />
              ) : (
                <PersonalPanel data={res.data} />
              )
            ) : (
              <div style={{ opacity: 0.8, padding: 12 }}>Outputs appear here.</div>
            )}
          </div>
        </div>

        {/* ✅ NEW: Scanner module under what's already on the page */}
        {mode === "market" ? (
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>Opposition Scanner (time ↔ price)</div>

            <div style={{ padding: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.6fr 0.6fr auto", gap: 10 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Symbols (comma or space separated)</div>
                  <input
                    value={scanSymbolsText}
                    onChange={(e) => setScanSymbolsText(e.target.value)}
                    style={inputStyle}
                    placeholder="LUNR, AAPL, MSFT..."
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Tolerance (°)</div>
                  <input
                    value={scanTolDeg}
                    onChange={(e) => setScanTolDeg(e.target.value)}
                    inputMode="decimal"
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Max symbols</div>
                  <input
                    value={scanMax}
                    onChange={(e) => setScanMax(e.target.value)}
                    inputMode="numeric"
                    style={inputStyle}
                  />
                </label>

                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
                  <button type="button" onClick={scanOppositions} style={buttonStyle} disabled={scanning}>
                    {scanning ? "Scanning…" : "Scan"}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8, lineHeight: 1.4 }}>
                Uses current pivot/time settings:
                <strong> {pivotDateTime}</strong> • cycle <strong>{marketCycleDays}</strong> days • anchor source{" "}
                <strong>{pivotAnchorMode.toUpperCase()}</strong>.
                {timeDegForScan != null ? (
                  <>
                    {" "}
                    Time angle: <strong>{formatNum(timeDegForScan)}°</strong>
                  </>
                ) : null}
              </div>

              {scanErr ? <div style={{ ...errorStyle, marginTop: 12 }}>{scanErr}</div> : null}

              {scanRows.length ? (
                <div style={{ marginTop: 12 }}>
                  <div style={panelSubHeaderStyle}>
                    Matches (within ±{formatNum(Number(scanTolDeg) || 5)}° of 180°)
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Symbol</th>
                          <th style={thStyle}>Price</th>
                          <th style={thStyle}>Anchor</th>
                          <th style={thStyle}>Time°</th>
                          <th style={thStyle}>Price°</th>
                          <th style={thStyle}>Gap</th>
                          <th style={thStyle}>|gap−180|</th>
                          <th style={thStyle}>Lead</th>
                          <th style={thStyle}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {scanRows.map((r) => (
                          <tr key={r.symbol}>
                            <td style={tdStyle}>
                              <div style={{ fontWeight: 800 }}>{r.symbol}</div>
                              <div style={{ fontSize: 11, opacity: 0.7 }}>
                                {r.provider} • {String(r.asOfISO).slice(0, 19).replace("T", " ")}
                              </div>
                            </td>
                            <td style={tdStyle}>{formatNum(r.price)}</td>
                            <td style={tdStyle}>{formatNum(r.anchor)}</td>
                            <td style={tdStyle}>{formatNum(r.timeDeg)}°</td>
                            <td style={tdStyle}>{formatNum(r.priceDeg)}°</td>
                            <td style={tdStyle}>{formatNum(r.gapUnsigned)}°</td>
                            <td style={tdStyle}>
                              <strong>{formatNum(r.oppositionDist)}°</strong>
                            </td>
                            <td style={tdStyle}>{r.leadLabel}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                              <button type="button" style={buttonStyle} onClick={() => loadScanRow(r)}>
                                Load
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                    Read: you’re finding **markets under maximum angular tension** (time vs price near opposition).
                    “Load” injects the symbol+anchor+price into the main model and runs it.
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Bottom: Auto Pivot Finder (manual run only) */}
        {mode === "market" ? (
          <div style={{ marginTop: 14 }}>
            <PivotAutoAnchorPanel
              kind={marketKind}
              symbol={symbol}
              tickSize={Number(tickSize) || 0.01}
              onApply={(p) => {
                if (p?.pivotLocalInput) setPivotDateTime(p.pivotLocalInput);
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

/* -------------------- UI Components -------------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
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
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{ ...segBtnStyle, ...(active ? segBtnActiveStyle : null) }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function AngleRing({
  angles,
  markerDeg,
  priceDeg,
  subtitle,
}: {
  angles: number[];
  markerDeg: number | null;
  priceDeg?: number | null;
  subtitle?: string;
}) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 120;

  const quadrantWedges = [
    { start: 0, end: 90, opacity: 0.10 },
    { start: 90, end: 180, opacity: 0.06 },
    { start: 180, end: 270, opacity: 0.10 },
    { start: 270, end: 360, opacity: 0.06 },
  ];

  const spokes = angles.map((deg) => {
    const p = polarToXY_West0_CW(cx, cy, r, deg);
    return { deg, x2: p.x, y2: p.y };
  });

  const marker = markerDeg == null ? null : polarToXY_West0_CW(cx, cy, r, markerDeg);
  const priceMarker = priceDeg == null ? null : polarToXY_West0_CW(cx, cy, r, priceDeg);

  const lead = getLeadReadout(markerDeg, priceDeg, SYNC_TOL_DEG);

  return (
    <div style={{ padding: 12 }}>
      {subtitle ? <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>{subtitle}</div> : null}

      <svg width={size} height={size} style={{ display: "block", margin: "0 auto" }}>
        {quadrantWedges.map((q) => (
          <path
            key={`${q.start}-${q.end}`}
            d={wedgePath(cx, cy, r, q.start, q.end)}
            fill={`rgba(237,227,204,${q.opacity})`}
            stroke="none"
          />
        ))}

        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(237,227,204,0.25)" strokeWidth={2} />

        {spokes.map((s) => (
          <g key={s.deg}>
            <line x1={cx} y1={cy} x2={s.x2} y2={s.y2} stroke="rgba(237,227,204,0.15)" strokeWidth={2} />
            <text
              x={cx + (s.x2 - cx) * 1.12}
              y={cy + (s.y2 - cy) * 1.12}
              fill="rgba(237,227,204,0.8)"
              fontSize={11}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {s.deg}°
            </text>
          </g>
        ))}

        {/* time marker (circle) */}
        {marker ? (
          <>
            <circle cx={marker.x} cy={marker.y} r={6} fill="rgba(237,227,204,0.95)" />
            <circle cx={marker.x} cy={marker.y} r={10} fill="none" stroke="rgba(237,227,204,0.35)" />
          </>
        ) : null}

        {/* price marker (diamond) */}
        {priceMarker ? (
          <path
            d={diamondPath(priceMarker.x, priceMarker.y, 7)}
            fill="rgba(237,227,204,0.35)"
            stroke="rgba(237,227,204,0.85)"
            strokeWidth={1.5}
          />
        ) : null}

        <circle cx={cx} cy={cy} r={3} fill="rgba(237,227,204,0.55)" />
      </svg>

      <div style={{ fontSize: 12, opacity: 0.85, textAlign: "center", marginTop: 10 }}>
        {markerDeg == null ? "Time appears after run." : `Time: ${formatNum(markerDeg)}°`}
      </div>

      {priceDeg != null ? (
        <div style={{ fontSize: 12, opacity: 0.75, textAlign: "center", marginTop: 6 }}>
          Price: {formatNum(priceDeg)}°
        </div>
      ) : null}

      {lead ? (
        <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>
          <div style={leadPillStyle}>
            <span style={{ fontWeight: 800 }}>{lead.label}</span>
            <span style={{ opacity: 0.85 }}> • gap </span>
            <span style={{ fontWeight: 800 }}>{formatNum(lead.gapDeg)}°</span>
          </div>
        </div>
      ) : null}

      <div style={{ fontSize: 11, opacity: 0.65, textAlign: "center", marginTop: 8 }}>
        0° West • 90° North • 180° East • 270° South
      </div>
    </div>
  );
}

function TargetsPanel({ data }: { data: any }) {
  const markerOk = typeof data.markerDeg === "number" && Number.isFinite(data.markerDeg);

  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 12, opacity: 0.85 }}>
        Anchor: <strong>{formatNum(data.anchor)}</strong>
      </div>

      {markerOk ? (
        <div style={miniCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 600 }}>Market marker</div>
            <div style={{ opacity: 0.85 }}>{formatNum(data.markerDeg)}°</div>
          </div>

          {Array.isArray(data.nextBoundaries) && data.nextBoundaries.length ? (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {data.nextBoundaries.slice(0, 4).map((b: any) => (
                <div
                  key={b.angle}
                  style={{ fontSize: 12, opacity: 0.9, display: "flex", justifyContent: "space-between", gap: 10 }}
                >
                  <span>{b.angle}° next</span>
                  <span>
                    {String(b.at).slice(0, 19).replace("T", " ")} ({b.inHours}h)
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(data.targets ?? []).map((t: any) => (
          <div key={t.angle} style={miniCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 600 }}>{t.angle}°</div>
              <div style={{ opacity: 0.85 }}>Δ√ = {formatNum(t.deltaSqrt)}</div>
            </div>

            <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12 }}>
              <div>
                Up: <strong>{formatNum(t.up)}</strong>
              </div>
              <div>
                Down: <strong>{formatNum(t.down)}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={helpStyle}>
        Basic read: angles are “structure.” The marker is “timing.” Targets are “levels.” You’re watching where timing +
        levels converge.
      </div>
    </div>
  );
}

function PersonalPanel({ data }: { data: any }) {
  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 12, opacity: 0.85 }}>
        Anchor: <strong>{String(data.anchorDateTime)}</strong>
      </div>
      <div style={{ fontSize: 12, opacity: 0.85 }}>
        Cycle: <strong>{formatNum(data.cycleDays)}</strong> days
      </div>

      <div style={miniCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontWeight: 600 }}>Now position</div>
          <div style={{ opacity: 0.85 }}>{formatNum(data.markerDeg)}°</div>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
          Cycle progress: <strong>{Math.round((data.progress01 ?? 0) * 100)}%</strong>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(data.nextBoundaries ?? []).map((b: any) => (
          <div key={b.angle} style={miniCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 600 }}>{b.angle}° next</div>
              <div style={{ opacity: 0.85 }}>{String(b.at)}</div>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
              In: <strong>{b.inHours}</strong> hours
            </div>
          </div>
        ))}
      </div>

      <div style={helpStyle}>Personal use: you’re tracking context shifts as you cross key angles.</div>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

// parse "LUNR, AAPL MSFT" → ["LUNR","AAPL","MSFT"]
function parseSymbols(s: string) {
  return (s || "")
    .replace(/\n/g, " ")
    .split(/[, ]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.toUpperCase());
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function norm360(x: number) {
  let a = x % 360;
  if (a < 0) a += 360;
  return a;
}

function roundToTick(value: number, tick: number) {
  if (!Number.isFinite(value) || !Number.isFinite(tick) || tick <= 0) return value;
  return Math.round(value / tick) * tick;
}

// price angle relative to anchor using your current mapping
function computePriceAngleDeg(anchor: number, price: number) {
  if (!Number.isFinite(anchor) || anchor <= 0) return null;
  if (!Number.isFinite(price) || price <= 0) return null;
  const raw = (Math.sqrt(price) - Math.sqrt(anchor)) * 180;
  return norm360(raw);
}

// shortest signed diff a-b in (-180,180]
function signedAngleDiffDeg(a: number, b: number) {
  const d = ((a - b + 540) % 360) - 180;
  return d === -180 ? 180 : d;
}

function getLeadReadout(timeDeg: number | null, priceDeg: number | null | undefined, tolDeg: number) {
  if (timeDeg == null || priceDeg == null) return null;
  if (!Number.isFinite(timeDeg) || !Number.isFinite(priceDeg)) return null;

  const d = signedAngleDiffDeg(timeDeg, priceDeg); // + means time ahead of price (clockwise)
  const abs = Math.abs(d);

  if (abs <= tolDeg) return { label: "IN SYNC" as const, gapDeg: abs };
  if (d > 0) return { label: "TIME LEADS;".replace(";", "") as const, gapDeg: abs };
  return { label: "PRICE LEADS" as const, gapDeg: abs };
}

function polarToXY_West0_CW(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg + 180) * Math.PI) / 180;
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
}

function wedgePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const p1 = polarToXY_West0_CW(cx, cy, r, startDeg);
  const p2 = polarToXY_West0_CW(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;

  return [`M ${cx} ${cy}`, `L ${p1.x} ${p1.y}`, `A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y}`, "Z"].join(" ");
}

function diamondPath(x: number, y: number, r: number) {
  return `M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z`;
}

function formatNum(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return String(n);
  return x.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function decimalsFromTick(tick: number) {
  const s = String(tick);
  const i = s.indexOf(".");
  return i === -1 ? 0 : Math.min(12, s.length - i - 1);
}

/* -------------------- Styles -------------------- */

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#1B1F24",
  padding: "24px 12px",
  display: "flex",
  justifyContent: "center",
  color: "#EDE3CC",
  fontFamily: "system-ui",
};

const wrapStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1100,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  background: "#222933",
  borderRadius: 16,
  padding: "12px 14px",
  border: "1px solid rgba(58,69,80,0.9)",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1.2fr 1fr",
  gap: 14,
};

const panelStyle: CSSProperties = {
  background: "#243039",
  borderRadius: 20,
  border: "1px solid rgba(58,69,80,0.9)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
  overflow: "hidden",
};

const panelHeaderStyle: CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid rgba(58,69,80,0.6)",
  fontWeight: 700,
  letterSpacing: 0.2,
};

const panelSubHeaderStyle: CSSProperties = {
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid rgba(58,69,80,0.6)",
  background: "rgba(0,0,0,0.14)",
  fontWeight: 700,
  fontSize: 12,
  opacity: 0.95,
  marginBottom: 10,
};

const inputStyle: CSSProperties = {
  background: "#1B1F24",
  border: "1px solid #3a4550",
  borderRadius: 8,
  padding: "8px 10px",
  color: "#EDE3CC",
  fontSize: 13,
  outline: "none",
};

const buttonStyle: CSSProperties = {
  background: "transparent",
  border: "1px solid #3a4550",
  borderRadius: 999,
  padding: "7px 12px",
  color: "#EDE3CC",
  fontSize: 12,
  cursor: "pointer",
};

const segWrapStyle: CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(58,69,80,0.9)",
  borderRadius: 999,
  overflow: "hidden",
};

const segBtnStyle: CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#EDE3CC",
  padding: "8px 12px",
  fontSize: 12,
  cursor: "pointer",
  opacity: 0.8,
};

const segBtnActiveStyle: CSSProperties = {
  background: "rgba(237,227,204,0.12)",
  opacity: 1,
};

const helpStyle: CSSProperties = {
  marginTop: 12,
  fontSize: 12,
  lineHeight: 1.4,
  opacity: 0.85,
};

const miniCardStyle: CSSProperties = {
  background: "rgba(0,0,0,0.18)",
  border: "1px solid rgba(58,69,80,0.6)",
  borderRadius: 14,
  padding: 12,
};

const errorStyle: CSSProperties = {
  background: "rgba(255, 80, 80, 0.12)",
  border: "1px solid rgba(255, 80, 80, 0.35)",
  borderRadius: 12,
  padding: 10,
  color: "#FFB0B0",
};

const leadPillStyle: CSSProperties = {
  display: "inline-flex",
  gap: 6,
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(237,227,204,0.22)",
  background: "rgba(0,0,0,0.16)",
  fontSize: 12,
  color: "#EDE3CC",
};

const midNoteStyle: CSSProperties = {
  margin: 12,
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(58,69,80,0.6)",
  background: "rgba(0,0,0,0.14)",
  fontSize: 12,
  lineHeight: 1.45,
  color: "#EDE3CC",
  opacity: 0.9,
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "1px solid rgba(58,69,80,0.6)",
  opacity: 0.85,
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "10px 8px",
  borderBottom: "1px solid rgba(58,69,80,0.35)",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};
