// src/app/api/pivot/auto/route.ts
import { NextResponse } from "next/server";
import { autoPickPivot } from "@/lib/pivot/autoPivot";
import { fetchCryptoOHLCV, fetchStockOHLCV, type Market, type Timeframe } from "@/lib/marketData";

function ymd(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const market = (url.searchParams.get("market") ?? "stock") as Market;
    const tf = (url.searchParams.get("tf") ?? "1d") as Timeframe;
    const symbol = (url.searchParams.get("symbol") ?? "").trim();

    const lookbackDays = Math.max(30, Math.min(1500, Number(url.searchParams.get("lookbackDays") ?? 365)));

    if (!symbol) {
      return NextResponse.json({ ok: false, error: "Missing symbol." }, { status: 400 });
    }

    const now = new Date();
    const from = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

    let bars;
    if (market === "stock") {
      bars = await fetchStockOHLCV({
        symbol,
        timeframe: tf,
        fromYMD: ymd(from),
        toYMD: ymd(now),
      });
    } else {
      // for crypto, treat symbol as productId like BTC-USD
      bars = await fetchCryptoOHLCV({
        productId: symbol,
        timeframe: tf,
        startISO: from.toISOString(),
        endISO: now.toISOString(),
      });
    }

    if (!bars || bars.length < 60) {
      return NextResponse.json(
        { ok: false, error: "Not enough data (need at least ~60 bars)." },
        { status: 400 }
      );
    }

    const res = autoPickPivot({ bars, evalBars: 120, structureBars: 10 });

    return NextResponse.json({
      ok: true,
      market,
      tf,
      symbol,
      best: res.best,
      top: res.top,
      meta: res.meta,
      asOf: now.toISOString(),
      nBars: bars.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
