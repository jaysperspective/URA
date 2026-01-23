// src/lib/collectiveSignals/markets.ts
// Market state ingestion: simple risk-on/risk-off + volatility indicators

import type { MarketState } from "./types";

const LOG_PREFIX = "[collectiveSignals/markets]";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const FETCH_TIMEOUT_MS = 8000; // 8 second timeout
const MAX_RETRIES = 1;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type QuoteData = {
  symbol: string;
  price?: number;
  change?: number;
  changePct?: number;
  previousClose?: number;
  marketTime?: number; // Unix timestamp of last market update
  isStale?: boolean;   // True if data is from a previous session (weekend/holiday)
};

// ---------------------------------------------------------------------------
// Fetch with timeout + retry
// ---------------------------------------------------------------------------

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = MAX_RETRIES
): Promise<Response | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options, FETCH_TIMEOUT_MS);
      if (res.ok) return res;

      // Don't retry on 4xx errors (client errors)
      if (res.status >= 400 && res.status < 500) {
        console.warn(`${LOG_PREFIX} Client error ${res.status}, not retrying`);
        return null;
      }

      // Retry on 5xx errors
      if (attempt < maxRetries) {
        console.warn(`${LOG_PREFIX} Server error ${res.status}, retrying (${attempt + 1}/${maxRetries})`);
        continue;
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.warn(`${LOG_PREFIX} Request timed out (${FETCH_TIMEOUT_MS}ms)`);
      } else {
        console.warn(`${LOG_PREFIX} Fetch error: ${err?.message}`);
      }

      if (attempt < maxRetries) {
        console.warn(`${LOG_PREFIX} Retrying (${attempt + 1}/${maxRetries})`);
        continue;
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Free Market Data Endpoints
// ---------------------------------------------------------------------------

/**
 * Fetch quote from Yahoo Finance (unofficial chart endpoint)
 * This is a commonly used free endpoint that doesn't require API keys.
 */
/**
 * Check if market data is stale (weekend, holiday, or after-hours)
 * Returns true if the market timestamp is not from today (US Eastern time)
 */
function isMarketDataStale(marketTimeUnix: number | undefined): boolean {
  if (typeof marketTimeUnix !== "number") return true;

  const now = new Date();
  const marketDate = new Date(marketTimeUnix * 1000);

  // Get dates in US Eastern timezone for comparison
  const nowET = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const marketET = new Date(marketDate.toLocaleString("en-US", { timeZone: "America/New_York" }));

  // Compare year, month, day
  const isSameDay =
    nowET.getFullYear() === marketET.getFullYear() &&
    nowET.getMonth() === marketET.getMonth() &&
    nowET.getDate() === marketET.getDate();

  // Also check if it's weekend (Saturday = 6, Sunday = 0)
  const dayOfWeek = nowET.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // If it's weekend, data will be stale
  // If market timestamp is not from today, data is stale
  return isWeekend || !isSameDay;
}

async function fetchYahooQuote(symbol: string): Promise<(QuoteData & { dayOverDayChangePct?: number }) | null> {
  // Yahoo Finance chart API - returns recent price data
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;

  try {
    const res = await fetchWithRetry(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; URA/1.0)",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res) return null;

    const json = await res.json();
    const result = json?.chart?.result?.[0];

    if (!result) return null;

    const meta = result.meta;
    const price = meta?.regularMarketPrice;
    const previousClose = meta?.chartPreviousClose || meta?.previousClose;
    const marketTime = meta?.regularMarketTime; // Unix timestamp

    // Check if data is stale (weekend/holiday/after-hours)
    const isStale = isMarketDataStale(marketTime);

    // Get historical closes for VIX change calculation
    const closes = result?.indicators?.quote?.[0]?.close;

    // Find yesterday's close (for VIX day-over-day change)
    let yesterdayClose: number | undefined;
    if (Array.isArray(closes) && closes.length >= 2) {
      // Get the second-to-last valid close (yesterday)
      for (let i = closes.length - 2; i >= 0; i--) {
        if (typeof closes[i] === "number") {
          yesterdayClose = closes[i];
          break;
        }
      }
    }

    if (typeof price !== "number") return null;

    const change = typeof previousClose === "number" ? price - previousClose : undefined;
    const changePct = typeof previousClose === "number" && previousClose > 0
      ? ((price - previousClose) / previousClose) * 100
      : undefined;

    // For VIX, also calculate day-over-day change
    let dayOverDayChangePct: number | undefined;
    if (typeof yesterdayClose === "number" && yesterdayClose > 0 && typeof price === "number") {
      dayOverDayChangePct = ((price - yesterdayClose) / yesterdayClose) * 100;
    }

    return {
      symbol,
      price,
      previousClose,
      change,
      changePct,
      marketTime,
      isStale,
      // Store day-over-day for VIX specifically
      ...(symbol === "^VIX" && dayOverDayChangePct !== undefined
        ? { dayOverDayChangePct }
        : {}),
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
  const stooqSymbol = `${symbol.toLowerCase().replace("^", "")}.us`;
  const url = `https://stooq.com/q/l/?s=${stooqSymbol}&f=sd2t2ohlcv&h&e=csv`;

  try {
    const res = await fetchWithRetry(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; URA/1.0)" },
      cache: "no-store",
    });

    if (!res) return null;

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

async function fetchQuote(symbol: string): Promise<(QuoteData & { dayOverDayChangePct?: number }) | null> {
  // Try Yahoo first, then Stooq as fallback
  const yahoo = await fetchYahooQuote(symbol);
  if (yahoo) return yahoo;

  console.warn(`${LOG_PREFIX} Yahoo failed for ${symbol}, trying Stooq fallback`);
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
  const vixDayOverDayPct = (vixQuote as any)?.dayOverDayChangePct;

  // Check if market data is stale (weekend/holiday)
  const isStale = spyQuote?.isStale || qqqQuote?.isStale || false;

  console.log(`${LOG_PREFIX} Market snapshot:`, {
    sp500ChangePct: sp500ChangePct?.toFixed(2),
    nasdaqChangePct: nasdaqChangePct?.toFixed(2),
    vixLevel: vixLevel?.toFixed(2),
    vixDayOverDayPct: vixDayOverDayPct?.toFixed(2),
    isStale,
  });

  // If data is stale (weekend/holiday), return conservative values
  if (isStale) {
    console.log(`${LOG_PREFIX} Market data is stale (weekend/holiday), using conservative values`);

    return {
      riskTone: "mixed",
      volatility: "unknown",
      breadth: "unknown",
      snapshot: {
        sp500ChangePct: sp500ChangePct !== undefined ? Math.round(sp500ChangePct * 100) / 100 : undefined,
        nasdaqChangePct: nasdaqChangePct !== undefined ? Math.round(nasdaqChangePct * 100) / 100 : undefined,
        vixLevel: vixLevel !== undefined ? Math.round(vixLevel * 10) / 10 : undefined,
      },
      rationale: "Markets closed; using last close",
    };
  }

  // Determine risk tone
  let riskTone: MarketState["riskTone"] = "mixed";
  if (typeof sp500ChangePct === "number" && typeof nasdaqChangePct === "number") {
    if (sp500ChangePct > 0.2 && nasdaqChangePct > 0.2) {
      riskTone = "risk_on";
    } else if (sp500ChangePct < -0.2 && nasdaqChangePct < -0.2) {
      riskTone = "risk_off";
    }
  }

  // Determine volatility - prefer day-over-day VIX change, fallback to level
  let volatility: MarketState["volatility"] = "unknown";

  if (typeof vixDayOverDayPct === "number") {
    // Primary: use VIX day-over-day change
    if (vixDayOverDayPct > 5) {
      volatility = "expanding"; // VIX up > 5% today
    } else if (vixDayOverDayPct < -5) {
      volatility = "contracting"; // VIX down > 5% today
    } else {
      volatility = "flat";
    }
  } else if (typeof vixLevel === "number") {
    // Fallback: use VIX level
    // VIX < 15: low volatility environment
    // VIX 15-20: moderate
    // VIX >= 20: elevated
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

  if (volatility === "expanding") {
    if (typeof vixDayOverDayPct === "number" && vixDayOverDayPct > 5) {
      rationales.push(`VIX rising (${vixDayOverDayPct.toFixed(1)}%)`);
    } else if (typeof vixLevel === "number") {
      rationales.push(`elevated volatility (VIX ${vixLevel.toFixed(1)})`);
    }
  } else if (volatility === "contracting") {
    if (typeof vixDayOverDayPct === "number" && vixDayOverDayPct < -5) {
      rationales.push(`VIX falling (${vixDayOverDayPct.toFixed(1)}%)`);
    } else {
      rationales.push("low volatility");
    }
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
