// src/lib/marketData.ts
import "server-only";

export type Market = "stock" | "crypto";
export type Timeframe = "1d" | "4h" | "1h";

export type OHLCV = {
  t: number; // ms epoch
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

function assertEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

function tfToPolygon(tf: Timeframe) {
  if (tf === "1d") return { multiplier: 1, timespan: "day" as const };
  if (tf === "4h") return { multiplier: 4, timespan: "hour" as const };
  return { multiplier: 1, timespan: "hour" as const };
}

export async function fetchStockOHLCV(params: {
  symbol: string;
  timeframe: Timeframe;
  fromYMD: string; // YYYY-MM-DD
  toYMD: string; // YYYY-MM-DD
}): Promise<OHLCV[]> {
  const POLYGON_API_KEY = assertEnv("POLYGON_API_KEY");
  const { multiplier, timespan } = tfToPolygon(params.timeframe);

  const url =
    `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(params.symbol)}` +
    `/range/${multiplier}/${timespan}/${params.fromYMD}/${params.toYMD}` +
    `?adjusted=true&sort=asc&limit=50000&apiKey=${POLYGON_API_KEY}`;

  const r = await fetch(url, { next: { revalidate: 60 } });
  if (!r.ok) throw new Error(`Polygon error: ${r.status} ${await r.text()}`);
  const j = await r.json();

  const results = (j?.results ?? []) as any[];
  return results.map((x) => ({
    t: Number(x.t),
    o: Number(x.o),
    h: Number(x.h),
    l: Number(x.l),
    c: Number(x.c),
    v: Number(x.v ?? 0),
  }));
}

function tfToCoinbaseGranularity(tf: Timeframe) {
  if (tf === "1d") return 86400;
  if (tf === "4h") return 14400;
  return 3600;
}

export async function fetchCryptoOHLCV(params: {
  productId: string; // e.g. BTC-USD
  timeframe: Timeframe;
  startISO: string;
  endISO: string;
}): Promise<OHLCV[]> {
  const granularity = tfToCoinbaseGranularity(params.timeframe);

  const url =
    `https://api.exchange.coinbase.com/products/${encodeURIComponent(params.productId)}/candles` +
    `?start=${encodeURIComponent(params.startISO)}` +
    `&end=${encodeURIComponent(params.endISO)}` +
    `&granularity=${granularity}`;

  const r = await fetch(url, { next: { revalidate: 60 } });
  if (!r.ok) throw new Error(`Coinbase error: ${r.status} ${await r.text()}`);
  const j = (await r.json()) as any[];

  // Coinbase: [ time, low, high, open, close, volume ]
  const candles = j.map((row) => ({
    t: Number(row[0]) * 1000,
    l: Number(row[1]),
    h: Number(row[2]),
    o: Number(row[3]),
    c: Number(row[4]),
    v: Number(row[5] ?? 0),
  }));

  candles.sort((a, b) => a.t - b.t);
  return candles;
}
