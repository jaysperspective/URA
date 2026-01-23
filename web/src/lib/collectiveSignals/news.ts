// src/lib/collectiveSignals/news.ts
// News ingestion: fetch headlines + categorize into themes (no LLM needed)

import type { NewsItem, NewsCategoryKey, NewsThemes } from "./types";

const LOG_PREFIX = "[collectiveSignals/news]";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

type NewsProvider = "google_rss" | "rss" | "gdelt";

function getNewsProvider(): NewsProvider {
  const env = process.env.NEWS_PROVIDER?.toLowerCase();
  if (env === "gdelt") return "gdelt";
  if (env === "rss") return "rss";
  return "google_rss"; // default
}

function getCustomRssUrls(): string[] {
  const urls = process.env.NEWS_RSS_URLS;
  if (!urls) return [];
  return urls.split(",").map((u) => u.trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Category Keywords (deterministic classification)
// Priority order matters: first match wins
// ---------------------------------------------------------------------------

// Priority order: higher priority categories should be checked first
const CATEGORY_PRIORITY: NewsCategoryKey[] = [
  "markets",      // Financial-specific terms first
  "economy",      // Economic policy/indicators
  "geopolitics",  // International relations, conflicts
  "security",     // Domestic security issues
  "technology",   // Tech/AI
  "climate",      // Weather/environment
  "public_health",
  "labor",
  "justice",
  "science",
  "culture",
  "other",
];

const CATEGORY_KEYWORDS: Record<NewsCategoryKey, string[]> = {
  geopolitics: [
    "war", "ceasefire", "israel", "gaza", "ukraine", "russia", "china", "iran",
    "nato", "missile", "sanctions", "diplomat", "embassy", "treaty", "invasion",
    "military", "troops", "border", "conflict", "territory", "regime", "summit",
    "alliance", "korea", "taiwan", "syria", "lebanon", "yemen", "africa",
    "palestine", "hamas", "hezbollah", "kremlin", "beijing", "tehran",
  ],
  economy: [
    "fed", "federal reserve", "inflation", "jobs report", "recession", "unemployment",
    "gdp", "interest rate", "central bank", "economic", "deficit",
    "debt ceiling", "tariff", "trade war", "import", "export", "manufacturing",
    "consumer spending", "retail sales", "housing market", "cpi", "ppi",
    "monetary policy", "fiscal", "treasury secretary",
  ],
  markets: [
    "stock", "stocks", "dow", "s&p", "nasdaq", "market", "rally", "crash",
    "earnings", "bond", "yield", "treasury", "ipo", "merger", "acquisition",
    "crypto", "bitcoin", "etf", "hedge fund", "wall street", "investor",
    "trading", "volatility", "vix", "correction", "bull market", "bear market",
    "shares", "equity", "futures", "commodities", "gold price", "oil price",
  ],
  technology: [
    "ai", "artificial intelligence", "chip", "semiconductor", "openai", "google",
    "microsoft", "apple", "amazon", "meta", "tiktok", "regulation", "antitrust",
    "tech", "software", "data", "privacy", "cyber", "hack", "breach", "startup",
    "nvidia", "tesla", "spacex", "robot", "automation", "chatgpt", "machine learning",
  ],
  climate: [
    "storm", "hurricane", "wildfire", "drought", "flood", "heat wave", "climate",
    "weather", "tornado", "earthquake", "tsunami", "carbon", "emissions",
    "renewable", "solar energy", "wind energy", "energy", "oil", "gas", "pipeline",
    "environment", "pollution", "arctic", "glacier", "sea level",
  ],
  public_health: [
    "covid", "pandemic", "vaccine", "outbreak", "virus", "disease", "health",
    "hospital", "cdc", "who", "fda", "drug", "pharmaceutical", "treatment",
    "epidemic", "infection", "mental health", "overdose", "opioid", "fentanyl",
  ],
  labor: [
    "strike", "union", "worker", "wage", "layoff", "hiring", "job cut",
    "workforce", "labor", "employment", "minimum wage",
    "gig economy", "remote work", "resignation", "walkout",
  ],
  justice: [
    "court", "judge", "verdict", "trial", "lawsuit", "supreme court", "ruling",
    "prosecution", "indictment", "arrest", "crime", "police", "prison",
    "sentence", "appeal", "constitutional", "rights", "civil", "attorney",
    "doj", "fbi investigation",
  ],
  culture: [
    "movie", "film", "music", "album", "concert", "award", "oscar", "grammy",
    "celebrity", "sport", "game", "team", "olympics", "championship", "nfl",
    "nba", "soccer", "fashion", "art", "museum", "book", "streaming",
    "super bowl", "world cup",
  ],
  science: [
    "nasa", "space", "mars", "moon landing", "satellite", "rocket", "discovery",
    "research", "study", "scientists", "breakthrough", "experiment", "physics",
    "biology", "astronomy", "genetics", "quantum", "nobel",
  ],
  security: [
    "terror", "attack", "shooting", "explosion", "threat", "fbi", "cia",
    "intelligence", "surveillance", "defense", "homeland", "emergency",
    "evacuate", "hostage", "extremist", "bomb",
  ],
  other: [], // Catch-all
};

// ---------------------------------------------------------------------------
// RSS Parsing (simple, no heavy dependencies)
// ---------------------------------------------------------------------------

function extractRssItems(xmlText: string): NewsItem[] {
  const items: NewsItem[] = [];

  // Simple regex-based extraction for <item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];

    const titleMatch = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i.exec(itemXml);
    const linkMatch = /<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i.exec(itemXml);
    const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(itemXml);
    const sourceMatch = /<source[^>]*>([\s\S]*?)<\/source>/i.exec(itemXml);

    const title = titleMatch?.[1]?.trim().replace(/<[^>]*>/g, "") || "";
    if (!title) continue;

    items.push({
      title,
      url: linkMatch?.[1]?.trim(),
      publishedAt: pubDateMatch?.[1]?.trim(),
      source: sourceMatch?.[1]?.trim().replace(/<[^>]*>/g, ""),
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Title Normalization (deduplication + source suffix removal)
// ---------------------------------------------------------------------------

/**
 * Normalize title for deduplication:
 * - Trim whitespace
 * - Collapse multiple spaces
 * - Remove common source suffixes like " - CNN", " | Reuters", etc.
 * - Lowercase for comparison
 */
function normalizeTitle(title: string): string {
  let normalized = title.trim();

  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, " ");

  // Remove common source suffixes
  // Patterns: " - Source", " | Source", " — Source", " – Source"
  normalized = normalized.replace(/\s*[-–—|]\s*[A-Z][A-Za-z0-9\s&'.]+$/i, "");

  // Remove trailing source in parentheses like "(CNN)"
  normalized = normalized.replace(/\s*\([A-Z][A-Za-z0-9\s&'.]+\)\s*$/i, "");

  return normalized.toLowerCase().trim();
}

// ---------------------------------------------------------------------------
// News Fetching
// ---------------------------------------------------------------------------

async function fetchGoogleNewsRss(): Promise<NewsItem[]> {
  // Google News RSS - top headlines
  const url = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; URA/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`${LOG_PREFIX} Google News RSS returned ${res.status}`);
      return [];
    }

    const text = await res.text();
    return extractRssItems(text);
  } catch (err: any) {
    console.error(`${LOG_PREFIX} Google News RSS error:`, err?.message);
    return [];
  }
}

async function fetchCustomRss(urls: string[]): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  for (const url of urls.slice(0, 5)) {
    // Limit to 5 feeds
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; URA/1.0)",
          Accept: "application/rss+xml, application/xml, text/xml",
        },
        cache: "no-store",
      });

      if (!res.ok) continue;

      const text = await res.text();
      const items = extractRssItems(text);
      allItems.push(...items);
    } catch {
      // Skip failed feeds
    }
  }

  return allItems;
}

