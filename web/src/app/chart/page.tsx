// src/app/chart/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Mode = "market" | "personal";

type Candle = {
  dayKey: string;
  label: "Prior" | "Pivot" | "Next";
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
};

type MarketCandleResp =
  | {
      ok: true;
      kind: "stock" | "crypto";
      symbol: string;
      pivotISO: string;
      provider: "polygon" | "coinbase";
      timezoneUsed: "America/New_York" | "UTC";
      bucketRule: string;
      sessionDayYMD: string;
      candles: Candle[];
      rawCount: number;
    }
  | { ok: false; error: string };

const DEFAULT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function parseAngles(s: string): number[] {
  const raw = s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n));
  const normalized = raw.map((d) => ((d % 360) + 360) % 360);
  // de-dupe + sort
  return Array.from(new Set(normalized)).sort((a, b) => a - b);
}

function roundToTick(price: number, tick: number) {
  if (!Number.isFinite(price) || !Number.isFinite(tick) || tick <= 0) return price;
  return Math.round(price / tick) * tick;
}

function fmt(n: number, dp = 4) {
  if (!Number.isFinite(n)) return "—";
  const d = clamp(dp, 0, 10);
  return n.toFixed(d);
}

function daysBetween(a: Date, b: Date) {
  return (a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Learning-first, basic model:
 * - Time origin = pivot datetime
 * - A cycle = N days maps to 360°
 * - MarkerDeg = where "now" lands on that 360° ring
 */
function computeMarkerDeg(now: Date, pivot: Date, cycleDays: number) {
  const d = daysBetween(now, pivot);
  const cycle = Math.max(1e-6, cycleDays);
  const frac = ((d % cycle) + cycle) % cycle / cycle;
  return frac * 360;
}

/**
 * Next time we hit each angle boundary, within current cycle (forward only).
 */
function computeNextBoundaryTimes(pivot: Date, now: Date, cycleDays: number, angles: number[]) {
  const marker = computeMarkerDeg(now, pivot, cycleDays);
  return angles.map((a) => {
    const deltaDeg = ((a - marker) % 360 + 360) % 360; // [0..360)
    const deltaDays = (deltaDeg / 360) * cycleDays;
    return {
      angle: a,
      inDays: deltaDays,
      when: addDays(now, deltaDays),
    };
  });
}

/**
 * Square-of-9 (very basic abstraction):
 * price(angle) = (sqrt(P) ± angle/180)^2
 * - 45° => ±0.25 step
 * - 90° => ±0.5 step
 * This is NOT "all of Gann"; it's the starter mapping we can learn with.
 */
function squareOf9Targets(anchorPrice: number, angles: number[], includeDownside: boolean) {
  const out: Array<{ angle: number; up: number; down?: number }> = [];
  const root = Math.sqrt(Math.max(0, anchorPrice));
  for (const a of angles) {
    const k = a / 180;
    const up = Math.pow(root + k, 2);
    const down = Math.pow(Math.max(0, root - k), 2);
    out.push({ angle: a, up, down: includeDownside ? down : undefined });
  }
  return out;
}

function Tooltip({
  label,
  tip,
  className = "",
}: {
  label: string;
  tip: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span>{label}</span>
      <span
        title={tip}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[10px] text-white/70"
      >
        ?
      </span>
    </span>
  );
}

function CandleRow({ c }: { c: Candle }) {
  return (
    <tr className="border-b border-white/10">
      <td className="py-2 pr-3 text-white/80 text-sm">{c.label}</td>
      <td className="py-2 pr-3 text-white/60 text-sm">{c.dayKey}</td>
      <td className="py-2 pr-3 text-white/80 text-sm tabular-nums">{fmt(c.o, 4)}</td>
      <td className="py-2 pr-3 text-white/80 text-sm tabular-nums">{fmt(c.h, 4)}</td>
      <td className="py-2 pr-3 text-white/80 text-sm tabular-nums">{fmt(c.l, 4)}</td>
      <td className="py-2 text-white/80 text-sm tabular-nums">{fmt(c.c, 4)}</td>
    </tr>
  );
}

function panelClass() {
  // keep it consistent with your moonstone vibe; adjust if your palette differs
  return "rounded-2xl border border-white/10 bg-black/35 backdrop-blur px-5 py-4";
}

export default function ChartPage() {
  const [mode, setMode] = useState<Mode>("market");

  // Market inputs
  const [symbol, setSymbol] = useState("LUNR");
  const [anchorPrice, setAnchorPrice] = useState<number>(0);
  const [tickSize, setTickSize] = useState<number>(0.01);
  const [anglesCsv, setAnglesCsv] = useState(DEFAULT_ANGLES.join(","));
  const [includeDownside, setIncludeDownside] = useState(true);
  const [pivotISO, setPivotISO] = useState<string>(() => {
    // default: today local noon-ish so it’s not blank
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    // datetime-local wants "YYYY-MM-DDTHH:mm"
    const pad = (n: number) => String(n).padStart(2, "0");
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${y}-${m}-${dd}T${hh}:${mm}`;
  });

  // Multi-cycle support (learning mode)
  const [cycle45On, setCycle45On] = useState(true);
  const [cycle90On, setCycle90On] = useState(true);

  // Pivot evidence
  const [evidence, setEvidence] = useState<MarketCandleResp | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [anchorFrom, setAnchorFrom] = useState<"low" | "high" | "close" | "open">("low");

  const angles = useMemo(() => parseAngles(anglesCsv), [anglesCsv]);

  const pivotDate = useMemo(() => {
    // pivotISO from datetime-local => interpret as local time
    // new Date("YYYY-MM-DDTHH:mm") is local in browsers
    const d = new Date(pivotISO);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [pivotISO]);

  const now = useMemo(() => new Date(), []);
  const [nowTick, setNowTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNowTick((x) => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const liveNow = useMemo(() => new Date(), [nowTick]);

  const enabledCycles = useMemo(() => {
    const arr: number[] = [];
    if (cycle45On) arr.push(45);
    if (cycle90On) arr.push(90);
    return arr;
  }, [cycle45On, cycle90On]);

  const cycleOutputs = useMemo(() => {
    if (mode !== "market") return [];
    return enabledCycles.map((cycleDays) => {
      const markerDeg = computeMarkerDeg(liveNow, pivotDate, cycleDays);
      const nextAngles = computeNextBoundaryTimes(pivotDate, liveNow, cycleDays, angles);

      const targetsRaw = squareOf9Targets(anchorPrice, angles, includeDownside);
      const targets = targetsRaw.map((t) => ({
        angle: t.angle,
        up: roundToTick(t.up, tickSize),
        down: t.down != null ? roundToTick(t.down, tickSize) : undefined,
      }));

      return { cycleDays, markerDeg, nextAngles, targets };
    });
  }, [mode, enabledCycles, liveNow, pivotDate, angles, anchorPrice, includeDownside, tickSize]);

  async function loadPivotEvidence() {
    setEvidenceLoading(true);
    setEvidence(null);
    try {
      // pivotISO here is local datetime-local; send full ISO with timezone offset so server can bucket
      const pivotFullISO = new Date(pivotISO).toISOString();
      const r = await fetch("/api/market-candle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, pivotISO: pivotFullISO }),
      });
      const j = (await r.json()) as MarketCandleResp;
      setEvidence(j);
    } catch (e: any) {
      setEvidence({ ok: false, error: e?.message ? String(e.message) : "Failed to load pivot evidence" });
    } finally {
      setEvidenceLoading(false);
    }
  }

  function applyAnchorFromEvidence(kind: "low" | "high" | "close" | "open") {
    if (!evidence || !evidence.ok) return;
    const pivot = evidence.candles.find((c) => c.label === "Pivot");
    if (!pivot) return;

    const raw =
      kind === "low" ? pivot.l :
      kind === "high" ? pivot.h :
      kind === "open" ? pivot.o :
      pivot.c;

    const snapped = roundToTick(raw, tickSize);
    setAnchorFrom(kind);
    setAnchorPrice(snapped);
  }

  const orientationCopy = (
    <div className="text-white/70 text-sm leading-relaxed">
      <div className="font-medium text-white/85 mb-2">
        Learning-first model (keep it basic)
      </div>
      <ul className="space-y-1">
        <li>
          <Tooltip
            label="Pivot = time origin"
            tip="The pivot sets 'day 0'. Everything on the cycle ring measures time from this moment."
          />{" "}
          (when the cycle starts)
        </li>
        <li>
          <Tooltip
            label="Anchor = price origin"
            tip="The anchor sets the starting price level for targets. If you change the anchor (Low/High/Open/Close), your entire target ladder shifts."
          />{" "}
          (where targets start)
        </li>
        <li>
          <Tooltip
            label="Cycle = N days → 360°"
            tip="We map N days onto a 360° ring. The marker is where 'now' lands on that ring."
          />{" "}
          (timing map)
        </li>
        <li>
          <Tooltip
            label="Angles = structure"
            tip="Angles are your reference lines: 0°,45°,90°... We only use them as 'boundaries to watch' for time + as labels for price targets."
          />{" "}
          (reference lines)
        </li>
      </ul>
      <div className="mt-3 text-white/60">
        Orientation reminder: <span className="text-white/80">0° West • 90° North • 180° East • 270° South</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-5 py-6">
      {/* Header */}
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-white text-2xl font-semibold tracking-tight">
              URA /chart — Gann (Modern, Learning-First)
            </div>
            <div className="text-white/60 text-sm mt-1">
              Build the mental model first. Add complexity only when it earns its place.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("market")}
              className={`px-3 py-2 rounded-xl border ${
                mode === "market" ? "border-white/25 bg-white/10 text-white" : "border-white/10 text-white/70"
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setMode("personal")}
              className={`px-3 py-2 rounded-xl border ${
                mode === "personal" ? "border-white/25 bg-white/10 text-white" : "border-white/10 text-white/70"
              }`}
            >
              Personal
            </button>
          </div>
        </div>

        {/* Layout: wider panels, less “long and skinny” */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left column: Inputs + learning copy */}
          <div className="lg:col-span-5 space-y-4">
            <div className={panelClass()}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-white font-medium">Inputs</div>
                <div className="text-white/50 text-xs">Basic first. No extra parts.</div>
              </div>

              {mode === "market" ? (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/60 text-xs mb-1">Symbol</label>
                      <input
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none"
                        placeholder="LUNR or SOL-USD"
                      />
                      <div className="text-white/45 text-[11px] mt-1">
                        Stocks: <span className="text-white/60">LUNR</span> • Crypto:{" "}
                        <span className="text-white/60">SOL-USD</span> (Coinbase product id)
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/60 text-xs mb-1">
                        <Tooltip
                          label="Pivot datetime (time origin)"
                          tip="For stocks, we bucket the pivot into the America/New_York session day to match TradingView. For crypto, we use UTC day buckets."
                        />
                      </label>
                      <input
                        type="datetime-local"
                        value={pivotISO}
                        onChange={(e) => setPivotISO(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none"
                      />
                      <div className="text-white/45 text-[11px] mt-1">
                        Pick the moment you want to treat as “day 0”.
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-white/60 text-xs mb-1">
                        <Tooltip
                          label="Anchor price (price origin)"
                          tip="This is the starting level for Square-of-9 targets. Changing anchor changes every target."
                        />
                      </label>
                      <input
                        value={anchorPrice === 0 ? "" : String(anchorPrice)}
                        onChange={(e) => setAnchorPrice(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none"
                        placeholder="Auto-fill from pivot"
                        inputMode="decimal"
                      />
                      <div className="text-white/45 text-[11px] mt-1">
                        Current source: <span className="text-white/70">{anchorFrom.toUpperCase()}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/60 text-xs mb-1">Tick size</label>
                      <input
                        value={String(tickSize)}
                        onChange={(e) => setTickSize(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none"
                        inputMode="decimal"
                      />
                      <div className="text-white/45 text-[11px] mt-1">We snap targets + auto-fill to this.</div>
                    </div>

                    <div className="flex items-end">
                      <label className="inline-flex items-center gap-2 text-white/70 text-sm select-none">
                        <input
                          type="checkbox"
                          checked={includeDownside}
                          onChange={(e) => setIncludeDownside(e.target.checked)}
                        />
                        Include downside targets
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/60 text-xs mb-1">
                      <Tooltip
                        label="Angles (structure lines)"
                        tip="Comma-separated degrees. Keep it simple: 0,45,90... We'll use these as time boundaries + price target labels."
                      />
                    </label>
                    <input
                      value={anglesCsv}
                      onChange={(e) => setAnglesCsv(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none"
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      onClick={loadPivotEvidence}
                      className="px-3 py-2 rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15"
                    >
                      {evidenceLoading ? "Loading..." : "Load pivot evidence (3 candles)"}
                    </button>

                    <div className="flex items-center gap-2 text-white/60 text-xs">
                      <span>Auto-fill anchor:</span>
                      <button
                        onClick={() => applyAnchorFromEvidence("low")}
                        className="px-2 py-1 rounded-lg border border-white/10 hover:bg-white/10 text-white/80"
                        title="Low = conservative anchor. Targets sit closer to price."
                      >
                        Low
                      </button>
                      <button
                        onClick={() => applyAnchorFromEvidence("high")}
                        className="px-2 py-1 rounded-lg border border-white/10 hover:bg-white/10 text-white/80"
                        title="High = aggressive anchor. Targets shift higher."
                      >
                        High
                      </button>
                      <button
                        onClick={() => applyAnchorFromEvidence("open")}
                        className="px-2 py-1 rounded-lg border border-white/10 hover:bg-white/10 text-white/80"
                        title="Open = session start anchor."
                      >
                        Open
                      </button>
                      <button
                        onClick={() => applyAnchorFromEvidence("close")}
                        className="px-2 py-1 rounded-lg border border-white/10 hover:bg-white/10 text-white/80"
                        title="Close = session settlement anchor."
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-white/70 text-sm font-medium mb-2">Cycles (learning mode)</div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-2 text-white/70 text-sm select-none">
                        <input
                          type="checkbox"
                          checked={cycle45On}
                          onChange={(e) => setCycle45On(e.target.checked)}
                        />
                        45-day
                      </label>
                      <label className="inline-flex items-center gap-2 text-white/70 text-sm select-none">
                        <input
                          type="checkbox"
                          checked={cycle90On}
                          onChange={(e) => setCycle90On(e.target.checked)}
                        />
                        90-day
                      </label>
                      <div className="text-white/45 text-[11px]">
                        Same model twice → compare timing + targets without adding new concepts.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-white/70 text-sm">
                  Personal mode stays minimal for now. When you’re ready, we’ll define what “pivot” and “anchor” mean in
                  a personal timeline without mixing in extra Gann components.
                </div>
              )}
            </div>

            <div className={panelClass()}>{orientationCopy}</div>

            {/* Pivot evidence panel */}
            <div className={panelClass()}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-white font-medium">Pivot evidence</div>
                <div className="text-white/50 text-xs">1 pivot day + prior + next</div>
              </div>

              {!evidence ? (
                <div className="mt-3 text-white/60 text-sm">
                  Load this to sanity-check your pivot choice. If the pivot candle doesn’t “look like a pivot,” your
                  whole model starts wobbly.
                </div>
              ) : !evidence.ok ? (
                <div className="mt-3 text-red-300 text-sm">{evidence.error}</div>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="text-white/70 text-sm">
                    <div>
                      Provider: <span className="text-white/85">{evidence.provider}</span>
                    </div>
                    <div>
                      Bucket rule: <span className="text-white/85">{evidence.bucketRule}</span>
                    </div>
                    <div>
                      Candle timezone: <span className="text-white/85">{evidence.timezoneUsed}</span>
                    </div>
                    <div>
                      Session day: <span className="text-white/85">{evidence.sessionDayYMD}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px]">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2 pr-3 text-white/50 text-xs font-medium">Role</th>
                          <th className="text-left py-2 pr-3 text-white/50 text-xs font-medium">Day</th>
                          <th className="text-left py-2 pr-3 text-white/50 text-xs font-medium">Open</th>
                          <th className="text-left py-2 pr-3 text-white/50 text-xs font-medium">High</th>
                          <th className="text-left py-2 pr-3 text-white/50 text-xs font-medium">Low</th>
                          <th className="text-left py-2 text-white/50 text-xs font-medium">Close</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evidence.candles.map((c) => (
                          <CandleRow key={`${c.label}-${c.dayKey}`} c={c} />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-white/60 text-sm leading-relaxed">
                    <div className="text-white/80 font-medium mb-1">Why OHLC choice changes the model</div>
                    <div>
                      The anchor is your <span className="text-white/80">price origin</span>. If you anchor on{" "}
                      <span className="text-white/80">Low</span>, targets sit “tighter” under price. If you anchor on{" "}
                      <span className="text-white/80">High</span>, the entire ladder shifts up.{" "}
                      <span className="text-white/80">Open/Close</span> are useful when you want the day’s “start” or
                      “settlement” to define your baseline.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Outputs (wider, stacked cards; cycles side-by-side on xl) */}
          <div className="lg:col-span-7 space-y-4">
            <div className={panelClass()}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-white font-medium">Outputs</div>
                <div className="text-white/50 text-xs">
                  Marker uses: {liveNow.toLocaleString()}
                </div>
              </div>

              {mode !== "market" ? (
                <div className="mt-3 text-white/60 text-sm">
                  Personal mode output will come later. We’ll keep the same 3 primitives (pivot/anchor/cycle) so you’re
                  not learning two different systems.
                </div>
              ) : enabledCycles.length === 0 ? (
                <div className="mt-3 text-white/60 text-sm">Enable at least one cycle (45 or 90) to see outputs.</div>
              ) : anchorPrice <= 0 ? (
                <div className="mt-3 text-white/60 text-sm">
                  Set an anchor price (or load pivot evidence and auto-fill from OHLC).
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {cycleOutputs.map((co) => (
                    <div key={co.cycleDays} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-white/90 font-medium">
                          {co.cycleDays}-day cycle
                        </div>
                        <div className="text-white/60 text-xs tabular-nums">
                          Marker: {fmt(co.markerDeg, 2)}°
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-white/70 text-sm font-medium mb-2">
                          Next angle boundaries (timing)
                        </div>
                        <div className="space-y-1">
                          {co.nextAngles.slice(0, Math.min(6, co.nextAngles.length)).map((x) => (
                            <div
                              key={`${co.cycleDays}-${x.angle}`}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <div className="text-white/75">
                                {x.angle}°
                              </div>
                              <div className="text-white/55 tabular-nums">
                                in {fmt(x.inDays, 2)}d
                              </div>
                              <div className="text-white/75">
                                {x.when.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                        {co.nextAngles.length > 6 && (
                          <div className="text-white/45 text-[11px] mt-2">
                            Showing first 6. Keep it uncluttered.
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="text-white/70 text-sm font-medium mb-2">
                          Square-of-9 targets (levels)
                        </div>
                        <div className="space-y-1">
                          {co.targets.slice(0, Math.min(8, co.targets.length)).map((t) => (
                            <div
                              key={`${co.cycleDays}-t-${t.angle}`}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <div className="text-white/75">{t.angle}°</div>
                              <div className="text-white/80 tabular-nums">
                                Up: {fmt(t.up, 4)}
                              </div>
                              {includeDownside ? (
                                <div className="text-white/60 tabular-nums">
                                  Down: {t.down != null ? fmt(t.down, 4) : "—"}
                                </div>
                              ) : (
                                <div className="text-white/45 text-xs">Downside off</div>
                              )}
                            </div>
                          ))}
                        </div>
                        {co.targets.length > 8 && (
                          <div className="text-white/45 text-[11px] mt-2">
                            Showing first 8. Expand later only if needed.
                          </div>
                        )}
                      </div>

                      <div className="mt-4 text-white/55 text-[12px] leading-relaxed">
                        <span className="text-white/75">How to use this card:</span>{" "}
                        Watch the next boundary times as “attention points” (timing), then check whether price is
                        reacting near the target stack (levels). Same angles, two cycles — compare which one aligns
                        cleaner before adding anything new.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Minimal “what to do next” guidance, still learning-first */}
            <div className={panelClass()}>
              <div className="text-white font-medium">Next steps (strict, basic)</div>
              <div className="mt-2 text-white/70 text-sm leading-relaxed">
                1) Pick a pivot you can defend with evidence (the 3-candle strip should “make sense”).{" "}
                <br />
                2) Choose an anchor on purpose (Low/High/Open/Close) and say why.{" "}
                <br />
                3) Run 45 vs 90 side-by-side. Don’t chase both — pick the one that behaves cleaner.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
