import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fetchQuotes } from "@/lib/finnhub";

const client = new Anthropic();

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

// Fallback static data used when Yahoo Finance is unavailable (e.g. server IP blocked)
const FALLBACK_STOCK_DATA = [
  { symbol: "NVDA",   name: "NVIDIA Corporation",        price: 875,   changePercent:  2.3, high52w: 974,  low52w: 435,  marketCap: "2150.0B", pe: "35.2" },
  { symbol: "MSFT",   name: "Microsoft Corporation",     price: 415,   changePercent:  0.8, high52w: 468,  low52w: 309,  marketCap: "3080.0B", pe: "36.1" },
  { symbol: "AAPL",   name: "Apple Inc.",                price: 228,   changePercent: -0.5, high52w: 260,  low52w: 164,  marketCap: "3500.0B", pe: "31.4" },
  { symbol: "GOOGL",  name: "Alphabet Inc.",             price: 175,   changePercent:  1.2, high52w: 208,  low52w: 130,  marketCap: "2180.0B", pe: "23.8" },
  { symbol: "AMZN",   name: "Amazon.com Inc.",           price: 210,   changePercent:  1.5, high52w: 242,  low52w: 144,  marketCap: "2230.0B", pe: "44.2" },
  { symbol: "META",   name: "Meta Platforms Inc.",       price: 580,   changePercent:  3.1, high52w: 638,  low52w: 296,  marketCap: "1480.0B", pe: "28.3" },
  { symbol: "TSLA",   name: "Tesla Inc.",                price: 250,   changePercent: -1.8, high52w: 488,  low52w: 138,  marketCap: "795.0B",  pe: "68.5" },
  { symbol: "JPM",    name: "JPMorgan Chase & Co.",      price: 240,   changePercent:  0.6, high52w: 280,  low52w: 150,  marketCap: "690.0B",  pe: "13.2" },
  { symbol: "V",      name: "Visa Inc.",                 price: 310,   changePercent:  0.4, high52w: 340,  low52w: 227,  marketCap: "635.0B",  pe: "31.8" },
  { symbol: "SPY",    name: "SPDR S&P 500 ETF Trust",   price: 580,   changePercent:  0.7, high52w: 614,  low52w: 449,  marketCap: "N/A",     pe: "N/A"  },
  { symbol: "QQQ",    name: "Invesco QQQ Trust",         price: 495,   changePercent:  1.0, high52w: 540,  low52w: 356,  marketCap: "N/A",     pe: "N/A"  },
  { symbol: "AMD",    name: "Advanced Micro Devices",   price: 165,   changePercent:  2.8, high52w: 228,  low52w: 117,  marketCap: "268.0B",  pe: "N/A"  },
  { symbol: "9984.T", name: "SoftBank Group Corp.",      price: 9800,  changePercent:  1.4, high52w: 12000, low52w: 6000, marketCap: "170.0B", pe: "N/A"  },
  { symbol: "7203.T", name: "Toyota Motor Corporation", price: 3200,  changePercent: -0.3, high52w: 3900, low52w: 2200, marketCap: "460.0B",  pe: "8.5"  },
  { symbol: "6758.T", name: "Sony Group Corporation",   price: 2800,  changePercent:  0.9, high52w: 3300, low52w: 2100, marketCap: "170.0B",  pe: "18.2" },
];

export async function GET(req: NextRequest) {
  const ownedSymbols = req.nextUrl.searchParams.get("owned")?.split(",") ?? [];

  try {
    const candidates = CANDIDATE_SYMBOLS
      .filter((s) => !ownedSymbols.includes(s))
      .slice(0, 15);

    const quotes = await fetchQuotes(candidates);

    const stockData = quotes
      .filter((q) => (q.regularMarketPrice ?? 0) > 0)
      .map((q) => ({
        symbol:        q.symbol,
        name:          q.shortName ?? q.longName ?? q.symbol,
        price:         q.regularMarketPrice          ?? 0,
        changePercent: q.regularMarketChangePercent  ?? 0,
        high52w:       q.fiftyTwoWeekHigh            ?? 0,
        low52w:        q.fiftyTwoWeekLow             ?? 0,
        marketCap:     q.marketCap ? `${(q.marketCap / 1e9).toFixed(1)}B` : "N/A",
        pe:            q.trailingPE?.toFixed(1)      ?? "N/A",
      }));

    // If Yahoo Finance returned no data, fall back to static data
    const effectiveStockData = stockData.length > 0
      ? stockData
      : FALLBACK_STOCK_DATA.filter((s) => !ownedSymbols.includes(s.symbol)).slice(0, 15);

    const stockSummary = effectiveStockData
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
    "trend": "BULLISH",
    "potentialReturn": "期待リターン（例: +15%〜+25%）",
    "riskLevel": "LOW"
  }
]`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: `以下の株式データから上昇が見込まれる銘柄を5つ推薦してください:\n\n${stockSummary}`,
      }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No response");

    let recommendations;
    try {
      const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array");
      recommendations = JSON.parse(jsonMatch[0]);
    } catch {
      recommendations = [];
    }

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const costUsd = inputTokens * (1.0 / 1_000_000) + outputTokens * (5.0 / 1_000_000);
    const usage = { inputTokens, outputTokens, costUsd };

    return NextResponse.json({ recommendations, stockData: effectiveStockData, generatedAt: new Date().toISOString(), usage });
  } catch (error) {
    console.error("Discover error:", error);
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}
