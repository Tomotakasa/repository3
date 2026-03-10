import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import yahooFinance from "yahoo-finance2";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { symbol, purchasePrice, quantity, context } = await req.json();

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    // Fetch current stock data
    const [quote, historical] = await Promise.allSettled([
      yahooFinance.quote(symbol.toUpperCase()),
      yahooFinance.historical(symbol.toUpperCase(), {
        period1: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        interval: "1wk",
      }),
    ]);

    const quoteData = quote.status === "fulfilled" ? quote.value : null;
    const histData = historical.status === "fulfilled" ? historical.value : [];

    // Build price trend summary
    const prices = histData.map((h) => h.close).filter(Boolean);
    const priceMin = prices.length ? Math.min(...prices as number[]) : 0;
    const priceMax = prices.length ? Math.max(...prices as number[]) : 0;
    const currentPrice = quoteData?.regularMarketPrice ?? 0;

    const stockInfo = `
銘柄: ${quoteData?.longName ?? quoteData?.shortName ?? symbol} (${symbol})
現在値: ${currentPrice} ${quoteData?.currency ?? "USD"}
前日比: ${quoteData?.regularMarketChange?.toFixed(2) ?? "N/A"} (${quoteData?.regularMarketChangePercent?.toFixed(2) ?? "N/A"}%)
時価総額: ${quoteData?.marketCap ? (quoteData.marketCap / 1e9).toFixed(2) + "B" : "N/A"}
PER: ${quoteData?.trailingPE?.toFixed(2) ?? "N/A"}
52週高値: ${quoteData?.fiftyTwoWeekHigh ?? "N/A"}
52週安値: ${quoteData?.fiftyTwoWeekLow ?? "N/A"}
出来高: ${quoteData?.regularMarketVolume?.toLocaleString() ?? "N/A"}
過去90日の価格範囲: ${priceMin.toFixed(2)} - ${priceMax.toFixed(2)}
${purchasePrice ? `取得単価: ${purchasePrice}` : ""}
${quantity ? `保有数量: ${quantity}` : ""}
${purchasePrice && currentPrice ? `含み損益率: ${(((currentPrice - purchasePrice) / purchasePrice) * 100).toFixed(2)}%` : ""}
${context ? `追加情報: ${context}` : ""}
    `.trim();

    const systemPrompt = `あなたは経験豊富な株式アナリストです。提供された株式データを分析し、投資判断をJSON形式で返してください。
分析は客観的かつ詳細に行い、リスクも正直に評価してください。
必ず以下のJSON形式のみで返答してください（マークダウンなし）:
{
  "recommendation": "BUY" | "SELL" | "HOLD",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "targetPrice": 数値 or null,
  "summary": "100文字程度の分析要約",
  "bullishPoints": ["強気要因1", "強気要因2", "強気要因3"],
  "bearishPoints": ["弱気要因1", "弱気要因2", "弱気要因3"],
  "riskLevel": "LOW" | "MEDIUM" | "HIGH"
}`;

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `以下の株式データを分析してください:\n\n${stockInfo}`,
        },
      ],
    });

    // Extract text block
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      analysis = JSON.parse(jsonMatch[0]);
    } catch {
      analysis = {
        recommendation: "HOLD",
        confidence: "LOW",
        targetPrice: null,
        summary: textBlock.text.slice(0, 200),
        bullishPoints: [],
        bearishPoints: [],
        riskLevel: "MEDIUM",
      };
    }

    return NextResponse.json({
      symbol,
      ...analysis,
      analysisDate: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze stock" },
      { status: 500 }
    );
  }
}
