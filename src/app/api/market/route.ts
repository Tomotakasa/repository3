import { NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/finnhub";

const MARKET_INDICES = [
  { symbol: "^GSPC", name: "S&P 500"   },
  { symbol: "^DJI",  name: "Dow Jones" },
  { symbol: "^IXIC", name: "NASDAQ"    },
  { symbol: "^N225", name: "日経225"   },
  { symbol: "^HSI",  name: "香港ハンセン" },
];

export async function GET() {
  const quotes = await fetchQuotes(MARKET_INDICES.map((m) => m.symbol));

  const indices = MARKET_INDICES.map((m) => {
    const q = quotes.find((q) => q.symbol === m.symbol);
    return {
      symbol:        m.symbol,
      name:          m.name,
      value:         q?.regularMarketPrice         ?? 0,
      change:        q?.regularMarketChange        ?? 0,
      changePercent: q?.regularMarketChangePercent ?? 0,
    };
  }).filter((i) => i.value > 0);

  return NextResponse.json({ indices });
}
