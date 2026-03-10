import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import yahooFinance from "yahoo-finance2";

const client = new Anthropic();

// Popular stocks to check for trends
const CANDIDATE_SYMBOLS = [
  // US Tech
  "NVDA", "MSFT", "AAPL", "GOOGL", "AMZN", "META", "TSLA", "AMD", "INTC", "CRM",
  // US Finance
  "JPM", "BAC", "GS", "V", "MA",
  // US Healthcare
  "JNJ", "PFE", "UNH", "ABBV",
  // Japan stocks
  "7203.T", "6758.T", "9984.T", "6861.T", "7974.T",
  // ETFs
  "SPY", "QQQ", "VTI",
];

export async function GET(req: NextRequest) {
  const ownedSymbols = req.nextUrl.searchParams.get("owned")?.split(",") ?? [];

  try {
    // Filter out already owned symbols
    const candidates = CANDIDATE_SYMBOLS.filter(
      (s) => !ownedSymbols.includes(s)
    ).slice(0, 15);

    // Fetch quotes for candidates
    const quotes = await Promise.allSettled(
      candidates.map((s) =>
        yahooFinance.quote(s, {
          fields: [
            "symbol", "shortName", "longName",
            "regularMarketPrice", "regularMarketChangePercent",
            "fiftyTwoWeekHigh", "fiftyTwoWeekLow",
            "regularMarketVolume", "averageDailyVolume3Month",
            "marketCap", "trailingPE",
          ],
        })
      )
    );

    const stockData = quotes
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<Awaited<ReturnType<typeof yahooFinance.quote>>>).value)
      .filter((q) => q.regularMarketPrice)
      .map((q) => ({
        symbol: q.symbol,
        name: q.shortName ?? q.longName ?? q.symbol,
        price: q.regularMarketPrice ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0,
        high52w: q.fiftyTwoWeekHigh ?? 0,
        low52w: q.fiftyTwoWeekLow ?? 0,
        volume: q.regularMarketVolume ?? 0,
        avgVolume: q.averageDailyVolume3Month ?? 0,
        marketCap: q.marketCap ? `${(q.marketCap / 1e9).toFixed(1)}B` : "N/A",
        pe: q.trailingPE?.toFixed(1) ?? "N/A",
      }));

    const stockSummary = stockData
      .map(
        (s) =>
          `${s.symbol} (${s.name}): 現在値=${s.price}, 前日比=${s.changePercent.toFixed(2)}%, ` +
          `52週高値=${s.high52w}, 52週安値=${s.low52w}, 時価総額=${s.marketCap}, PER=${s.pe}`
      )
      .join("\n");

    const systemPrompt = `あなたは優秀な株式アナリストです。提供された株式データから、今後上昇が見込まれる銘柄を5つ選んで推薦してください。
必ず以下のJSON配列形式のみで返答してください（マークダウンなし）:
[
  {
    "symbol": "ティッカーシンボル",
    "name": "企業名",
    "sector": "セクター（テクノロジー、金融など）",
    "reason": "推薦理由（50文字程度）",
    "trend": "BULLISH" | "BEARISH" | "NEUTRAL",
    "potentialReturn": "期待リターン（例: +15%〜+25%）",
    "riskLevel": "LOW" | "MEDIUM" | "HIGH"
  }
]`;

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `以下の株式データから上昇が見込まれる銘柄を5つ推薦してください:\n\n${stockSummary}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No response from Claude");
    }

    let recommendations;
    try {
      const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found");
      recommendations = JSON.parse(jsonMatch[0]);
    } catch {
      recommendations = [];
    }

    return NextResponse.json({
      recommendations,
      stockData,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Discover error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