async function fetchGdeltNews(): Promise<NewsItem[]> {
  // GDELT 2.1 DOC API - free, no key required
  // Returns recent news articles
  const url =
    "https://api.gdeltproject.org/api/v2/doc/doc?query=&mode=artlist&maxrecords=20&format=json";

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; URA/1.0)" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`${LOG_PREFIX} GDELT API returned ${res.status}`);
      return [];
    }

    const json = await res.json();
    const articles = json?.articles || [];

    return articles.map((a: any) => ({
      title: a.title || "",
      url: a.url,
      source: a.domain,
      publishedAt: a.seendate,
    }));
  } catch (err: any) {
    console.error(`${LOG_PREFIX} GDELT error:`, err?.message);
    return [];
  }
}

export async function fetchNewsHeadlines(): Promise<{
  items: NewsItem[];
  provider: string;
}> {
  const provider = getNewsProvider();
  let items: NewsItem[] = [];

  console.log(`${LOG_PREFIX} Fetching news with provider: ${provider}`);

  switch (provider) {
    case "google_rss":
      items = await fetchGoogleNewsRss();
      break;
    case "rss":
      const urls = getCustomRssUrls();
      if (urls.length > 0) {
        items = await fetchCustomRss(urls);
      } else {
        // Fallback to Google News if no custom URLs
        items = await fetchGoogleNewsRss();
      }
      break;
    case "gdelt":
      items = await fetchGdeltNews();
      break;
  }

  // Deduplicate by normalized title
  const seen = new Set<string>();
  const unique: NewsItem[] = [];
  for (const item of items) {
    const normalizedKey = normalizeTitle(item.title);
    // Skip very short titles and duplicates
    if (normalizedKey.length >= 15 && !seen.has(normalizedKey)) {
      seen.add(normalizedKey);
      unique.push(item);
    }
  }

  // Limit to 20 headlines
  const limited = unique.slice(0, 20);

  console.log(`${LOG_PREFIX} Fetched ${items.length} raw, ${limited.length} unique headlines`);

  return { items: limited, provider };
}

