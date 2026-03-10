"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Trash2, Plus, BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import type { WatchlistItem, StockQuote } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/stockService";
import PriceChart from "./PriceChart";

interface Props {
  item: WatchlistItem;
  quote?: StockQuote | null;
  onRemove: (symbol: string) => void;
  onAddToPortfolio: (symbol: string, name: string) => void;
}

export default function WatchlistCard({ item, quote, onRemove, onAddToPortfolio }: Props) {
  const [showChart, setShowChart] = useState(false);

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-white font-bold text-lg">{item.symbol}</span>
            <p className="text-gray-400 text-sm">{item.name}</p>
            <p className="text-gray-600 text-xs mt-0.5">
              追加日: {new Date(item.addedAt).toLocaleDateString("ja-JP")}
            </p>
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
                <div className={`text-xs ${quote.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {quote.change >= 0 ? "+" : ""}{formatCurrency(quote.change, quote.currency)}
                </div>
              </>
            ) : (
              <div className="text-gray-600 text-sm animate-pulse">---</div>
            )}
          </div>
        </div>

        {quote && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "出来高", value: quote.volume?.toLocaleString() ?? "N/A" },
              { label: "52W高値", value: quote.high52Week ? formatCurrency(quote.high52Week) : "N/A" },
              { label: "52W安値", value: quote.low52Week ? formatCurrency(quote.low52Week) : "N/A" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-700/50 rounded-xl px-3 py-2 text-center">
                <p className="text-gray-500 text-xs">{label}</p>
                <p className="text-gray-300 text-xs font-medium">{value}</p>
              </div>
            ))}
          </div>
        )}

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
            onClick={() => onAddToPortfolio(item.symbol, item.name)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition-colors text-xs font-medium border border-blue-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            ポートフォリオへ
          </button>
          <button
            onClick={() => onRemove(item.symbol)}
            className="p-2 rounded-xl bg-gray-700 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showChart && (
        <div className="px-5 pb-5">
          <PriceChart symbol={item.symbol} currentPrice={quote?.price} />
        </div>
      )}
    </div>
  );
}
