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
// ---------------------------------------------------------------------------

const CATEGORY_KEYWORDS: Record<NewsCategoryKey, string[]> = {
  geopolitics: [
    "war", "ceasefire", "israel", "gaza", "ukraine", "russia", "china", "iran",
    "nato", "missile", "sanctions", "diplomat", "embassy", "treaty", "invasion",
    "military", "troops", "border", "conflict", "territory", "regime", "summit",
    "alliance", "korea", "taiwan", "syria", "lebanon", "yemen", "africa",
  ],
  economy: [
    "fed", "federal reserve", "inflation", "jobs", "recession", "unemployment",
    "gdp", "interest rate", "central bank", "economy", "economic", "deficit",
    "debt", "tariff", "trade war", "import", "export", "manufacturing",
    "consumer spending", "retail sales", "housing market",
  ],
  markets: [
    "stock", "stocks", "dow", "s&p", "nasdaq", "market", "rally", "crash",
    "earnings", "bond", "yield", "treasury", "ipo", "merger", "acquisition",
    "crypto", "bitcoin", "etf", "hedge fund", "wall street", "investor",
    "trading", "volatility", "vix", "correction", "bull", "bear",
  ],
  technology: [
    "ai", "artificial intelligence", "chip", "semiconductor", "openai", "google",
    "microsoft", "apple", "amazon", "meta", "tiktok", "regulation", "antitrust",
    "tech", "software", "data", "privacy", "cyber", "hack", "breach", "startup",
    "nvidia", "tesla", "spacex", "robot", "automation",
  ],
  climate: [
    "storm", "hurricane", "wildfire", "drought", "flood", "heat", "climate",
    "weather", "tornado", "earthquake", "tsunami", "carbon", "emissions",
    "renewable", "solar", "wind", "energy", "oil", "gas", "pipeline",
    "environment", "pollution", "arctic", "glacier",
  ],
  public_health: [
    "covid", "pandemic", "vaccine", "outbreak", "virus", "disease", "health",
    "hospital", "cdc", "who", "fda", "drug", "pharmaceutical", "treatment",
    "epidemic", "infection", "mental health", "overdose", "opioid",
  ],
  labor: [
    "strike", "union", "worker", "wage", "layoff", "hiring", "job cut",
    "unemployment", "workforce", "labor", "employment", "minimum wage",
    "gig economy", "remote work", "resignation",
  ],
  justice: [
    "court", "judge", "verdict", "trial", "lawsuit", "supreme court", "ruling",
    "prosecution", "indictment", "arrest", "crime", "police", "prison",
    "sentence", "appeal", "constitutional", "rights", "civil", "attorney",
  ],
  culture: [
    "movie", "film", "music", "album", "concert", "award", "oscar", "grammy",
    "celebrity", "sport", "game", "team", "olympics", "championship", "nfl",
    "nba", "soccer", "fashion", "art", "museum", "book", "streaming",
  ],
  science: [
    "nasa", "space", "mars", "moon", "satellite", "rocket", "discovery",
    "research", "study", "scientists", "breakthrough", "experiment", "physics",
    "biology", "astronomy", "genetics", "quantum",
  ],
  security: [
    "terror", "attack", "shooting", "explosion", "threat", "fbi", "cia",
    "intelligence", "surveillance", "defense", "homeland", "emergency",
    "evacuate", "hostage", "extremist",
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

  // Deduplicate by title (case-insensitive)
  const seen = new Set<string>();
  const unique: NewsItem[] = [];
  for (const item of items) {
    const key = item.title.toLowerCase().trim();
    if (!seen.has(key) && item.title.length > 10) {
      seen.add(key);
      unique.push(item);
    }
  }

  // Limit to 20 headlines
  const limited = unique.slice(0, 20);

  console.log(`${LOG_PREFIX} Fetched ${items.length} raw, ${limited.length} unique headlines`);

  return { items: limited, provider };
}

// ---------------------------------------------------------------------------
// Categorization (deterministic, no LLM)
// ---------------------------------------------------------------------------

function categorizeHeadline(title: string): NewsCategoryKey {
  const lower = title.toLowerCase();

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "other") continue;

    for (const keyword of keywords) {
      // Word boundary matching to avoid partial matches
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(lower)) {
        return category as NewsCategoryKey;
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
    if (counts[cat].titles.length < 2) {
      counts[cat].titles.push(item.title);
    }
  }

  // Build categories array, sorted by count descending
  const categories = Object.entries(counts)
    .filter(([_, v]) => v.count > 0)
    .map(([key, v]) => ({
      key: key as NewsCategoryKey,
      count: v.count,
      sampleTitles: v.titles,
    }))
    .sort((a, b) => b.count - a.count);

  // Compute tempo based on variety and volume
  const totalHeadlines = items.length;
  const categoryCount = categories.filter((c) => c.key !== "other").length;

  let tempoLevel: "low" | "medium" | "high";
  let tempoRationale: string;

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
    `${LOG_PREFIX} Categorized ${totalHeadlines} headlines into ${categoryCount} categories, tempo=${tempoLevel}`
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
