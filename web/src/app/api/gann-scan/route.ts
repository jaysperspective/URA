// src/app/api/gann-scan/route.ts
import { NextResponse } from "next/server";

type AnchorSource = "low" | "high" | "close" | "open";

function isCryptoSymbol(symbolRaw: string) {
  return symbolRaw.toUpperCase().trim().includes("-");
}

function norm360(x: number) {
  let a = x % 360;
  if (a < 0) a += 360;
  return a;
}

// shortest signed diff a-b in (-180,180]
function signedAngleDiffDeg(a: number, b: number) {
  const d = ((a - b + 540) % 360) - 180;
  return d === -180 ? 180 : d;
}

function computePriceAngleDeg(anchor: number, price: number) {
  if (!Number.isFinite(anchor) || anchor <= 0) return null;
  if (!Number.isFinite(price) || price <= 0) return null;
  const raw = (Math.sqrt(price) - Math.sqrt(anchor)) * 180;
  return norm360(raw);
}

function computeTimeDeg(pivotISO: string, cycleDays: number) {
  const pivotMs = new Date(pivotISO).getTime();
  if (!Number.isFinite(pivotMs)) return null;
  if (!Number.isFinite(cycleDays) || cycleDays <= 0) return null;

  const nowMs = Date.now();
  const deltaDays = (nowMs - pivotMs) / (1000 * 60 * 60 * 24);
  const prog01 = (((deltaDays % cycleDays) + cycleDays) % cycleDays) / cycleDays;
  return prog01 * 360;
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

async function fetchPolygonPivotCandle(symbol: string, pivotISO: string) {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) throw new Error("Missing POLYGON_API_KEY");

  // pivot session day in NY
  const pivotDate = new Date(pivotISO);
  const sessionYMD = ymdInTimeZone(pivotDate, "America/New_York");

  // Fetch a 3-day window so we can map bars to NY day labels reliably
  const from = addDaysUTC(sessionYMD, -1);
  const to = addDaysUTC(sessionYMD, +1);

  const url =
    `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}` +
    `/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${encodeURIComponent(apiKey)}`;

  const r = await fetch(url, { next: { revalidate: 0 } });
  if (!r.ok) throw new Error(`Polygon error (${r.status}): ${await r.text().catch(() => r.statusText)}`);
  const j: any = await r.json();

  const rows: any[] = Array.isArray(j?.results) ? j.results : [];
  const byYMD = new Map<string, any>();

  for (const row of rows) {
    const t = typeof row?.t === "number" ? row.t : null;
    if (!t) continue;
    const ymdNY = ymdInTimeZone(new Date(t), "America/New_York");
    byYMD.set(ymdNY, row);
  }

  const pivot = byYMD.get(sessionYMD);
  if (!pivot) throw new Error("No pivot candle returned by Polygon for that NY session day.");

  return {
    kind: "stock" as const,
    provider: "polygon" as const,
    timezoneUsed: "America/New_York" as const,
    sessionDayYMD: sessionYMD,
    candle: {
      o: Number(pivot.o),
      h: Number(pivot.h),
      l: Number(pivot.l),
      c: Number(pivot.c),
      t: Number(pivot.t),
    },
  };
}

async function fetchCoinbasePivotCandle(productId: string, pivotISO: string) {
  const pivotDate = new Date(pivotISO);
  const pivotUTCYMD = ymdInTimeZone(pivotDate, "UTC");

  const startUTC = `${addDaysUTC(pivotUTCYMD, -1)}T00:00:00Z`;
  const endUTC = `${addDaysUTC(pivotUTCYMD, +2)}T00:00:00Z`;

  const url =
    `https://api.exchange.coinbase.com/products/${encodeURIComponent(productId)}/candles` +
    `?granularity=86400&start=${encodeURIComponent(startUTC)}&end=${encodeURIComponent(endUTC)}`;

  const r = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "URA-Gann-Scan/1.0" },
    next: { revalidate: 0 },
  });

  if (!r.ok) throw new Error(`Coinbase error (${r.status}): ${await r.text().catch(() => r.statusText)}`);

  const rows: any[] = await r.json();
  if (!Array.isArray(rows)) throw new Error("Coinbase returned non-array candles");

  // find candle for pivotUTCYMD
  const map = new Map<string, any>();
  for (const a of rows) {
    const tSec = Number(a?.[0]);
    if (!Number.isFinite(tSec)) continue;
    const ymd = ymdInTimeZone(new Date(tSec * 1000), "UTC");
    map.set(ymd, a);
  }

  const c = map.get(pivotUTCYMD);
  if (!c) throw new Error("No pivot candle returned by Coinbase for that UTC day.");

  return {
    kind: "crypto" as const,
    provider: "coinbase" as const,
    timezoneUsed: "UTC" as const,
    sessionDayYMD: pivotUTCYMD,
    candle: {
      t: Number(c?.[0]) * 1000,
      l: Number(c?.[1]),
      h: Number(c?.[2]),
      o: Number(c?.[3]),
      c: Number(c?.[4]),
    },
  };
}

