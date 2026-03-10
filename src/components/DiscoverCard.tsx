"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, Plus, BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import type { DiscoverStock, StockQuote } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/stockService";
import RecommendationBadge from "./RecommendationBadge";
import RiskBadge from "./RiskBadge";
import PriceChart from "./PriceChart";

interface Props {
  stock: DiscoverStock;
  quote?: StockQuote | null;
  onAddToPortfolio: (symbol: string, name: string) => void;
  onAddToWatchlist: (symbol: string, name: string) => void;
  isInWatchlist: boolean;
}

const trendConfig = {
  BULLISH: { label: "強気", color: "text-green-400", icon: TrendingUp },
  BEARISH: { label: "弱気", color: "text-red-400", icon: TrendingDown },
  NEUTRAL: { label: "中立", color: "text-yellow-400", icon: Minus },
};

export default function DiscoverCard({ stock, quote, onAddToPortfolio, onAddToWatchlist, isInWatchlist }: Props) {
  const [showChart, setShowChart] = useState(false);
  const trend = trendConfig[stock.trend];
  const TrendIcon = trend.icon;

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-bold text-lg">{stock.symbol}</span>
              <RiskBadge riskLevel={stock.riskLevel} />
            </div>
            <p className="text-gray-400 text-sm">{stock.name}</p>
            <p className="text-gray-500 text-xs mt-0.5">{stock.sector}</p>
          </div>
          <div className="text-right">
            {quote ? (
              <>
                <div className="text-white font-bold text-xl">
                  {formatCurrency(quote.price, quote.currency)}
                </div>
                <div className={`flex items-center justify-end gap-1 text-sm ${quote.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {quote.changePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {formatPercent(quote.changePercent)}
                </div>
              </>
            ) : (
              <div className="text-gray-600 text-sm">読み込み中...</div>
            )}
          </div>
        </div>

        {/* Trend & potential */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex items-center gap-1 text-sm font-medium ${trend.color}`}>
            <TrendIcon className="w-4 h-4" />
            {trend.label}トレンド
          </div>
          <span className="text-gray-600">•</span>
          <span className="text-gray-300 text-sm">期待リターン: <span className="text-blue-400 font-medium">{stock.potentialReturn}</span></span>
        </div>

        {/* Reason */}
        <div className="bg-gray-700/50 rounded-xl px-4 py-3 mb-4">
          <p className="text-gray-300 text-sm leading-relaxed">{stock.reason}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowChart(!showChart)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors text-xs font-medium"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            チャート
            {showChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            onClick={() => onAddToWatchlist(stock.symbol, stock.name)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-colors text-xs font-medium ${
              isInWatchlist
                ? "bg-blue-600/30 text-blue-300 border border-blue-600/40"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
            }`}
          >
            {isInWatchlist ? "ウォッチ中" : "ウォッチ追加"}
          </button>
          <button
            onClick={() => onAddToPortfolio(stock.symbol, stock.name)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            ポートフォリオへ
          </button>
        </div>
      </div>

      {showChart && (
        <div className="px-5 pb-5">
          <PriceChart symbol={stock.symbol} currentPrice={quote?.price} />
        </div>
      )}
    </div>
  );
}
