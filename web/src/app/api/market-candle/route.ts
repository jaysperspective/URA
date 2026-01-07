// src/app/api/market-candle/route.ts
import { NextRequest, NextResponse } from "next/server";

type Timeframe = "1D";
type Candle = { t: number; o: number; h: number; l: number; c: number; v?: number };

function isLikelyCrypto(symbol: string) {
  // You’re using SOL-USD style strings already.
  // Stocks are typically like LUNR, AAPL, etc.
  return symbol.includes("-") && symbol.toUpperCase().endsWith("USD");
}

function clampDayRangeUTC(pivotISO: string) {
  const pivot = new Date(pivotISO);
  if (!Number.isFinite(pivot.getTime())) return null;

  const start = new Date(Date.UTC(pivot.getUTCFullYear(), pivot.getUTCMonth(), pivot.getUTCDate(), 0, 0, 0));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

function ymdUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function fetchCoinbaseDailyCandle(productId: string, start: Date, end: Date): Promise<Candle | null> {
  // Coinbase Exchange public candles:
  // GET /products/{product_id}/candles?granularity=86400&start=...&end=...
  // Response rows: [ time, low, high, open, close, volume ]
  const url =
    `https://api.exchange.coinbase.com/products/${encodeURIComponent(productId)}/candles` +
    `?granularity=86400&start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`;

  const r = await fetch(url, {
    // cache lightly; you can tune
    next: { revalidate: 60 },
    headers: {
      "User-Agent": "URA/1.0",
      "Accept": "application/json",
    },
  });

  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Coinbase candles error: ${t}`);
  }

  const rows = (await r.json()) as any[];
  if (!Array.isArray(rows) || rows.length === 0) return null;

  // Coinbase returns candles in reverse chronological order sometimes depending on params.
  // We requested a single-day window; take the first row.
  const row = rows[0];
  const t = Number(row?.[0]);
  const l = Number(row?.[1]);
  const h = Number(row?.[2]);
  const o = Number(row?.[3]);
  const c = Number(row?.[4]);
  const v = Number(row?.[5]);

  if (![t, o, h, l, c].every(Number.isFinite)) return null;

  return { t: t * 1000, o, h, l, c, v };
}

async function fetchPolygonDailyCandle(ticker: string, dayUTC: string): Promise<Candle | null> {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) throw new Error("Missing POLYGON_API_KEY");

  // Polygon daily aggregate:
  // /v2/aggs/ticker/{ticker}/range/1/day/{from}/{to}
  const url =
    `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/1/day/${dayUTC}/${dayUTC}` +
    `?adjusted=true&sort=asc&limit=1&apiKey=${encodeURIComponent(apiKey)}`;

  const r = await fetch(url, { next: { revalidate: 60 } });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Polygon aggregates error: ${t}`);
  }

  const json = await r.json();
  const bar = json?.results?.[0];
  if (!bar) return null;

  const t = Number(bar.t);
  const o = Number(bar.o);
  const h = Number(bar.h);
  const l = Number(bar.l);
  const c = Number(bar.c);
  const v = Number(bar.v);

  if (![t, o, h, l, c].every(Number.isFinite)) return null;

  return { t, o, h, l, c, v };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const symbol = String(body?.symbol || "").trim().toUpperCase();
    const pivotDateTimeISO = String(body?.pivotDateTimeISO || "").trim();
    const timeframe = String(body?.timeframe || "1D").trim() as Timeframe;

    if (!symbol) return NextResponse.json({ ok: false, error: "symbol required" }, { status: 400 });
    if (!pivotDateTimeISO) return NextResponse.json({ ok: false, error: "pivotDateTimeISO required" }, { status: 400 });
    if (timeframe !== "1D") return NextResponse.json({ ok: false, error: "Only 1D supported right now" }, { status: 400 });

    const range = clampDayRangeUTC(pivotDateTimeISO);
    if (!range) return NextResponse.json({ ok: false, error: "Invalid pivotDateTimeISO" }, { status: 400 });

    const { start, end } = range;

    if (isLikelyCrypto(symbol)) {
      // Coinbase product ids match your input format (e.g., SOL-USD, BTC-USD)
      const candle = await fetchCoinbaseDailyCandle(symbol, start, end);
      if (!candle) return NextResponse.json({ ok: false, error: "No candle found for that pivot day" }, { status: 404 });

      return NextResponse.json({
        ok: true,
        assetClass: "crypto",
        provider: "coinbase",
        symbol,
        timeframe,
        dayUTC: ymdUTC(start),
        candle,
      });
    }

    // Stock
    const candle = await fetchPolygonDailyCandle(symbol, ymdUTC(start));
    if (!candle) return NextResponse.json({ ok: false, error: "No candle found for that pivot day" }, { status: 404 });

    return NextResponse.json({
      ok: true,
      assetClass: "stock",
      provider: "polygon",
      symbol,
      timeframe,
      dayUTC: ymdUTC(start),
      candle,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
