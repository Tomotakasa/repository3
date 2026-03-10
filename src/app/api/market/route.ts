import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

const MARKET_INDICES = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^DJI",  name: "Dow Jones" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^N225", name: "日経225" },
  { symbol: "^HSI",  name: "香港ハンセン" },
];

export async function GET() {
  try {
    const results = await Promise.allSettled(
      MARKET_INDICES.map(({ symbol }) =>
        yahooFinance.quote(symbol, {
          fields: [
            "symbol",
            "regularMarketPrice",
            "regularMarketChange",
            "regularMarketChangePercent",
          ],
        })
      )
    );

    const indices = results
      .map((r, i) => {
        if (r.status !== "fulfilled") return null;
        const q = r.value;
        return {
          symbol: MARKET_INDICES[i].symbol,
          name: MARKET_INDICES[i].name,
          value: q.regularMarketPrice ?? 0,
          change: q.regularMarketChange ?? 0,
          changePercent: q.regularMarketChangePercent ?? 0,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ indices });
  } catch (error) {
    console.error("Market indices error:", error);
    return NextResponse.json({ indices: [] });
  }
}
