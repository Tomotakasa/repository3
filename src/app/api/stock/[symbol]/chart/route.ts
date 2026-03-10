import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

const periodToInterval: Record<string, { period1: string; interval: "1d" | "1wk" | "1mo" }> = {
  "1W":  { period1: "-7d",  interval: "1d" },
  "1M":  { period1: "-1mo", interval: "1d" },
  "3M":  { period1: "-3mo", interval: "1d" },
  "6M":  { period1: "-6mo", interval: "1wk" },
  "1Y":  { period1: "-1y",  interval: "1wk" },
  "5Y":  { period1: "-5y",  interval: "1mo" },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const period = req.nextUrl.searchParams.get("period") ?? "3M";

  const config = periodToInterval[period] ?? periodToInterval["3M"];

  try {
    const now = new Date();
    let period1 = new Date(now);

    if (config.period1 === "-7d")  period1.setDate(period1.getDate() - 7);
    else if (config.period1 === "-1mo") period1.setMonth(period1.getMonth() - 1);
    else if (config.period1 === "-3mo") period1.setMonth(period1.getMonth() - 3);
    else if (config.period1 === "-6mo") period1.setMonth(period1.getMonth() - 6);
    else if (config.period1 === "-1y")  period1.setFullYear(period1.getFullYear() - 1);
    else if (config.period1 === "-5y")  period1.setFullYear(period1.getFullYear() - 5);

    const historical = await yahooFinance.historical(symbol.toUpperCase(), {
      period1: period1.toISOString().split("T")[0],
      period2: now.toISOString().split("T")[0],
      interval: config.interval,
    });

    const data = historical.map((item) => ({
      date: item.date.toISOString().split("T")[0],
      open: item.open ?? 0,
      high: item.high ?? 0,
      low: item.low ?? 0,
      close: item.close ?? 0,
      volume: item.volume ?? 0,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error(`Failed to fetch chart for ${symbol}:`, error);
    return NextResponse.json([], { status: 200 });
  }
}
