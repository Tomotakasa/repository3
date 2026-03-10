"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export default function MarketOverview() {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/market")
      .then((r) => r.json())
      .then((d) => setIndices(d.indices ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-xl px-4 py-3 min-w-[140px] animate-pulse">
            <div className="h-3 bg-gray-700 rounded w-20 mb-2" />
            <div className="h-5 bg-gray-700 rounded w-24 mb-1" />
            <div className="h-3 bg-gray-700 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {indices.map((idx) => {
        const isPositive = idx.changePercent >= 0;
        return (
          <div
            key={idx.symbol}
            className="bg-gray-800 rounded-xl px-4 py-3 min-w-[150px] border border-gray-700 flex-shrink-0"
          >
            <div className="text-gray-400 text-xs font-medium mb-1">{idx.name}</div>
            <div className="text-white font-bold text-lg">
              {idx.value.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? "+" : ""}{idx.changePercent.toFixed(2)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
