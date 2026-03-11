import { NextRequest, NextResponse } from "next/server";
import { searchSymbol } from "@/lib/finnhub";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") ?? "";
  if (!query) return NextResponse.json({ results: [] });

  const raw = await searchSymbol(query);

  const results = raw
    .filter((r) =>
      r.quoteType === "EQUITY" || r.quoteType === "ETF" || r.quoteType === "INDEX"
    )
    .map((r) => ({
      symbol:   r.symbol,
      name:     r.longname ?? r.shortname ?? r.symbol,
      exchange: r.exchange ?? "",
      type:     r.quoteType ?? "",
    }));

  return NextResponse.json({ results });
}
