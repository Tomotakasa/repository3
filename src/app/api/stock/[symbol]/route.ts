import { NextRequest, NextResponse } from "next/server";
import { fetchQuote } from "@/lib/finnhub";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const quote = await fetchQuote(symbol.toUpperCase());

  if (!quote) {
    return NextResponse.json(
      { error: `Failed to fetch data for ${symbol}` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    symbol:        quote.symbol,
    name:          quote.shortName ?? quote.longName ?? symbol,
    price:         quote.regularMarketPrice         ?? 0,
    change:        quote.regularMarketChange        ?? 0,
    changePercent: quote.regularMarketChangePercent ?? 0,
    volume:        quote.regularMarketVolume        ?? 0,
    avgVolume:     quote.averageDailyVolume3Month   ?? 0,
    marketCap:     quote.marketCap   ?? null,
    peRatio:       quote.trailingPE  ?? null,
    high52Week:    quote.fiftyTwoWeekHigh ?? null,
    low52Week:     quote.fiftyTwoWeekLow  ?? null,
    currency:      quote.currency ?? "USD",
  });
}
