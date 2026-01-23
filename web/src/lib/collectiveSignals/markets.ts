// src/lib/collectiveSignals/markets.ts
// Market state ingestion: simple risk-on/risk-off + volatility indicators

import type { MarketState } from "./types";

const LOG_PREFIX = "[collectiveSignals/markets]";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type QuoteData = {
  symbol: string;
  price?: number;
  change?: number;
  changePct?: number;
  previousClose?: number;
};

// ---------------------------------------------------------------------------
// Free Market Data Endpoints
// ---------------------------------------------------------------------------

/**
 * Fetch quote from Yahoo Finance (unofficial chart endpoint)
 * This is a commonly used free endpoint that doesn't require API keys.
 */
async function fetchYahooQuote(symbol: string): Promise<QuoteData | null> {
  // Yahoo Finance chart API - returns recent price data
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; URA/1.0)",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`${LOG_PREFIX} Yahoo quote for ${symbol} returned ${res.status}`);
      return null;
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];

    if (!result) return null;

    const meta = result.meta;
    const price = meta?.regularMarketPrice;
    const previousClose = meta?.chartPreviousClose || meta?.previousClose;

    if (typeof price !== "number") return null;

    const change = typeof previousClose === "number" ? price - previousClose : undefined;
    const changePct = typeof previousClose === "number" && previousClose > 0
      ? ((price - previousClose) / previousClose) * 100
      : undefined;

    return {
      symbol,
      price,
      previousClose,
      change,
      changePct,
    };
  } catch (err: any) {
    console.error(`${LOG_PREFIX} Yahoo quote error for ${symbol}:`, err?.message);
    return null;
  }
}

/**
 * Fallback: Stooq free endpoint (CSV format)
 * https://stooq.com/q/l/?s=spy.us&f=sd2t2ohlcv&h&e=csv
 */
async function fetchStooqQuote(symbol: string): Promise<QuoteData | null> {
  const stooqSymbol = `${symbol.toLowerCase()}.us`;
  const url = `https://stooq.com/q/l/?s=${stooqSymbol}&f=sd2t2ohlcv&h&e=csv`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; URA/1.0)" },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const text = await res.text();
    const lines = text.trim().split("\n");

    if (lines.length < 2) return null;

    // CSV format: Symbol,Date,Time,Open,High,Low,Close,Volume
    const values = lines[1].split(",");
    const close = parseFloat(values[6]);

    if (isNaN(close)) return null;

    return {
      symbol,
      price: close,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main Market Fetch
// ---------------------------------------------------------------------------

async function fetchQuote(symbol: string): Promise<QuoteData | null> {
  // Try Yahoo first, then Stooq as fallback
  const yahoo = await fetchYahooQuote(symbol);
  if (yahoo) return yahoo;

  const stooq = await fetchStooqQuote(symbol);
  return stooq;
}

export async function getMarketState(): Promise<MarketState> {
  console.log(`${LOG_PREFIX} Fetching market data...`);

  // Fetch key indices in parallel
  const [spyQuote, qqqQuote, vixQuote] = await Promise.all([
    fetchQuote("SPY"),   // S&P 500 ETF
    fetchQuote("QQQ"),   // Nasdaq-100 ETF
    fetchQuote("^VIX"),  // VIX volatility index
  ]);

  const sp500ChangePct = spyQuote?.changePct;
  const nasdaqChangePct = qqqQuote?.changePct;
  const vixLevel = vixQuote?.price;

  console.log(`${LOG_PREFIX} Market snapshot:`, {
    sp500ChangePct: sp500ChangePct?.toFixed(2),
    nasdaqChangePct: nasdaqChangePct?.toFixed(2),
    vixLevel: vixLevel?.toFixed(2),
  });

  // Determine risk tone
  let riskTone: MarketState["riskTone"] = "mixed";
  if (typeof sp500ChangePct === "number" && typeof nasdaqChangePct === "number") {
    if (sp500ChangePct > 0.2 && nasdaqChangePct > 0.2) {
      riskTone = "risk_on";
    } else if (sp500ChangePct < -0.2 && nasdaqChangePct < -0.2) {
      riskTone = "risk_off";
    }
  }

  // Determine volatility from VIX level and change
  let volatility: MarketState["volatility"] = "unknown";
  if (typeof vixLevel === "number") {
    // VIX interpretation:
    // < 15: low volatility
    // 15-20: moderate
    // 20-25: elevated
    // > 25: high volatility
    if (vixLevel < 15) {
      volatility = "contracting";
    } else if (vixLevel >= 20) {
      volatility = "expanding";
    } else {
      volatility = "flat";
    }
  }

  // Determine breadth
  let breadth: MarketState["breadth"] = "unknown";
  if (typeof sp500ChangePct === "number" && typeof nasdaqChangePct === "number") {
    const diff = Math.abs(sp500ChangePct - nasdaqChangePct);
    const sameDirection = (sp500ChangePct >= 0 && nasdaqChangePct >= 0) ||
                         (sp500ChangePct < 0 && nasdaqChangePct < 0);

    if (sameDirection && diff < 0.5) {
      breadth = "broad";
    } else if (!sameDirection || diff > 1.5) {
      breadth = "narrow";
    } else {
      breadth = "mixed";
    }
  }

  // Build rationale
  const rationales: string[] = [];

  if (riskTone === "risk_on") {
    rationales.push("equities advancing");
  } else if (riskTone === "risk_off") {
    rationales.push("equities retreating");
  }

  if (volatility === "expanding" && typeof vixLevel === "number") {
    rationales.push(`elevated volatility (VIX ${vixLevel.toFixed(1)})`);
  } else if (volatility === "contracting") {
    rationales.push("low volatility");
  }

  if (breadth === "narrow") {
    rationales.push("divergent index moves");
  } else if (breadth === "broad") {
    rationales.push("broad participation");
  }

  const rationale = rationales.length > 0
    ? rationales.join("; ")
    : "Market data limited";

  const result: MarketState = {
    riskTone,
    volatility,
    breadth,
    snapshot: {
      sp500ChangePct: sp500ChangePct !== undefined ? Math.round(sp500ChangePct * 100) / 100 : undefined,
      nasdaqChangePct: nasdaqChangePct !== undefined ? Math.round(nasdaqChangePct * 100) / 100 : undefined,
      vixLevel: vixLevel !== undefined ? Math.round(vixLevel * 10) / 10 : undefined,
    },
    rationale,
  };

  console.log(`${LOG_PREFIX} Market state:`, {
    riskTone: result.riskTone,
    volatility: result.volatility,
    breadth: result.breadth,
  });

  return result;
}
