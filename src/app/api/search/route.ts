import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const result = await yahooFinance.search(query, {
      quotesCount: 8,
      newsCount: 0,
    });

    const results = (result.quotes ?? [])
      .filter((q) => q.quoteType === "EQUITY" || q.quoteType === "ETF")
      .map((q) => ({
        symbol: q.symbol,
        name: "longname" in q ? q.longname : ("shortname" in q ? q.shortname : q.symbol),
        exchange: "exchange" in q ? q.exchange : "",
        type: q.quoteType,
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] });
  }
}
