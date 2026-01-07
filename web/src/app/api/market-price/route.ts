// src/app/api/market-price/route.ts
import { NextResponse } from "next/server";

function isCryptoSymbol(symbolRaw: string) {
  return symbolRaw.toUpperCase().trim().includes("-");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const symbolRaw = String(body?.symbol ?? "").trim();
    if (!symbolRaw) return NextResponse.json({ ok: false, error: "Missing symbol" }, { status: 400 });

    const symbol = symbolRaw.toUpperCase();

    if (isCryptoSymbol(symbol)) {
      // Coinbase Exchange ticker
      const url = `https://api.exchange.coinbase.com/products/${encodeURIComponent(symbol)}/ticker`;
      const r = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "URA-Gann-Chart/1.0" },
        next: { revalidate: 0 },
      });

      if (!r.ok) {
        const text = await r.text().catch(() => "");
        return NextResponse.json(
          { ok: false, error: `Coinbase error (${r.status}): ${text || r.statusText}` },
          { status: 502 }
        );
      }

      const j: any = await r.json();
      const price = Number(j?.price);
      if (!Number.isFinite(price)) return NextResponse.json({ ok: false, error: "Invalid price from Coinbase" }, { status: 502 });

      return NextResponse.json({
        ok: true,
        kind: "crypto",
        provider: "coinbase",
        symbol,
        price,
        asOfISO: new Date().toISOString(),
      });
    }

    // Stock: Polygon last trade
    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: "Missing POLYGON_API_KEY in .env.local" }, { status: 500 });

    const url = `https://api.polygon.io/v2/last/trade/${encodeURIComponent(symbol)}?apiKey=${encodeURIComponent(apiKey)}`;
    const r = await fetch(url, { next: { revalidate: 0 } });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Polygon error (${r.status}): ${text || r.statusText}` },
        { status: 502 }
      );
    }

    const j: any = await r.json();
    const price = Number(j?.results?.p);
    if (!Number.isFinite(price)) return NextResponse.json({ ok: false, error: "Invalid price from Polygon" }, { status: 502 });

    return NextResponse.json({
      ok: true,
      kind: "stock",
      provider: "polygon",
      symbol,
      price,
      asOfISO: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ? String(e.message) : "Unknown error" }, { status: 500 });
  }
}
