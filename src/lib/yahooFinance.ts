/**
 * Yahoo Finance API helper with crumb/cookie authentication
 */

const YF_QUOTE   = "https://query2.finance.yahoo.com/v7/finance/quote";
const YF_CHART   = "https://query1.finance.yahoo.com/v8/finance/chart";
const YF_SEARCH  = "https://query2.finance.yahoo.com/v1/finance/search";
const YF_CRUMB   = "https://query2.finance.yahoo.com/v1/test/getcrumb";
const YF_HOME    = "https://finance.yahoo.com/";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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

// ── Auth (crumb + cookie) ───────────────────────────────────────────────

let _cookies = "";
let _crumb   = "";
let _authTs  = 0;
const AUTH_TTL = 30 * 60 * 1000; // 30 min

async function getAuth(): Promise<{ cookies: string; crumb: string } | null> {
  if (_crumb && Date.now() - _authTs < AUTH_TTL) {
    return { cookies: _cookies, crumb: _crumb };
  }
  try {
    // 1. Get cookies from Yahoo Finance homepage
    const homeRes = await fetch(YF_HOME, {
      headers: { "User-Agent": UA, "Accept": "text/html" },
      redirect: "follow",
    });
    const setCookies = homeRes.headers.getSetCookie?.() ?? [];
    _cookies = setCookies.map((c) => c.split(";")[0]).join("; ");

    // 2. Get crumb
    const crumbRes = await fetch(YF_CRUMB, {
      headers: { "User-Agent": UA, "Cookie": _cookies },
    });
    if (!crumbRes.ok) return null;
    _crumb  = (await crumbRes.text()).trim();
    _authTs = Date.now();
    return { cookies: _cookies, crumb: _crumb };
  } catch {
    return null;
  }
}

function baseHeaders(cookies: string) {
  return {
    "User-Agent": UA,
    "Accept": "application/json",
    "Cookie": cookies,
  };
}

// ── Quote ──────────────────────────────────────────────────────────────

export async function fetchQuote(symbol: string): Promise<YFQuote | null> {
  const quotes = await fetchQuotes([symbol]);
  return quotes[0] ?? null;
}

export async function fetchQuotes(symbols: string[]): Promise<YFQuote[]> {
  if (symbols.length === 0) return [];
  try {
    const auth = await getAuth();
    const crumbParam = auth ? `&crumb=${encodeURIComponent(auth.crumb)}` : "";
    const cookies    = auth?.cookies ?? "";
    const fields = "shortName,longName,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,averageDailyVolume3Month,marketCap,trailingPE,fiftyTwoWeekHigh,fiftyTwoWeekLow,currency";
    const url = `${YF_QUOTE}?symbols=${symbols.map(encodeURIComponent).join(",")}&fields=${fields}${crumbParam}`;
    const res = await fetch(url, { headers: baseHeaders(cookies) });
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

export async function fetchChart(symbol: string, period = "3M"): Promise<YFChartPoint[]> {
  const cfg = PERIOD_CONFIG[period] ?? PERIOD_CONFIG["3M"];
  try {
    const auth = await getAuth();
    const crumbParam = auth ? `&crumb=${encodeURIComponent(auth.crumb)}` : "";
    const cookies    = auth?.cookies ?? "";
    const url = `${YF_CHART}/${encodeURIComponent(symbol)}?range=${cfg.range}&interval=${cfg.interval}${crumbParam}`;
    const res = await fetch(url, { headers: baseHeaders(cookies) });
    if (!res.ok) return [];
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp ?? [];
    const q  = result.indicators?.quote?.[0] ?? {};
    return timestamps
      .map((ts, i) => ({
        date:   new Date(ts * 1000).toISOString().split("T")[0],
        open:   (q.open   ?? [])[i] ?? 0,
        high:   (q.high   ?? [])[i] ?? 0,
        low:    (q.low    ?? [])[i] ?? 0,
        close:  (q.close  ?? [])[i] ?? 0,
        volume: (q.volume ?? [])[i] ?? 0,
      }))
      .filter((p) => p.close > 0);
  } catch {
    return [];
  }
}

// ── Search ─────────────────────────────────────────────────────────────

export async function searchSymbol(query: string): Promise<YFSearchResult[]> {
  try {
    const auth = await getAuth();
    const crumbParam = auth ? `&crumb=${encodeURIComponent(auth.crumb)}` : "";
    const cookies    = auth?.cookies ?? "";
    const url = `${YF_SEARCH}?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0${crumbParam}`;
    const res = await fetch(url, { headers: baseHeaders(cookies) });
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
    const auth = await getAuth();
    const crumbParam = auth ? `&crumb=${encodeURIComponent(auth.crumb)}` : "";
    const cookies    = auth?.cookies ?? "";
    const url = `${YF_SEARCH}?q=${encodeURIComponent(symbol)}&quotesCount=0&newsCount=5${crumbParam}`;
    const res = await fetch(url, { headers: baseHeaders(cookies) });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.finance?.result?.[0]?.news ?? json?.news ?? []) as YFNewsItem[];
  } catch {
    return [];
  }
}
