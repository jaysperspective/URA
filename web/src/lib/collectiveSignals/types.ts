// src/lib/collectiveSignals/types.ts
// Strict types for collective signals (news + markets)

export type NewsItem = {
  title: string;
  source?: string;
  url?: string;
  publishedAt?: string; // ISO if possible
};

export type NewsCategoryKey =
  | "geopolitics"
  | "economy"
  | "markets"
  | "technology"
  | "climate"
  | "public_health"
  | "labor"
  | "justice"
  | "culture"
  | "science"
  | "security"
  | "other";

export type NewsCategory = {
  key: NewsCategoryKey;
  count: number;
  sampleTitles: string[]; // max 2
};

export type NewsThemes = {
  categories: NewsCategory[];
  tempo: {
    level: "low" | "medium" | "high";
    rationale: string; // short
  };
};

export type MarketState = {
  riskTone: "risk_on" | "risk_off" | "mixed";
  volatility: "contracting" | "expanding" | "flat" | "unknown";
  breadth: "broad" | "narrow" | "mixed" | "unknown";
  snapshot: {
    sp500ChangePct?: number;
    nasdaqChangePct?: number;
    vixLevel?: number;
  };
  rationale: string; // short
};

export type CollectiveSignals = {
  asOfISO: string;
  news?: {
    items: NewsItem[]; // store raw
    themes: NewsThemes; // processed
  };
  markets?: MarketState;
  notes?: string[]; // warnings like "news unavailable"
};

// For API response extension
export type CollectiveSignalsResponse = {
  newsThemes?: NewsCategory[];
  tempo?: {
    level: "low" | "medium" | "high";
    rationale: string;
  };
  markets?: {
    riskTone: "risk_on" | "risk_off" | "mixed";
    volatility: "contracting" | "expanding" | "flat" | "unknown";
    breadth: "broad" | "narrow" | "mixed" | "unknown";
    snapshot: {
      sp500ChangePct?: number;
      nasdaqChangePct?: number;
      vixLevel?: number;
    };
    rationale: string;
  };
  asOfISO: string;
  notes?: string[];
};
