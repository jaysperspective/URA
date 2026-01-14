// src/app/api/gann-scan/route.ts
import { NextResponse } from "next/server";

type PivotAnchorMode = "low" | "high" | "close" | "open";

type ScanRow = {
  symbol: string;
  kind: "stock" | "crypto";
  provider: "polygon" | "coinbase";

  pivotISO: string;
  anchorSource: PivotAnchorMode;
  anchor: number;

  price: number;
  asOfISO: string;

  timeDeg: number;
  priceDeg: number;

  gapUnsigned: number;     // 0..360
  gapSignedAbs: number;    // 0..180
  oppositionDist: number;  // 0..180

  leadLabel: "IN SYNC" | "TIME LEADS" | "PRICE LEADS";
};

type ReqBody = {
  symbols: string[];
  pivotISO: string;            // ISO string (client should send new Date(pivotDateTime).toISOString())
  cycleDays: number;           // e.g. 90
  tickSize?: number;           // for rounding anchor
  anchorSource?: PivotAnchorMode;
  tolDeg?: number;             // e.g. 5
  returnAll?: boolean;         // if true, return all rows (even non-matches)
  maxSymbols?: number;         // safety cap
};

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

function getLeadLabel(timeDeg: number, priceDeg: number, tolDeg: number) {
  const d = signedAngleDiffDeg(timeDeg, priceDeg); // + time ahead
  const abs = Math.abs(d);
  if (abs <= tolDeg) return "IN SYNC" as const;
  if (d > 0) return "TIME LEADS" as const;
  return "PRICE LEADS" as const;
}

// Same mapping you use in ChartClient
function computePriceAngleDeg(anchor: number, price: number) {
  if (!Number.isFinite(anchor) || anchor <= 0) return null;
  if (!Number.isFinite(price) || price <= 0) return null;
  const raw = (Math.sqrt(price) - Math.sqrt(anchor)) * 180;
  return norm360(raw);
}

function roundToTick(value: number, tick: number) {
  if (!Number.isFinite(value) || !Number.isFinite(tick) || tick <= 0) return value;
  return Math.round(value / tick) * tick;
}

