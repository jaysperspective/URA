// src/app/api/pivot-scan/route.ts
import { NextResponse } from "next/server";

type Timeframe = "1d" | "4h" | "1h";
type PivotType = "SWING_LOW" | "SWING_HIGH";

const COINBASE_BASE = "https://api.exchange.coinbase.com"; // public candles endpoint

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function tfToSeconds(tf: Timeframe) {
  if (tf === "1h") return 60 * 60;
  if (tf === "4h") return 4 * 60 * 60;
  return 24 * 60 * 60;
}

function tfToCoinbaseGranularity(tf: Timeframe) {
  // Coinbase accepted granularities: 60, 300, 900, 3600, 21600, 86400
  if (tf === "1h") return 3600;
  if (tf === "4h") return 21600;
  return 86400; // 1d
}

function normalizeCoinbaseProduct(symbol: string) {
  return symbol.trim().toUpperCase();
}

async function fetchCoinbaseCandles(params: {
  product: string;
  granularity: number;
  startISO: string;
  endISO: string;
}) {
  const { product, granularity, startISO, endISO } = params;

  const url = new URL(`${COINBASE_BASE}/products/${encodeURIComponent(product)}/candles`);
  url.searchParams.set("start", startISO);
  url.searchParams.set("end", endISO);
  url.searchParams.set("granularity", String(granularity));

  const r = await fetch(url.toString(), {
    method: "GET",
    headers: { "User-Agent": "URA" },
    cache: "no-store",
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Coinbase error: ${r.status} ${text}`);
  }

  // [ time, low, high, open, close, volume ] newest-first
  const raw = (await r.json()) as number[][];
  return raw;
}

type Candle = {
  t: string; // ISO
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
};

type Candidate = {
  idx: number;
  pivotISO: string;
  pivotType: PivotType;
  anchorSource: "low" | "high";
  anchorPrice: number; // raw, UI will round to tick size
  score: number; // 0..10
  breakdown: {
    legBirth: number; // 0..3
    structure: number; // 0..2
    followThrough: number; // 0..2
    timeFit: number; // 0..2
    sanity: number; // 0..1
  };
  notes: string[];
};

function isSwingLow(candles: Candle[], i: number, left = 2, right = 2) {
  const x = candles[i]?.l;
  if (x == null) return false;
  for (let k = i - left; k <= i + right; k++) {
    if (k === i) continue;
    if (candles[k] == null) return false;
    if (candles[k].l <= x) return false;
  }
  return true;
}

function isSwingHigh(candles: Candle[], i: number, left = 2, right = 2) {
  const x = candles[i]?.h;
  if (x == null) return false;
  for (let k = i - left; k <= i + right; k++) {
    if (k === i) continue;
    if (candles[k] == null) return false;
    if (candles[k].h >= x) return false;
  }
  return true;
}

// Helpers for scoring
function pctMove(from: number, to: number) {
  if (!Number.isFinite(from) || from === 0) return 0;
  return ((to - from) / Math.abs(from)) * 100;
}

function scoreCandidate(candles: Candle[], i: number, type: PivotType): Candidate {
  const c = candles[i];
  const notes: string[] = [];

  const next1 = candles[i + 1];
  const next5 = candles[i + 5];
  const next10 = candles[i + 10];
  const prev1 = candles[i - 1];
  const prev5 = candles[i - 5];

  // Basic direction expectation
  const wantsUp = type === "SWING_LOW";
  const anchorSource: "low" | "high" = wantsUp ? "low" : "high";
  const anchorPrice = wantsUp ? c.l : c.h;

  // ---------------- Leg Birth (0..3)
  let legBirth = 0;
  if (prev1 && next1) {
    const prevDir = prev1.c - prev1.o;
    const nextDir = next1.c - next1.o;

    // For swing low: prefer a down candle into pivot then up candle out.
    // For swing high: prefer up candle into pivot then down candle out.
    const goodFlip = wantsUp ? prevDir < 0 && nextDir > 0 : prevDir > 0 && nextDir < 0;

    if (goodFlip) legBirth = 2;

    // Strength: travel away within 5 bars
    if (next5) {
      const move = wantsUp ? pctMove(anchorPrice, next5.h) : pctMove(anchorPrice, next5.l);
      if (Math.abs(move) >= 6) legBirth = 3;
      else if (Math.abs(move) >= 3 && legBirth >= 2) legBirth = 2;
      else if (Math.abs(move) >= 1.5) legBirth = Math.max(legBirth, 1);
    } else {
      legBirth = Math.max(legBirth, 1);
    }

    if (!goodFlip) notes.push("Leg birth: weak flip (no clean reversal candle).");
  } else {
    legBirth = 1;
    notes.push("Leg birth: limited context near edges.");
  }

  // ---------------- Structure (0..2)
  // For swing low: look for a higher-low within next ~5–10 bars (micro-structure).
  // For swing high: look for a lower-high within next ~5–10 bars.
  let structure = 0;
  if (next5 && next10) {
    if (wantsUp) {
      // higher-low: the lowest low of bars i+1..i+10 should be > pivot low (or close)
      const lows = candles.slice(i + 1, i + 11).map((x) => x.l);
      const minLow = Math.min(...lows);
      if (minLow > c.l) structure = 2;
      else if (minLow >= c.l * 0.997) structure = 1; // tiny undercut allowed
    } else {
      const highs = candles.slice(i + 1, i + 11).map((x) => x.h);
      const maxHigh = Math.max(...highs);
      if (maxHigh < c.h) structure = 2;
      else if (maxHigh <= c.h * 1.003) structure = 1;
    }
  } else {
    structure = 1;
    notes.push("Structure: limited next 10 bars.");
  }

  if (structure === 0) notes.push("Structure: no confirmation (HL/LH not present).");

  // ---------------- Follow-through (0..2)
  let followThrough = 0;
  if (next10) {
    const move = wantsUp ? pctMove(anchorPrice, next10.h) : pctMove(anchorPrice, next10.l);
    if (Math.abs(move) >= 10) followThrough = 2;
    else if (Math.abs(move) >= 5) followThrough = 1;
  } else if (next5) {
    const move = wantsUp ? pctMove(anchorPrice, next5.h) : pctMove(anchorPrice, next5.l);
    if (Math.abs(move) >= 6) followThrough = 1;
  }

  if (followThrough === 0) notes.push("Follow-through: price didn’t travel meaningfully.");

  // ---------------- Time symmetry fit (0..2)
  // We’re just checking if there’s a recognizable 3-act: base (quiet) -> expansion -> stall.
  // Minimal but useful: expansion if 2..6 bars show range growth + later bars show slowing.
  let timeFit = 0;
  const w1 = candles.slice(i + 1, i + 6);
  const w2 = candles.slice(i + 6, i + 11);

  if (w1.length >= 4 && w2.length >= 4) {
    const r1 = w1.reduce((a, x) => a + (x.h - x.l), 0) / w1.length;
    const r2 = w2.reduce((a, x) => a + (x.h - x.l), 0) / w2.length;

    if (r2 > r1 * 1.15) timeFit = 1; // expansion
    if (r2 > r1 * 1.15) {
      // look for slowdown: last 3 bars smaller average range than expansion window
      const last3 = candles.slice(i + 11, i + 14);
      if (last3.length >= 3) {
        const r3 = last3.reduce((a, x) => a + (x.h - x.l), 0) / last3.length;
        if (r3 < r2 * 0.85) timeFit = 2;
      }
    }
  } else {
    timeFit = 1;
    notes.push("Time fit: limited bars for symmetry check.");
  }

  if (timeFit === 0) notes.push("Time fit: cycle shape not expressing cleanly yet.");

  // ---------------- Sanity (0..1)
  // Reject “messy” pivots: huge wick / news spike style bars.
  let sanity = 1;
  const body = Math.abs(c.c - c.o);
  const range = Math.max(1e-9, c.h - c.l);
  const bodyRatio = body / range;
  if (bodyRatio < 0.12) {
    sanity = 0;
    notes.push("Sanity: pivot candle is wick-dominant (spiky / less trustworthy).");
  }

  const score = legBirth + structure + followThrough + timeFit + sanity;

  return {
    idx: i,
    pivotISO: c.t,
    pivotType: type,
    anchorSource,
    anchorPrice,
    score,
    breakdown: { legBirth, structure, followThrough, timeFit, sanity },
    notes,
  };
}

function pickTopCandidates(candles: Candle[]) {
  const left = 2;
  const right = 2;

  const candidates: Candidate[] = [];
  for (let i = left; i < candles.length - right; i++) {
    if (isSwingLow(candles, i, left, right)) candidates.push(scoreCandidate(candles, i, "SWING_LOW"));
    if (isSwingHigh(candles, i, left, right)) candidates.push(scoreCandidate(candles, i, "SWING_HIGH"));
  }

  // Sort: score desc, then newer pivots slightly favored
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.idx - a.idx;
  });

  const top = candidates.slice(0, 12);
  const recommended = top[0] ?? null;

  return { candidates: top, recommended };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      symbol: string;
      kind?: "crypto" | "stock";
      timeframe?: Timeframe;
      lookbackBars?: number;
    };

    const symbol = String(body.symbol || "").trim();
    if (!symbol) return NextResponse.json({ ok: false, error: "symbol is required" }, { status: 400 });

    const timeframe: Timeframe = (body.timeframe as Timeframe) || "1d";
    const granularity = tfToCoinbaseGranularity(timeframe);

    // Coinbase: cap candles at 300
    const requestedBars = clamp(Number(body.lookbackBars ?? 180), 30, 300);
    const bars = requestedBars;

    const now = Date.now();
    const end = new Date(now);
    const secsPerBar = tfToSeconds(timeframe);
    const start = new Date(now - bars * secsPerBar * 1000);

    const startISO = start.toISOString();
    const endISO = end.toISOString();

    const product = normalizeCoinbaseProduct(symbol);

    const raw = await fetchCoinbaseCandles({ product, granularity, startISO, endISO });

    // Normalize -> oldest-first candles
    const candles: Candle[] = raw
      .slice()
      .reverse()
      .map((row) => {
        const [time, low, high, open, close, volume] = row;
        return {
          t: new Date(time * 1000).toISOString(),
          o: open,
          h: high,
          l: low,
          c: close,
          v: volume,
        };
      });

    const { candidates, recommended } = pickTopCandidates(candles);

    return NextResponse.json({
      ok: true,
      kind: "crypto" as const,
      provider: "coinbase" as const,
      symbol: product,
      timeframe,
      granularity,
      requestedBars,
      returnedBars: candles.length,
      startISO,
      endISO,
      candles,
      candidates,
      recommended,
      note:
        requestedBars >= 300
          ? "Coinbase limits candle aggregations; scan capped at 300 bars."
          : undefined,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "pivot scan failed" },
      { status: 500 }
    );
  }
}

