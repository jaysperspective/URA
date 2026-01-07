// src/lib/pivot/autoPivot.ts
import type { OHLCV } from "@/lib/marketData";

export type PivotType = "swingLow" | "swingHigh";

export type PivotCandidate = {
  idx: number;
  t: number;     // ms epoch
  price: number; // pivot price
  type: PivotType;
};

export type AutoPivotResult = {
  best: ScoredPivot;
  top: ScoredPivot[];
  meta: {
    nBars: number;
    evalBars: number;
    lookbackBars: number;
  };
};

export type ScoreState = {
  legBirth: 0 | 1 | 2 | 3;      // 0–3
  structure: 0 | 1 | 2;        // 0–2
  followThrough: 0 | 1 | 2;     // 0–2
  timeFit: 0 | 1 | 2;           // 0–2
  sanity: 0 | 1;                // 0–1
};

export type ScoredPivot = {
  pivot: PivotCandidate;
  score01: number;            // 0..1 (internal)
  total10: number;            // 0..10 (mapped)
  state: ScoreState;
  reasons: string[];
  diagnostics: {
    moveAwayPct: number;
    structureOk: boolean;
    timeHits: number;
  };
};

/**
 * Simple fractal pivots:
 * swingHigh if high[i] is max over window i-n..i+n
 * swingLow if low[i] is min over window i-n..i+n
 */
export function fractalCandidates(bars: OHLCV[], n = 2): PivotCandidate[] {
  const out: PivotCandidate[] = [];
  for (let i = n; i < bars.length - n; i++) {
    let isHigh = true;
    let isLow = true;

    const hi = bars[i].h;
    const lo = bars[i].l;

    for (let k = i - n; k <= i + n; k++) {
      if (bars[k].h > hi) isHigh = false;
      if (bars[k].l < lo) isLow = false;
      if (!isHigh && !isLow) break;
    }

    if (isHigh) out.push({ idx: i, t: bars[i].t, price: hi, type: "swingHigh" });
    if (isLow) out.push({ idx: i, t: bars[i].t, price: lo, type: "swingLow" });
  }
  return out;
}

/** True range ATR (Wilder-ish). */
export function atr(bars: OHLCV[], period = 14): number[] {
  const tr: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    const prevC = i > 0 ? bars[i - 1].c : bars[i].c;
    const r1 = bars[i].h - bars[i].l;
    const r2 = Math.abs(bars[i].h - prevC);
    const r3 = Math.abs(bars[i].l - prevC);
    tr.push(Math.max(r1, r2, r3));
  }

  const out: number[] = new Array(bars.length).fill(0);
  let sum = 0;

  for (let i = 0; i < bars.length; i++) {
    sum += tr[i];
    if (i >= period) sum -= tr[i - period];
    const denom = Math.min(i + 1, period);
    out[i] = sum / denom;
  }
  return out;
}

/**
 * Time-cycle “hits”: check whether local turns occur near cycle counts.
 * We keep it simple: find local extrema after pivot and see if they cluster near these counts.
 */
const DEFAULT_COUNTS = [30, 45, 60, 90, 120, 144, 180, 360];

function localTurns(bars: OHLCV[], startIdx: number, endIdx: number): number[] {
  // return indices of simple turns where direction flips (close-based)
  const idxs: number[] = [];
  for (let i = Math.max(startIdx + 2, 2); i < Math.min(endIdx, bars.length - 2); i++) {
    const a = bars[i - 1].c - bars[i - 2].c;
    const b = bars[i].c - bars[i - 1].c;
    const c = bars[i + 1].c - bars[i].c;
    if (Math.sign(a) === Math.sign(b) && Math.sign(b) !== Math.sign(c)) {
      idxs.push(i);
    }
  }
  return idxs;
}

function countTimeHits(pivotIdx: number, turns: number[], toleranceBars: number): number {
  let hits = 0;
  for (const tIdx of turns) {
    const dt = tIdx - pivotIdx;
    for (const c of DEFAULT_COUNTS) {
      if (Math.abs(dt - c) <= toleranceBars) {
        hits++;
        break;
      }
    }
  }
  return hits;
}

function pct(a: number, b: number) {
  if (a === 0) return 0;
  return (b - a) / a;
}

/**
 * Score pivot based on:
 * - legBirth: immediate reversal strength away from pivot
 * - structure: HL/LH confirmation within a window
 * - followThrough: distance traveled
 * - timeFit: time-count clustering of turns
 * - sanity: avoid pivots too close to edges / too noisy
 */
