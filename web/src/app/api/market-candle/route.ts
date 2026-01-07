// src/app/api/market-candle/route.ts
import { NextResponse } from "next/server";

type Candle = {
  dayKey: string; // YYYY-MM-DD in the candle's timezone context
  label: "Prior" | "Pivot" | "Next";
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
};

function isCryptoSymbol(symbolRaw: string) {
  const s = symbolRaw.toUpperCase().trim();
  return s.includes("-");
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

async function fetchPolygon3Day(symbol: string, sessionYMD: string) {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    return { ok: false as const, error: "Missing POLYGON_API_KEY in .env.local" };
  }

  const from = addDaysUTC(sessionYMD, -1);
  const to = addDaysUTC(sessionYMD, +1);

  const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(
    symbol.toUpperCase().trim()
  )}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${encodeURIComponent(apiKey)}`;

  const r = await fetch(url, { next: { revalidate: 0 } });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    return {
      ok: false as const,
      error: `Polygon error (${r.status}): ${text || r.statusText}`,
    };
  }
  const j = await r.json();

  const rows: Array<any> = Array.isArray(j?.results) ? j.results : [];
  const byYMD = new Map<string, any>();

  // Map each bar to NY session day
  for (const row of rows) {
    const t = typeof row?.t === "number" ? row.t : null;
    if (!t) continue;
    const ymdNY = ymdInTimeZone(new Date(t), "America/New_York");
    byYMD.set(ymdNY, row);
  }

  const priorNY = ymdInTimeZone(
    new Date(Date.parse(`${sessionYMD}T00:00:00Z`) - 24 * 3600 * 1000),
    "America/New_York"
  );
  const pivotNY = sessionYMD;
  const nextNY = ymdInTimeZone(
    new Date(Date.parse(`${sessionYMD}T00:00:00Z`) + 24 * 3600 * 1000),
    "America/New_York"
  );

  const prior = byYMD.get(priorNY);
  const pivot = byYMD.get(pivotNY);
  const next = byYMD.get(nextNY);

  const out: Candle[] = [];

  if (prior) {
    out.push({ dayKey: priorNY, label: "Prior", o: prior.o, h: prior.h, l: prior.l, c: prior.c, v: prior.v });
  }
  if (pivot) {
    out.push({ dayKey: pivotNY, label: "Pivot", o: pivot.o, h: pivot.h, l: pivot.l, c: pivot.c, v: pivot.v });
  }
  if (next) {
    out.push({ dayKey: nextNY, label: "Next", o: next.o, h: next.h, l: next.l, c: next.c, v: next.v });
  }

  return {
    ok: true as const,
    provider: "polygon" as const,
    timezoneUsed: "America/New_York" as const,
    sessionDayYMD: sessionYMD,
    candles: out,
    rawCount: rows.length,
  };
}

async function fetchCoinbase3Day(productId: string, pivotUTCYMD: string) {
  const startUTC = `${addDaysUTC(pivotUTCYMD, -1)}T00:00:00Z`;
  const endUTC = `${addDaysUTC(pivotUTCYMD, +2)}T00:00:00Z`;

  const url = `https://api.exchange.coinbase.com/products/${encodeURIComponent(
    productId.toUpperCase().trim()
  )}/candles?granularity=86400&start=${encodeURIComponent(startUTC)}&end=${encodeURIComponent(endUTC)}`;

  const r = await fetch(url, {
    headers: {
      "User-Agent": "URA-Gann-Chart/1.0",
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    return {
      ok: false as const,
      error: `Coinbase error (${r.status}): ${text || r.statusText}`,
    };
  }

  const rows: any[] = await r.json();
  if (!Array.isArray(rows)) {
    return { ok: false as const, error: "Coinbase returned non-array candles" };
  }

  const norm = rows
    .map((a) => ({
      t: typeof a?.[0] === "number" ? a[0] : null,
      l: typeof a?.[1] === "number" ? a[1] : null,
      h: typeof a?.[2] === "number" ? a[2] : null,
      o: typeof a?.[3] === "number" ? a[3] : null,
      c: typeof a?.[4] === "number" ? a[4] : null,
      v: typeof a?.[5] === "number" ? a[5] : null,
    }))
    .filter((x) => x.t && x.o != null && x.h != null && x.l != null && x.c != null)
    .sort((a, b) => (a.t! as number) - (b.t! as number));

  const byYMD = new Map<string, any>();
  for (const row of norm) {
    const ymd = ymdInTimeZone(new Date((row.t as number) * 1000), "UTC");
    byYMD.set(ymd, row);
  }

  const priorYMD = addDaysUTC(pivotUTCYMD, -1);
  const nextYMD = addDaysUTC(pivotUTCYMD, +1);

  const prior = byYMD.get(priorYMD);
  const pivot = byYMD.get(pivotUTCYMD);
  const next = byYMD.get(nextYMD);

  const out: Candle[] = [];
  if (prior) out.push({ dayKey: priorYMD, label: "Prior", o: prior.o, h: prior.h, l: prior.l, c: prior.c, v: prior.v });
  if (pivot) out.push({ dayKey: pivotUTCYMD, label: "Pivot", o: pivot.o, h: pivot.h, l: pivot.l, c: pivot.c, v: pivot.v });
  if (next) out.push({ dayKey: nextYMD, label: "Next", o: next.o, h: next.h, l: next.l, c: next.c, v: next.v });

  return {
    ok: true as const,
    provider: "coinbase" as const,
    timezoneUsed: "UTC" as const,
    sessionDayYMD: pivotUTCYMD,
    candles: out,
    rawCount: norm.length,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const symbolRaw = String(body?.symbol ?? "").trim();
    const pivotISO = String(body?.pivotISO ?? "").trim();

    if (!symbolRaw) {
      return NextResponse.json({ ok: false, error: "Missing symbol" }, { status: 400 });
    }
    if (!pivotISO) {
      return NextResponse.json({ ok: false, error: "Missing pivotISO" }, { status: 400 });
    }

    const pivotDate = new Date(pivotISO);
    if (Number.isNaN(pivotDate.getTime())) {
      return NextResponse.json({ ok: false, error: "Invalid pivotISO datetime" }, { status: 400 });
    }

    const crypto = isCryptoSymbol(symbolRaw);

    if (crypto) {
      const pivotUTCYMD = ymdInTimeZone(pivotDate, "UTC");
      const res = await fetchCoinbase3Day(symbolRaw, pivotUTCYMD);
      if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 502 });

      // NOTE: no duplicate ok key — res already includes ok:true
      return NextResponse.json({
        kind: "crypto",
        symbol: symbolRaw.toUpperCase(),
        pivotISO,
        bucketRule: "UTC day (00:00–24:00 UTC)",
        ...res,
      });
    } else {
      const sessionYMD = ymdInTimeZone(pivotDate, "America/New_York");
      const res = await fetchPolygon3Day(symbolRaw, sessionYMD);
      if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 502 });

      // NOTE: no duplicate ok key — res already includes ok:true
      return NextResponse.json({
        kind: "stock",
        symbol: symbolRaw.toUpperCase(),
        pivotISO,
        bucketRule: "America/New_York session day (TradingView-style day label)",
        ...res,
      });
    }
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ? String(e.message) : "Unknown error" },
      { status: 500 }
    );
  }
}
