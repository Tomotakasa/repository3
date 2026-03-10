/**
 * Direct Yahoo Finance API helper
 * Uses the public Yahoo Finance endpoints to avoid yahoo-finance2 TypeScript issues.
 */

const YF_CHART   = "https://query1.finance.yahoo.com/v8/finance/chart";
const YF_SEARCH  = "https://query2.finance.yahoo.com/v1/finance/search";
const YF_QUOTE   = "https://query2.finance.yahoo.com/v7/finance/quote";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "application/json",
};

// ── Types ──────────────────────────────────────────────────────────────

export interface YFQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  averageDailyVolume3Month?: number;
  marketCap?: number;
  trailingPE?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  currency?: string;
}

export interface YFChartPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface YFSearchResult {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  quoteType?: string;
}

export interface YFNewsItem {
  title: string;
  link: string;
  publisher?: string;
  providerPublishTime?: number;
}

// ── Quote ──────────────────────────────────────────────────────────────

export async function fetchQuote(symbol: string): Promise<YFQuote | null> {
  try {
    const url = `${YF_QUOTE}?symbols=${encodeURIComponent(symbol)}&fields=shortName,longName,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,averageDailyVolume3Month,marketCap,trailingPE,fiftyTwoWeekHigh,fiftyTwoWeekLow,currency`;
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.quoteResponse?.result?.[0];
    if (!result) return null;
    return result as YFQuote;
  } catch {
    return null;
  }
}

export async function fetchQuotes(symbols: string[]): Promise<YFQuote[]> {
  if (symbols.length === 0) return [];
  try {
    const url = `${YF_QUOTE}?symbols=${symbols.map(encodeURIComponent).join(",")}&fields=shortName,longName,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,averageDailyVolume3Month,marketCap,trailingPE,fiftyTwoWeekHigh,fiftyTwoWeekLow,currency`;
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.quoteResponse?.result ?? []) as YFQuote[];
  } catch {
    return [];
  }
}

// ── Historical / Chart ─────────────────────────────────────────────────

const PERIOD_CONFIG: Record<string, { range: string; interval: string }> = {
  "1W": { range: "5d",  interval: "1d"  },
  "1M": { range: "1mo", interval: "1d"  },
  "3M": { range: "3mo", interval: "1d"  },
  "6M": { range: "6mo", interval: "1wk" },
  "1Y": { range: "1y",  interval: "1wk" },
  "5Y": { range: "5y",  interval: "1mo" },
};

export async function fetchChart(
  symbol: string,
  period = "3M"
): Promise<YFChartPoint[]> {
  const cfg = PERIOD_CONFIG[period] ?? PERIOD_CONFIG["3M"];
  try {
    const url = `${YF_CHART}/${encodeURIComponent(symbol)}?range=${cfg.range}&interval=${cfg.interval}`;
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp ?? [];
    const q = result.indicators?.quote?.[0] ?? {};
    const opens: number[]   = q.open   ?? [];
    const highs: number[]   = q.high   ?? [];
    const lows: number[]    = q.low    ?? [];
    const closes: number[]  = q.close  ?? [];
    const volumes: number[] = q.volume ?? [];

    return timestamps
      .map((ts, i) => ({
        date:   new Date(ts * 1000).toISOString().split("T")[0],
        open:   opens[i]   ?? 0,
        high:   highs[i]   ?? 0,
        low:    lows[i]    ?? 0,
        close:  closes[i]  ?? 0,
        volume: volumes[i] ?? 0,
      }))
      .filter((p) => p.close > 0);
  } catch {
    return [];
  }
}

// ── Search ─────────────────────────────────────────────────────────────

export async function searchSymbol(query: string): Promise<YFSearchResult[]> {
  try {
    const url = `${YF_SEARCH}?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.finance?.result?.[0]?.quotes ?? json?.quotes ?? []) as YFSearchResult[];
  } catch {
    return [];
  }
}

// ── News ────────────────────────────────────────────────────────────────

export async function fetchNews(symbol: string): Promise<YFNewsItem[]> {
  try {
    const url = `${YF_SEARCH}?q=${encodeURIComponent(symbol)}&quotesCount=0&newsCount=5`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.finance?.result?.[0]?.news ?? json?.news ?? []) as YFNewsItem[];
  } catch {
    return [];
  }
}
