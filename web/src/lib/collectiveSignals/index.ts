// src/lib/collectiveSignals/index.ts
// Main entry point for collective signals with caching

import type { CollectiveSignals, CollectiveSignalsResponse, MarketState, NewsThemes } from "./types";
import { getNewsThemes } from "./news";
import { getMarketState } from "./markets";

export * from "./types";

const LOG_PREFIX = "[collectiveSignals]";

// ---------------------------------------------------------------------------
// Cache Configuration
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type CacheEntry = {
  signals: CollectiveSignals;
  expiresAt: number;
};

const signalsCache = new Map<string, CacheEntry>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLocalDayKey(tz: string, date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;

    return `${y}-${m}-${d}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function getCacheKey(dateKey: string, tz: string): string {
  return `collectiveSignals:${dateKey}:${tz}`;
}

// Cleanup old cache entries periodically
let lastCleanup = Date.now();
function cleanupCache() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;

  for (const [key, entry] of signalsCache.entries()) {
    if (entry.expiresAt < now) {
      signalsCache.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Main Fetch Function
// ---------------------------------------------------------------------------

export async function getCollectiveSignals(params: {
  timezone?: string;
  skipCache?: boolean;
}): Promise<CollectiveSignals> {
  const { timezone = "UTC", skipCache = false } = params;
  const now = new Date();

  cleanupCache();

  // Check cache
  const dateKey = getLocalDayKey(timezone, now);
  const cacheKey = getCacheKey(dateKey, timezone);

  if (!skipCache) {
    const cached = signalsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.log(`${LOG_PREFIX} Cache HIT: ${cacheKey}`);
      return cached.signals;
    }
  }

  console.log(`${LOG_PREFIX} Cache MISS: ${cacheKey}, fetching fresh data...`);

  const asOfISO = now.toISOString();
  const notes: string[] = [];

  // Fetch news and markets in parallel
  const [newsResult, marketsResult] = await Promise.all([
    getNewsThemes().catch((err) => {
      console.error(`${LOG_PREFIX} News fetch error:`, err);
      return null;
    }),
    getMarketState().catch((err) => {
      console.error(`${LOG_PREFIX} Markets fetch error:`, err);
      return null;
    }),
  ]);

  // Build signals object
  const signals: CollectiveSignals = {
    asOfISO,
    notes,
  };

  // News
  if (newsResult) {
    signals.news = {
      items: newsResult.items,
      themes: newsResult.themes,
    };
    console.log(`${LOG_PREFIX} News: ${newsResult.items.length} headlines via ${newsResult.provider}`);
  } else {
    notes.push("news unavailable");
    // Provide empty themes structure
    signals.news = {
      items: [],
      themes: {
        categories: [],
        tempo: { level: "low", rationale: "News data unavailable" },
      },
    };
  }

  // Markets
  if (marketsResult) {
    signals.markets = marketsResult;
  } else {
    notes.push("markets unavailable");
    // Provide unknown state
    signals.markets = {
      riskTone: "mixed",
      volatility: "unknown",
      breadth: "unknown",
      snapshot: {},
      rationale: "Market data unavailable",
    };
  }

  // Cache the result
  signalsCache.set(cacheKey, {
    signals,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  console.log(`${LOG_PREFIX} Cached signals with key: ${cacheKey}`);

  return signals;
}

// ---------------------------------------------------------------------------
// Transform for API Response
// ---------------------------------------------------------------------------

export function signalsToResponse(signals: CollectiveSignals): CollectiveSignalsResponse {
  return {
    newsThemes: signals.news?.themes.categories,
    tempo: signals.news?.themes.tempo,
    markets: signals.markets,
    asOfISO: signals.asOfISO,
    notes: signals.notes?.length ? signals.notes : undefined,
  };
}

// ---------------------------------------------------------------------------
// Build LLM Prompt Brief
// ---------------------------------------------------------------------------

export function buildSignalsBrief(signals: CollectiveSignals): string {
  const lines: string[] = [];

  // News themes summary
  if (signals.news?.themes.categories.length) {
    const topCategories = signals.news.themes.categories
      .slice(0, 4)
      .map((c) => `${c.key}(${c.count})`)
      .join(", ");
    lines.push(`Dominant categories: ${topCategories}`);
    lines.push(`Tempo: ${signals.news.themes.tempo.level} (${signals.news.themes.tempo.rationale})`);
  } else {
    lines.push("News: unavailable");
  }

  // Markets summary
  if (signals.markets) {
    const m = signals.markets;
    const marketParts: string[] = [];

    if (m.riskTone !== "mixed") {
      marketParts.push(m.riskTone.replace("_", " "));
    }
    if (m.volatility !== "unknown") {
      marketParts.push(`volatility ${m.volatility}`);
    }
    if (m.breadth !== "unknown") {
      marketParts.push(`breadth ${m.breadth}`);
    }

    if (marketParts.length > 0) {
      lines.push(`Markets: ${marketParts.join(" + ")}`);
    } else {
      lines.push("Markets: mixed/uncertain");
    }
  } else {
    lines.push("Markets: unavailable");
  }

  return lines.join("\n");
}
