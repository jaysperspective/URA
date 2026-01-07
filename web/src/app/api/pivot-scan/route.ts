// src/app/api/pivot-scan/route.ts
import { NextResponse } from "next/server";

type Timeframe = "1d" | "4h" | "1h";

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
  // UI uses SOL-USD; Coinbase expects SOL-USD (same), but keep this hook for later
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
    // public endpoint; keep default caching off for deterministic scans
    cache: "no-store",
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Coinbase error: ${r.status} ${text}`);
  }

  // Coinbase returns: [ time, low, high, open, close, volume ] newest-first
  const raw = (await r.json()) as number[][];
  return raw;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      symbol: string;
      kind?: "crypto" | "stock";
      timeframe?: Timeframe;
      lookbackBars?: number; // requested bars
    };

    const symbol = String(body.symbol || "").trim();
    if (!symbol) return NextResponse.json({ ok: false, error: "symbol is required" }, { status: 400 });

    const timeframe: Timeframe = (body.timeframe as Timeframe) || "1d";
    const granularity = tfToCoinbaseGranularity(timeframe);

    // Coinbase candle limit is effectively ~300.
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
    const candles = raw
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
      note:
        requestedBars >= 300
          ? "Coinbase limits candle aggregations; scan capped at 300 bars."
          : undefined,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "pivot scan failed",
      },
      { status: 500 }
    );
  }
}