function parseSymbols(symbols: any): string[] {
  if (Array.isArray(symbols)) return symbols.map((s) => String(s).trim()).filter(Boolean);
  const s = String(symbols ?? "");
  return s
    .replace(/\n/g, " ")
    .split(/[, ]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

// --- Simple in-memory cache (best-effort) ---
type CacheEntry = { exp: number; data: any };
const cache = new Map<string, CacheEntry>();
function cacheKey(body: ReqBody) {
  const s = (body.symbols || []).map((x) => String(x).toUpperCase()).sort().join(",");
  return [
    "v1",
    s,
    body.pivotISO,
    String(body.cycleDays),
    String(body.tickSize ?? ""),
    String(body.anchorSource ?? ""),
    String(body.tolDeg ?? ""),
    String(body.returnAll ?? ""),
  ].join("|");
}
function getCache(k: string) {
  const e = cache.get(k);
  if (!e) return null;
  if (Date.now() > e.exp) {
    cache.delete(k);
    return null;
  }
  return e.data;
}
function setCache(k: string, data: any, ttlMs: number) {
  cache.set(k, { exp: Date.now() + ttlMs, data });
}

// --- Concurrency limiter ---
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

// --- Fetch helpers (server-side) ---
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

  const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(
    symbol
  )}/prev?adjusted=true&apiKey=${encodeURIComponent(apiKey)}`;

  const r = await fetch(url, { next: { revalidate: 0 } });
  if (!r.ok) throw new Error(`Polygon (${r.status}): ${await r.text().catch(() => r.statusText)}`);

  const j: any = await r.json();
  const row = Array.isArray(j?.results) ? j.results[0] : null;
  const price = Number(row?.c);
  const t = Number(row?.t);
  if (!Number.isFinite(price)) throw new Error("Polygon prev agg missing close (c)");
  return { price, asOfISO: Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString() };
}

async function fetchPivotCandleViaInternalApi(symbol: string, pivotISO: string) {
  // Calls your existing route so we don't duplicate timezone/bucketing logic here
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/market-candle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // IMPORTANT: this is server-side, so absolute URL is nicer, but relative works in Next runtime too.
    body: JSON.stringify({ symbol, pivotISO }),
    next: { revalidate: 0 },
  }).catch(async () => {
    // fallback to relative if absolute fails (common in server env)
    return fetch("/api/market-candle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, pivotISO }),
      next: { revalidate: 0 },
    });
  });

  const j: any = await r.json().catch(() => null);
  if (!r.ok || !j) throw new Error(`market-candle failed (${r.status})`);
  if (!j.ok) throw new Error(String(j.error || "market-candle error"));

  const pivot = Array.isArray(j.candles) ? j.candles.find((x: any) => x?.label === "Pivot") : null;
  if (!pivot) throw new Error("No Pivot candle returned");

  return {
    kind: j.kind as "stock" | "crypto",
    provider: (j.provider ?? (j.kind === "crypto" ? "coinbase" : "polygon")) as "coinbase" | "polygon",
    pivot,
  };
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

export async function POST(req: Request) {
  try {
    const bodyRaw = (await req.json().catch(() => ({}))) as Partial<ReqBody>;

    const pivotISO = String(bodyRaw.pivotISO ?? "").trim();
    const cycleDays = Number(bodyRaw.cycleDays);
    const tolDeg = Number(bodyRaw.tolDeg ?? 5);
    const tickSize = Number(bodyRaw.tickSize ?? 0.01);
    const anchorSource = (String(bodyRaw.anchorSource ?? "close") as PivotAnchorMode) || "close";
    const returnAll = Boolean(bodyRaw.returnAll);
    const maxSymbols = Math.max(1, Math.min(300, Math.floor(Number(bodyRaw.maxSymbols ?? 80))));

    if (!pivotISO) return NextResponse.json({ ok: false, error: "Missing pivotISO" }, { status: 400 });
    if (!Number.isFinite(cycleDays) || cycleDays <= 0)
      return NextResponse.json({ ok: false, error: "Invalid cycleDays" }, { status: 400 });
    if (!Number.isFinite(tolDeg) || tolDeg <= 0 || tolDeg > 45)
      return NextResponse.json({ ok: false, error: "tolDeg must be between 0 and 45" }, { status: 400 });

    const symbols = parseSymbols(bodyRaw.symbols).slice(0, maxSymbols).map((s) => s.toUpperCase());
    if (!symbols.length) return NextResponse.json({ ok: false, error: "No symbols provided" }, { status: 400 });

    const k = cacheKey({
      symbols,
      pivotISO,
      cycleDays,
      tickSize,
      anchorSource,
      tolDeg,
      returnAll,
    });

    const cached = getCache(k);
    if (cached) return NextResponse.json({ ok: true, cached: true, ...cached });

    const timeDeg = computeTimeDeg(pivotISO, cycleDays);
    if (timeDeg == null) {
      return NextResponse.json({ ok: false, error: "Could not compute timeDeg" }, { status: 400 });
    }

    const rows = await mapLimit(symbols, 6, async (sym) => {
      try {
        // 1) pivot candle (uses your existing /api/market-candle logic)
        const candle = await fetchPivotCandleViaInternalApi(sym, pivotISO);
        const p = candle.pivot;

        const picked =
          anchorSource === "low"
            ? Number(p.l)
            : anchorSource === "high"
            ? Number(p.h)
            : anchorSource === "open"
            ? Number(p.o)
            : Number(p.c);

        const anchor = roundToTick(picked, tickSize);

        // 2) price
        let price: number;
        let asOfISO: string;
        let provider: "polygon" | "coinbase";
        let kind: "stock" | "crypto";

        if (isCryptoSymbol(sym)) {
          const tkr = await fetchCoinbaseTicker(sym);
          price = tkr.price;
          asOfISO = tkr.asOfISO;
          provider = "coinbase";
          kind = "crypto";
        } else {
          const prev = await fetchPolygonPrevClose(sym);
          price = prev.price;
          asOfISO = prev.asOfISO;
          provider = "polygon";
          kind = "stock";
        }

        const priceDeg = computePriceAngleDeg(anchor, price);
        if (priceDeg == null) throw new Error("Bad priceDeg calc");

        const gapUnsigned = norm360(timeDeg - priceDeg);
        const gapSigned = signedAngleDiffDeg(timeDeg, priceDeg);
        const gapSignedAbs = Math.abs(gapSigned);
        const oppositionDist = Math.abs(gapUnsigned - 180);
        const leadLabel = getLeadLabel(timeDeg, priceDeg, 12);

        const row: ScanRow = {
          symbol: sym,
          kind,
          provider,
          pivotISO,
          anchorSource,
          anchor,
          price,
          asOfISO,
          timeDeg,
          priceDeg,
          gapUnsigned,
          gapSignedAbs,
          oppositionDist,
          leadLabel,
        };

        return { ok: true as const, row };
      } catch (e: any) {
        return { ok: false as const, symbol: sym, error: e?.message || "scan error" };
      }
    });

    const okRows = rows.filter((x) => x.ok).map((x: any) => x.row as ScanRow);
    okRows.sort((a, b) => a.oppositionDist - b.oppositionDist);

    const matches = okRows.filter((r) => r.oppositionDist <= tolDeg);

    const payload = {
      timeDeg,
      count: returnAll ? okRows.length : matches.length,
      rows: returnAll ? okRows : matches,
      errors: rows.filter((x) => !x.ok),
    };

    // cache for 25 seconds (scanner UX feels instant, but price still “fresh enough”)
    setCache(k, payload, 25_000);

    return NextResponse.json({ ok: true, cached: false, ...payload });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ? String(e.message) : "Unknown error" }, { status: 500 });
  }
}
