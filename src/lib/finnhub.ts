/**
 * Finnhub API helper
 * Free tier: 60 requests/minute
 * API key: set FINNHUB_API_KEY in environment variables
 * Get a free key at https://finnhub.io/
 */

const BASE = "https://finnhub.io/api/v1";

function token() {
  return process.env.FINNHUB_API_KEY ?? "";
}

function url(path: string, params: Record<string, string> = {}) {
  const q = new URLSearchParams({ ...params, token: token() });
  return `${BASE}${path}?${q}`;
}

// ── Compatible types (same field names as yahooFinance exports) ──────────

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

// ── Finnhub raw types ────────────────────────────────────────────────────

interface FHQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // day high
  l: number;  // day low
  o: number;  // day open
  pc: number; // prev close
  v?: number; // volume (not always present in free tier)
}

interface FHProfile {
  name?: string;
  ticker?: string;
  marketCapitalization?: number; // in millions USD
  currency?: string;
  exchange?: string;
  finnhubIndustry?: string;
}

interface FHMetric {
  metric?: {
    "52WeekHigh"?: number;
    "52WeekLow"?: number;
    peBasicExclExtraTTM?: number;
  };
}

interface FHCandle {
  s: string; // status: "ok" | "no_data"
  t?: number[];
  o?: number[];
  h?: number[];
  l?: number[];
  c?: number[];
  v?: number[];
}

interface FHSearchResult {
  symbol: string;
  description?: string;
  displaySymbol?: string;
  type?: string;
}

interface FHNewsItem {
  headline: string;
  url: string;
  source?: string;
  datetime?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────

async function safeFetch<T>(u: string): Promise<T | null> {
  try {
    const res = await fetch(u, { headers: { "Accept": "application/json" } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// Map Finnhub type string → Yahoo-compatible quoteType string
function mapType(t: string): string {
  const m: Record<string, string> = {
    "Common Stock": "EQUITY",
    "ETP": "ETF",
    "ETF": "ETF",
    "Index": "INDEX",
    "DEPOSITARY_RECEIPT": "EQUITY",
  };
  return m[t] ?? t;
}

// ── Quote ────────────────────────────────────────────────────────────────

export async function fetchQuote(symbol: string): Promise<YFQuote | null> {
  const quotes = await fetchQuotes([symbol]);
  return quotes[0] ?? null;
}

export async function fetchQuotes(symbols: string[]): Promise<YFQuote[]> {
  if (symbols.length === 0) return [];

  const results = await Promise.allSettled(
    symbols.map(async (sym) => {
      const [quote, profile, metrics] = await Promise.all([
        safeFetch<FHQuote>(url("/quote", { symbol: sym })),
        safeFetch<FHProfile>(url("/stock/profile2", { symbol: sym })),
        safeFetch<FHMetric>(url("/stock/metric", { symbol: sym, metric: "all" })),
      ]);

      if (!quote || !quote.c) return null;

      const out: YFQuote = {
        symbol: sym,
        shortName: profile?.name,
        longName: profile?.name,
        regularMarketPrice: quote.c,
        regularMarketChange: quote.d,
        regularMarketChangePercent: quote.dp,
        regularMarketVolume: quote.v,
        currency: profile?.currency ?? "USD",
        // marketCap from profile is in millions
        marketCap: profile?.marketCapitalization
          ? profile.marketCapitalization * 1_000_000
          : undefined,
        trailingPE: metrics?.metric?.peBasicExclExtraTTM,
        fiftyTwoWeekHigh: metrics?.metric?.["52WeekHigh"],
        fiftyTwoWeekLow: metrics?.metric?.["52WeekLow"],
      };
      return out;
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<YFQuote> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);
}

// ── Chart ────────────────────────────────────────────────────────────────

const PERIOD_CONFIG: Record<string, { resolution: string; days: number }> = {
  "1W": { resolution: "D",  days: 7   },
  "1M": { resolution: "D",  days: 30  },
  "3M": { resolution: "D",  days: 90  },
  "6M": { resolution: "W",  days: 180 },
  "1Y": { resolution: "W",  days: 365 },
  "5Y": { resolution: "M",  days: 1825 },
};

export async function fetchChart(symbol: string, period = "3M"): Promise<YFChartPoint[]> {
  const cfg = PERIOD_CONFIG[period] ?? PERIOD_CONFIG["3M"];
  const to = Math.floor(Date.now() / 1000);
  const from = to - cfg.days * 86400;

  const data = await safeFetch<FHCandle>(
    url("/stock/candle", {
      symbol,
      resolution: cfg.resolution,
      from: String(from),
      to: String(to),
    })
  );

  if (!data || data.s !== "ok" || !data.t) return [];

  return data.t.map((ts, i) => ({
    date:   new Date(ts * 1000).toISOString().split("T")[0],
    open:   (data.o ?? [])[i] ?? 0,
    high:   (data.h ?? [])[i] ?? 0,
    low:    (data.l ?? [])[i] ?? 0,
    close:  (data.c ?? [])[i] ?? 0,
    volume: (data.v ?? [])[i] ?? 0,
  })).filter((p) => p.close > 0);
}

// ── Search ───────────────────────────────────────────────────────────────

export async function searchSymbol(query: string): Promise<YFSearchResult[]> {
  const data = await safeFetch<{ count: number; result: FHSearchResult[] }>(
    url("/search", { q: query })
  );
  if (!data) return [];

  return (data.result ?? []).map((r) => ({
    symbol:    r.symbol,
    shortname: r.description,
    longname:  r.description,
    exchange:  "",
    quoteType: mapType(r.type ?? ""),
  }));
}

// ── News ─────────────────────────────────────────────────────────────────

export async function fetchNews(symbol: string): Promise<YFNewsItem[]> {
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 30 * 86400 * 1000).toISOString().split("T")[0];

  const data = await safeFetch<FHNewsItem[]>(
    url("/company-news", { symbol, from, to })
  );
  if (!data) return [];

  return data.slice(0, 10).map((n) => ({
    title:               n.headline,
    link:                n.url,
    publisher:           n.source,
    providerPublishTime: n.datetime,
  }));
}