// ---------------------------------------------------------------------------
// Categorization (deterministic, priority-based, no LLM)
// ---------------------------------------------------------------------------

/**
 * Categorize headline using priority-based matching.
 * First matching category wins (based on CATEGORY_PRIORITY order).
 */
function categorizeHeadline(title: string): NewsCategoryKey {
  const lower = title.toLowerCase();

  // Check categories in priority order
  for (const category of CATEGORY_PRIORITY) {
    if (category === "other") continue;

    const keywords = CATEGORY_KEYWORDS[category];
    for (const keyword of keywords) {
      // Word boundary matching to avoid partial matches
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(lower)) {
        return category;
      }
    }
  }

  return "other";
}

export function categorizeNews(items: NewsItem[]): NewsThemes {
  // Count headlines per category
  const counts: Record<NewsCategoryKey, { count: number; titles: string[] }> = {
    geopolitics: { count: 0, titles: [] },
    economy: { count: 0, titles: [] },
    markets: { count: 0, titles: [] },
    technology: { count: 0, titles: [] },
    climate: { count: 0, titles: [] },
    public_health: { count: 0, titles: [] },
    labor: { count: 0, titles: [] },
    justice: { count: 0, titles: [] },
    culture: { count: 0, titles: [] },
    science: { count: 0, titles: [] },
    security: { count: 0, titles: [] },
    other: { count: 0, titles: [] },
  };

  for (const item of items) {
    const cat = categorizeHeadline(item.title);
    counts[cat].count++;
    // Max 2 sample titles per category
    if (counts[cat].titles.length < 2) {
      counts[cat].titles.push(item.title);
    }
  }

  // Log "other" count for keyword refinement
  if (counts.other.count > 0) {
    console.log(`${LOG_PREFIX} Unclassified headlines (other): ${counts.other.count}`);
    if (counts.other.titles.length > 0) {
      console.log(`${LOG_PREFIX} Sample unclassified: "${counts.other.titles[0]}"`);
    }
  }

  // Build categories array, sorted by count descending
  // Exclude "other" from the main list
  const categories = Object.entries(counts)
    .filter(([key, v]) => v.count > 0 && key !== "other")
    .map(([key, v]) => ({
      key: key as NewsCategoryKey,
      count: v.count,
      sampleTitles: v.titles,
    }))
    .sort((a, b) => b.count - a.count);

  // Compute tempo based on variety and volume
  const totalHeadlines = items.length;
  const categoryCount = categories.length;
  const otherCount = counts.other.count;

  let tempoLevel: "low" | "medium" | "high";
  let tempoRationale: string;

  // Force low if too few headlines or too few distinct categories
  if (totalHeadlines < 5 || categoryCount < 2) {
    tempoLevel = "low";
    tempoRationale = "Limited news activity";
  } else if (totalHeadlines >= 15 && categoryCount >= 5) {
    tempoLevel = "high";
    tempoRationale = `High volume (${totalHeadlines} headlines) across ${categoryCount} domains`;
  } else {
    tempoLevel = "medium";
    tempoRationale = `Moderate activity across ${categoryCount} domains`;
  }

  console.log(
    `${LOG_PREFIX} Categorized ${totalHeadlines} headlines: ${categoryCount} categories, ${otherCount} other, tempo=${tempoLevel}`
  );

  return {
    categories,
    tempo: {
      level: tempoLevel,
      rationale: tempoRationale,
    },
  };
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export async function getNewsThemes(): Promise<{
  items: NewsItem[];
  themes: NewsThemes;
  provider: string;
} | null> {
  try {
    const { items, provider } = await fetchNewsHeadlines();

    if (items.length === 0) {
      return null;
    }

    const themes = categorizeNews(items);

    return { items, themes, provider };
  } catch (err: any) {
    console.error(`${LOG_PREFIX} getNewsThemes error:`, err?.message);
    return null;
  }
}
