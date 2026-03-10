"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Trash2, BarChart2, Brain, ChevronDown, ChevronUp } from "lucide-react";
import type { PortfolioItem, StockQuote, StockAnalysis } from "@/types";
import { formatCurrency, formatPercent, calculatePortfolioGain, formatLargeNumber } from "@/lib/stockService";
import RecommendationBadge from "./RecommendationBadge";
import RiskBadge from "./RiskBadge";
import PriceChart from "./PriceChart";

interface Props {
  item: PortfolioItem;
  quote?: StockQuote | null;
  onRemove: (symbol: string) => void;
}

export default function PortfolioCard({ item, quote, onRemove }: Props) {
  const [showChart, setShowChart] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const currentPrice = quote?.price ?? 0;
  const { gainLoss, gainLossPercent } = calculatePortfolioGain(
    currentPrice,
    item.purchasePrice,
    item.quantity
  );
  const currentValue = currentPrice * item.quantity;
  const costBasis = item.purchasePrice * item.quantity;
  const isPositive = gainLoss >= 0;
  const dayChange = quote ? quote.change * item.quantity : 0;

  const handleAnalyze = async () => {
    if (analysis) {
      setShowAnalysis(!showAnalysis);
      return;
    }
    setAnalyzing(true);
    setShowAnalysis(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: item.symbol,
          purchasePrice: item.purchasePrice,
          quantity: item.quantity,
        }),
      });
      const data = await res.json();
      if (!data.error) setAnalysis(data);
    } catch {
      // ignore
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
      {/* Main info */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">{item.symbol}</span>
              {analysis && <RecommendationBadge recommendation={analysis.recommendation} size="sm" />}
            </div>
            <p className="text-gray-400 text-sm">{item.name}</p>
          </div>
          <div className="text-right">
            <div className="text-white font-bold text-xl">
              {currentPrice ? formatCurrency(currentPrice, quote?.currency) : "---"}
            </div>
            {quote && (
              <div className={`flex items-center justify-end gap-1 text-sm ${quote.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                {quote.changePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {formatPercent(quote.changePercent)}
              </div>
            )}
          </div>
        </div>

        {/* Holdings summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-700/50 rounded-xl px-3 py-2">
            <p className="text-gray-500 text-xs mb-0.5">保有数量</p>
            <p className="text-white font-semibold text-sm">{item.quantity.toLocaleString()}</p>
          </div>
          <div className="bg-gray-700/50 rounded-xl px-3 py-2">
            <p className="text-gray-500 text-xs mb-0.5">取得単価</p>
            <p className="text-white font-semibold text-sm">{formatCurrency(item.purchasePrice)}</p>
          </div>
          <div className="bg-gray-700/50 rounded-xl px-3 py-2">
            <p className="text-gray-500 text-xs mb-0.5">評価額</p>
            <p className="text-white font-semibold text-sm">{currentValue ? formatCurrency(currentValue) : "---"}</p>
          </div>
        </div>

        {/* P&L */}
        {currentPrice > 0 && (
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${isPositive ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
            <div>
              <p className={`text-xs font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
                含み{isPositive ? "益" : "損"}
              </p>
              <p className={`font-bold text-lg ${isPositive ? "text-green-400" : "text-red-400"}`}>
                {isPositive ? "+" : ""}{formatCurrency(gainLoss)}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xs font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>損益率</p>
              <p className={`font-bold text-lg ${isPositive ? "text-green-400" : "text-red-400"}`}>
                {formatPercent(gainLossPercent)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs">本日損益</p>
              <p className={`font-semibold text-sm ${dayChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                {dayChange >= 0 ? "+" : ""}{formatCurrency(dayChange)}
              </p>
            </div>
          </div>
        )}

        {/* Additional info */}
        {quote && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { label: "時価総額", value: quote.marketCap ? formatLargeNumber(quote.marketCap) : "N/A" },
              { label: "PER", value: quote.peRatio ? quote.peRatio.toFixed(1) : "N/A" },
              { label: "52W高値", value: quote.high52Week ? formatCurrency(quote.high52Week) : "N/A" },
              { label: "52W安値", value: quote.low52Week ? formatCurrency(quote.low52Week) : "N/A" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-gray-500 text-xs">{label}</p>
                <p className="text-gray-300 text-xs font-medium">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-5 pb-3 flex gap-2">
        <button
          onClick={() => setShowChart(!showChart)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors text-xs font-medium"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          チャート
          {showChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition-colors text-xs font-medium border border-blue-600/30 disabled:opacity-50"
        >
          <Brain className="w-3.5 h-3.5" />
          {analyzing ? "分析中..." : "AI分析"}
          {analysis && !analyzing && (showAnalysis ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
        </button>
        <button
          onClick={() => onRemove(item.symbol)}
          className="p-2 rounded-xl bg-gray-700 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Chart */}
      {showChart && (
        <div className="px-5 pb-5">
          <PriceChart symbol={item.symbol} currentPrice={currentPrice} />
        </div>
      )}

      {/* AI Analysis */}
      {showAnalysis && (
        <div className="px-5 pb-5">
          {analyzing ? (
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Claude AIが分析中...</p>
              </div>
            </div>
          ) : analysis ? (
            <div className="space-y-4 border-t border-gray-700 pt-4">
              <div className="flex items-center gap-3 flex-wrap">
                <RecommendationBadge recommendation={analysis.recommendation} size="lg" />
                <RiskBadge riskLevel={analysis.riskLevel} />
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  analysis.confidence === "HIGH" ? "bg-green-500/20 text-green-400" :
                  analysis.confidence === "MEDIUM" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-gray-500/20 text-gray-400"
                }`}>
                  信頼度: {analysis.confidence === "HIGH" ? "高" : analysis.confidence === "MEDIUM" ? "中" : "低"}
                </span>
                {analysis.targetPrice && (
                  <span className="text-xs text-gray-400">
                    目標株価: <span className="text-white font-semibold">{formatCurrency(analysis.targetPrice)}</span>
                  </span>
                )}
              </div>

              <p className="text-gray-300 text-sm leading-relaxed">{analysis.summary}</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-green-400 text-xs font-semibold mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> 強気要因
                  </h4>
                  <ul className="space-y-1">
                    {analysis.bullishPoints.map((p, i) => (
                      <li key={i} className="text-gray-400 text-xs flex items-start gap-1.5">
                        <span className="text-green-400 mt-0.5">•</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-red-400 text-xs font-semibold mb-2 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> 弱気要因
                  </h4>
                  <ul className="space-y-1">
                    {analysis.bearishPoints.map((p, i) => (
                      <li key={i} className="text-gray-400 text-xs flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5">•</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-1">
                <p className="text-gray-600 text-xs">
                  分析日時: {new Date(analysis.analysisDate).toLocaleString("ja-JP")}
                </p>
                {analysis.usage && (
                  <p className="text-gray-600 text-xs">
                    トークン: {(analysis.usage.inputTokens + analysis.usage.outputTokens).toLocaleString()} · 約 ${analysis.usage.costUsd.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
