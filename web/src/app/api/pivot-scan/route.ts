// src/app/api/pivot-scan/route.ts
import { NextResponse } from "next/server";

type Pivot = {
  t: number; // ms epoch
  ymd: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
};

function isCryptoSymbol(symbolRaw: string) {
  return symbolRaw.toUpperCase().trim().includes("-"); // e.g. BTC-USD
}

function ymdInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

function addDaysUTC(ymd: string, deltaDays: number) {
  const [y, m, d] = ymd.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return ymdInTimeZone(dt, "UTC");
}

function toISODateOnly(ymd: string) {
  return `${ymd}T00:00:00Z`;
}

// --- STOCK: Polygon OHLCV bars ---
async function fetchPolygonBars(symbol: string, timeframe: "1d" | "4h" | "1h", lookback: number) {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) throw new Error("Missing POLYGON_API_KEY in .env.local");

  const now = new Date();
  // buffer window: lookback bars + extra
  const daysBack = timeframe === "1d" ? lookback + 10 : 90;
  const from = ymdInTimeZone(new Date(now.getTime() - daysBack * 86400 * 1000), "UTC");
  const to = ymdInTimeZone(now, "UTC");

  const { multiplier, timespan } =
    timeframe === "1d"
      ? { multiplier: 1, timespan: "day" as const }
      : timeframe === "4h"
      ? { multiplier: 4, timespan: "hour" as const }
      : { multiplier: 1, timespan: "hour" as const };

  const url =
    `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}` +
    `/range/${multiplier}/${timespan}/${from}/${to}` +
    `?adjusted=true&sort=asc&limit=50000&apiKey=${encodeURIComponent(apiKey)}`;

  const r = await fetch(url, { next: { revalidate: 0 } });
  if (!r.ok) throw new Error(`Polygon error (${r.status}): ${await r.text().catch(() => r.statusText)}`);
  const j: any = await r.json();

  const rows: any[] = Array.isArray(j?.results) ? j.results : [];
  return rows.map((x) => ({
    t: Number(x.t),
    o: Number(x.o),
    h: Number(x.h),
    l: Number(x.l),
    c: Number(x.c),
    v: Number(x.v ?? 0),
  }));
}

// --- CRYPTO: Coinbase candles ---
async function fetchCoinbaseBars(productId: string, timeframe: "1d" | "4h" | "1h", lookback: number) {
  const granularity = timeframe === "1d" ? 86400 : timeframe === "4h" ? 14400 : 3600;

  // Coinbase is picky. Keep it reasonable.
  const max = 300;
  const lb = Math.min(Math.max(10, lookback), max);

  const end = new Date();
  const seconds = lb * granularity + granularity * 5;
  const start = new Date(end.getTime() - seconds * 1000);

  const url =
    `https://api.exchange.coinbase.com/products/${encodeURIComponent(productId)}/candles` +
    `?start=${encodeURIComponent(start.toISOString())}` +
    `&end=${encodeURIComponent(end.toISOString())}` +
    `&granularity=${granularity}`;

  const r = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "URA-Pivot-Scan/1.0" },
    next: { revalidate: 0 },
  });

  if (!r.ok) throw new Error(`Coinbase error (${r.status}): ${await r.text().catch(() => r.statusText)}`);

  const rows: any[] = await r.json();
  if (!Array.isArray(rows)) throw new Error("Coinbase returned non-array candles");

  // Coinbase: [ time, low, high, open, close, volume ] where time is seconds
  const bars = rows
    .map((a) => ({
      t: Number(a?.[0]) * 1000,
      l: Number(a?.[1]),
      h: Number(a?.[2]),
      o: Number(a?.[3]),
      c: Number(a?.[4]),
      v: Number(a?.[5] ?? 0),
    }))
    .filter((x) => Number.isFinite(x.t) && Number.isFinite(x.o) && Number.isFinite(x.h) && Number.isFinite(x.l) && Number.isFinite(x.c))
    .sort((a, b) => a.t - b.t);

  return bars;
}

function findSwingPivot(bars: Array<{ t: number; o: number; h: number; l: number; c: number }>) {
  // Simple swing logic: last local extremum in lookback window
  // (you can replace with your existing swing algo if you already have it)
  if (bars.length < 5) return null;

  let bestIdx = -1;
  let bestScore = -Infinity;

  for (let i = 2; i < bars.length - 2; i++) {
    const b = bars[i];
    const prev1 = bars[i - 1], prev2 = bars[i - 2];
    const next1 = bars[i + 1], next2 = bars[i + 2];

    const isSwingHigh = b.h > prev1.h && b.h > prev2.h && b.h > next1.h && b.h > next2.h;
    const isSwingLow  = b.l < prev1.l && b.l < prev2.l && b.l < next1.l && b.l < next2.l;

    if (!isSwingHigh && !isSwingLow) continue;

    // Score by “impulse” size
    const impulse = isSwingHigh ? (b.h - Math.min(prev2.l, next2.l)) : (Math.max(prev2.h, next2.h) - b.l);
    if (impulse > bestScore) {
      bestScore = impulse;
      bestIdx = i;
    }
  }

  if (bestIdx === -1) return null;

  const pivot = bars[bestIdx];
  const kind = pivot.h - pivot.l >= 0 ? (pivot.c >= pivot.o ? "swing" : "swing") : "swing";
  return { idx: bestIdx, pivot, kind };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const symbolRaw = String(body?.symbol ?? "").trim();
    const timeframe = (String(body?.timeframe ?? "1d") as "1d" | "4h" | "1h") || "1d";
    const lookback = Math.max(20, Math.min(500, Math.floor(Number(body?.lookback ?? 180))));

    if (!symbolRaw) return NextResponse.json({ ok: false, error: "Missing symbol" }, { status: 400 });

    const symbol = symbolRaw.toUpperCase();
    const crypto = isCryptoSymbol(symbol);

    const bars = crypto
      ? await fetchCoinbaseBars(symbol, timeframe, lookback)
      : await fetchPolygonBars(symbol, timeframe, lookback);

    if (!bars.length) return NextResponse.json({ ok: false, error: "No bars returned" }, { status: 502 });

    const swing = findSwingPivot(bars);
    const last = bars[bars.length - 1];

    // For display day label
    const tz = crypto ? "UTC" : "America/New_York";
    const ymd = ymdInTimeZone(new Date(last.t), tz);

    return NextResponse.json({
      ok: true,
      kind: crypto ? "crypto" : "stock",
      provider: crypto ? "coinbase" : "polygon",
      symbol,
      timeframe,
      lookbackUsed: lookback,
      timezoneUsed: tz,
      last: { t: last.t, ymd, o: last.o, h: last.h, l: last.l, c: last.c, v: last.v ?? 0 },
      pivot: swing
        ? {
            t: swing.pivot.t,
            ymd: ymdInTimeZone(new Date(swing.pivot.t), tz),
            o: swing.pivot.o,
            h: swing.pivot.h,
            l: swing.pivot.l,
            c: swing.pivot.c,
            idx: swing.idx,
          }
        : null,
      note: crypto
        ? "Crypto via Coinbase candles."
        : "Stock via Polygon aggregates.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ? String(e.message) : "Unknown error" }, { status: 500 });
  }
}