export function scorePivot(params: {
  bars: OHLCV[];
  atrArr: number[];
  cand: PivotCandidate;
  evalBars: number;         // e.g. 120
  structureBars: number;    // e.g. 10
}): ScoredPivot {
  const { bars, atrArr, cand, evalBars, structureBars } = params;
  const i0 = cand.idx;
  const i1 = Math.min(bars.length - 1, i0 + evalBars);

  const reasons: string[] = [];

  // Sanity: must have room ahead
  const hasRoom = i0 + Math.max(30, Math.floor(evalBars * 0.6)) < bars.length;
  const sanity: 0 | 1 = hasRoom ? 1 : 0;
  if (!hasRoom) reasons.push("Low forward room (pivot too close to end of data).");

  // Move-away strength (leg birth)
  const p0 = cand.price;
  const pMin = Math.min(...bars.slice(i0, i1).map((b) => b.l));
  const pMax = Math.max(...bars.slice(i0, i1).map((b) => b.h));

  const moveAwayPct =
    cand.type === "swingLow"
      ? Math.max(0, pct(p0, pMax))
      : Math.max(0, pct(p0, pMin)) * -1; // negative for highs

  const absMoveAway = Math.abs(moveAwayPct);

  let legBirth: 0 | 1 | 2 | 3 = 0;
  if (absMoveAway >= 0.02) legBirth = 1;
  if (absMoveAway >= 0.05) legBirth = 2;
  if (absMoveAway >= 0.10) legBirth = 3;
  if (legBirth === 0) reasons.push("Weak move-away (no clear new leg).");

  // Structure confirmation within ~structureBars
  // For swingLow: want a higher-low after initial bounce
  // For swingHigh: want a lower-high after initial drop
  const jEnd = Math.min(bars.length - 1, i0 + structureBars);
  let structureOk = false;

  if (cand.type === "swingLow") {
    // Find a first push up, then a pullback that stays above pivot
    const firstPeak = Math.max(...bars.slice(i0, jEnd).map((b) => b.h));
    const pullbackLow = Math.min(...bars.slice(i0, jEnd).map((b) => b.l));
    structureOk = firstPeak > p0 && pullbackLow >= p0;
  } else {
    const firstDrop = Math.min(...bars.slice(i0, jEnd).map((b) => b.l));
    const pullbackHigh = Math.max(...bars.slice(i0, jEnd).map((b) => b.h));
    structureOk = firstDrop < p0 && pullbackHigh <= p0;
  }

  let structure: 0 | 1 | 2 = 0;
  if (structureOk) structure = 2;
  else if (legBirth >= 2) structure = 1;

  if (structure === 0) reasons.push("No confirmation structure (pivot violated / no clean HL/LH).");
  if (structure === 1) reasons.push("Structure partial (momentum but no clean confirmation).");

  // Follow-through: did it travel meaningfully (ATR-aware)
  const atr0 = Math.max(1e-9, atrArr[i0] || 0);
  const maxDist =
    cand.type === "swingLow" ? (pMax - p0) : (p0 - pMin);

  const distInATR = maxDist / atr0;

  let followThrough: 0 | 1 | 2 = 0;
  if (distInATR >= 2.0) followThrough = 1;
  if (distInATR >= 4.0) followThrough = 2;
  if (followThrough === 0) reasons.push("Low follow-through (price didn’t separate from pivot).");

  // Time fit: do subsequent turns cluster near key counts?
  const turns = localTurns(bars, i0, i1);
  const timeHits = countTimeHits(i0, turns, 2);

  let timeFit: 0 | 1 | 2 = 0;
  if (timeHits >= 1) timeFit = 1;
  if (timeHits >= 3) timeFit = 2;
  if (timeFit === 0) reasons.push("Time fit weak (turns not clustering near key counts).");

  // Map to 0..10 total similar to your Precheck
  const state: ScoreState = { legBirth, structure, followThrough, timeFit, sanity };
  const total10 = state.legBirth + state.structure + state.followThrough + state.timeFit + state.sanity;

  // Internal score01 (for sorting): weight structure + timeFit a bit higher
  const score01 =
    (legBirth / 3) * 0.25 +
    (structure / 2) * 0.30 +
    (followThrough / 2) * 0.20 +
    (timeFit / 2) * 0.20 +
    sanity * 0.05;

  return {
    pivot: cand,
    score01,
    total10,
    state,
    reasons,
    diagnostics: {
      moveAwayPct: absMoveAway,
      structureOk,
      timeHits,
    },
  };
}

export function autoPickPivot(params: {
  bars: OHLCV[];
  evalBars?: number;       // default 120
  structureBars?: number;  // default 10
  maxCandidates?: number;  // default 120
}): AutoPivotResult {
  const { bars } = params;
  const evalBars = params.evalBars ?? 120;
  const structureBars = params.structureBars ?? 10;

  const atrArr = atr(bars, 14);

  // candidates at n=2 and n=3 for multi-scale coverage
  const c2 = fractalCandidates(bars, 2);
  const c3 = fractalCandidates(bars, 3);

  // merge unique by idx+type
  const map = new Map<string, PivotCandidate>();
  for (const c of [...c2, ...c3]) map.set(`${c.idx}:${c.type}`, c);
  let cands = Array.from(map.values());

  // trim to avoid huge scoring
  // prioritize candidates not too near the end and with decent ATR
  cands = cands
    .filter((c) => c.idx + 30 < bars.length)
    .slice(0, params.maxCandidates ?? 120);

  const scored = cands.map((cand) =>
    scorePivot({ bars, atrArr, cand, evalBars, structureBars })
  );

  scored.sort((a, b) => b.score01 - a.score01);

  const top = scored.slice(0, 5);
  const best = top[0] ?? scored[0];

  if (!best) {
    // fallback: trivial pivot if no candidates
    const last = bars[Math.max(0, bars.length - 1)];
    const fallback: ScoredPivot = {
      pivot: { idx: bars.length - 1, t: last.t, price: last.c, type: "swingLow" },
      score01: 0,
      total10: 0,
      state: { legBirth: 0, structure: 0, followThrough: 0, timeFit: 0, sanity: 0 },
      reasons: ["No pivot candidates found (insufficient data)."],
      diagnostics: { moveAwayPct: 0, structureOk: false, timeHits: 0 },
    };
    return { best: fallback, top: [fallback], meta: { nBars: bars.length, evalBars, lookbackBars: bars.length } };
  }

  return {
    best,
    top,
    meta: { nBars: bars.length, evalBars, lookbackBars: bars.length },
  };
}
