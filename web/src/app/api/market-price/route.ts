// src/app/api/market-price/route.ts
import { NextResponse } from "next/server";
import { marketPriceInputSchema, type MarketPriceInput } from "@/lib/schemas/market";

function isCryptoSymbol(symbolRaw: string) {
  return symbolRaw.toUpperCase().trim().includes("-");
}

async function safeJson(r: Response) {
  const text = await r.text().catch(() => "");
  try {
    return { ok: true as const, json: JSON.parse(text), text };
  } catch {
    return { ok: false as const, json: null as any, text };
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = marketPriceInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json({ ok: false, error: "Missing or invalid symbol" }, { status: 400 });
    }

    const body: MarketPriceInput = parseResult.data;
    const symbol = body.symbol; // Already transformed to uppercase

    // --- CRYPTO (Coinbase Exchange) ---
    if (isCryptoSymbol(symbol)) {
      const url = `https://api.exchange.coinbase.com/products/${encodeURIComponent(symbol)}/ticker`;
      const r = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "URA-Gann-Chart/1.0" },
        next: { revalidate: 0 },
      });

      if (!r.ok) {
        const t = await r.text().catch(() => "");
        return NextResponse.json(
          { ok: false, error: `Coinbase error (${r.status}): ${t || r.statusText}` },
          { status: 502 }
        );
      }

      const j: any = await r.json();
      const price = Number(j?.price);
      if (!Number.isFinite(price)) {
        return NextResponse.json({ ok: false, error: "Invalid price from Coinbase" }, { status: 502 });
      }

      return NextResponse.json({
        ok: true,
        kind: "crypto",
        provider: "coinbase",
        symbol,
        price,
        asOfISO: new Date().toISOString(),
        note: "Spot ticker price (Coinbase Exchange).",
      });
    }

    // --- STOCK (Polygon) ---
    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing POLYGON_API_KEY in .env.local" }, { status: 500 });
    }

    // Use PREV daily aggregate: reliable on most plans and consistent with 1D workflow
    const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}/prev?adjusted=true&apiKey=${encodeURIComponent(
      apiKey
    )}`;

    const r = await fetch(url, { next: { revalidate: 0 } });

    const parsed = await safeJson(r);
    if (!r.ok || !parsed.ok) {
      const snippet = (parsed.text || "").slice(0, 180);
      return NextResponse.json(
        {
          ok: false,
          error: `Polygon prev-agg failed (${r.status}). ${parsed.ok ? "" : "Non-JSON response. "}${snippet}`,
        },
        { status: 502 }
      );
    }

    const j: any = parsed.json;
    const row = Array.isArray(j?.results) ? j.results[0] : null;
    const price = Number(row?.c); // previous close
    const t = Number(row?.t); // ms timestamp

    if (!Number.isFinite(price)) {
      return NextResponse.json(
        { ok: false, error: "Polygon prev-agg returned no close price (c)." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      kind: "stock",
      provider: "polygon",
      symbol,
      price,
      asOfISO: Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString(),
      note: "Most recent completed session close (Polygon prev daily agg).",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ? String(e.message) : "Unknown error" }, { status: 500 });
  }
}