async function fetchCoinbaseTicker(productId: string) {
  const url = `https://api.exchange.coinbase.com/products/${encodeURIComponent(productId)}/ticker`;
  const r = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "URA-Gann-Scan/1.0" },
    next: { revalidate: 0 },
  });
  if (!r.ok) throw new Error(`Coinbase (${r.status}): ${await r.text().catch(() => r.statusText)}`);
  const j: any = await r.json();
  const price = Number(j?.price);
  if (!Number.isFinite(price)) throw new Error("Coinbase returned invalid price");
  return { price, asOfISO: new Date().toISOString() };
}

async function fetchPolygonPrevClose(symbol: string) {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) throw new Error("Missing POLYGON_API_KEY");

  const url =
    `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}/prev?adjusted=true&apiKey=${encodeURIComponent(apiKey)}`;

  const r = await fetch(url, { next: { revalidate: 0 } });
  if (!r.ok) throw new Error(`Polygon (${r.status}): ${await r.text().catch(() => r.statusText)}`);

  const j: any = await r.json();
  const row = Array.isArray(j?.results) ? j.results[0] : null;
  const price = Number(row?.c);
  const t = Number(row?.t);

  if (!Number.isFinite(price)) throw new Error("Polygon prev agg missing close (c)");
  return { price, asOfISO: Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString() };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let idx = 0;

  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (true) {
      const i = idx++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });

  await Promise.all(workers);
  return out;
}

function parseSymbols(s: any): string[] {
  if (Array.isArray(s)) return s.map((x) => String(x).trim()).filter(Boolean);
  return String(s ?? "")
    .replace(/\n/g, " ")
    .split(/[, ]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const symbols = parseSymbols(body.symbols).map((x) => x.toUpperCase()).slice(0, Math.max(1, Math.min(300, Number(body.maxSymbols ?? 80))));
    const pivotISO = String(body.pivotISO ?? "").trim();
    const cycleDays = Number(body.cycleDays);
    const tolDeg = Number(body.tolDeg ?? 5);
    const anchorSource = (String(body.anchorSource ?? "close") as AnchorSource) || "close";
    const tickSize = Number(body.tickSize ?? 0.01);
    const closestN = Math.max(3, Math.min(30, Number(body.closestN ?? 8)));

    if (!symbols.length) return NextResponse.json({ ok: false, error: "No symbols provided" }, { status: 400 });
    if (!pivotISO) return NextResponse.json({ ok: false, error: "Missing pivotISO" }, { status: 400 });
    if (!Number.isFinite(cycleDays) || cycleDays <= 0) return NextResponse.json({ ok: false, error: "Invalid cycleDays" }, { status: 400 });

    const timeDeg = computeTimeDeg(pivotISO, cycleDays);
    if (timeDeg == null) return NextResponse.json({ ok: false, error: "Could not compute timeDeg" }, { status: 400 });

    const results = await mapLimit(symbols, 6, async (sym) => {
      try {
        const crypto = isCryptoSymbol(sym);

        const pivotRes = crypto
          ? await fetchCoinbasePivotCandle(sym, pivotISO)
          : await fetchPolygonPivotCandle(sym, pivotISO);

        const p = pivotRes.candle;

        const picked =
          anchorSource === "low" ? Number(p.l)
          : anchorSource === "high" ? Number(p.h)
          : anchorSource === "open" ? Number(p.o)
          : Number(p.c);

        const anchor = Math.round(picked / tickSize) * tickSize;

        const px = crypto ? await fetchCoinbaseTicker(sym) : await fetchPolygonPrevClose(sym);
        const priceDeg = computePriceAngleDeg(anchor, px.price);
        if (priceDeg == null) throw new Error("Bad priceDeg calc");

        const gapUnsigned = norm360(timeDeg - priceDeg);
        const oppositionDist = Math.abs(gapUnsigned - 180);

        return {
          ok: true as const,
          row: {
            symbol: sym,
            kind: crypto ? "crypto" : "stock",
            provider: crypto ? "coinbase" : "polygon",
            pivotISO,
            timeDeg,
            priceDeg,
            anchorSource,
            anchor,
            price: px.price,
            asOfISO: px.asOfISO,
            oppositionDist,
            gapSignedAbs: Math.abs(signedAngleDiffDeg(timeDeg, priceDeg)),
          },
        };
      } catch (e: any) {
        return { ok: false as const, symbol: sym, error: e?.message || "scan error" };
      }
    });

    const okRows = results.filter((x) => (x as any).ok).map((x: any) => x.row);
    okRows.sort((a: any, b: any) => a.oppositionDist - b.oppositionDist);

    const matches = okRows.filter((r: any) => r.oppositionDist <= tolDeg);
    const closest = okRows.slice(0, closestN);

    return NextResponse.json({
      ok: true,
      timeDeg,
      tolDeg,
      matches,
      closest,
      errors: results.filter((x) => !(x as any).ok),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ? String(e.message) : "Unknown error" }, { status: 500 });
  }
}
