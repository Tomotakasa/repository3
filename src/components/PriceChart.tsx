"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { ChartDataPoint } from "@/types";

interface Props {
  symbol: string;
  currentPrice?: number;
}

const PERIODS = ["1W", "1M", "3M", "6M", "1Y", "5Y"] as const;
type Period = (typeof PERIODS)[number];

export default function PriceChart({ symbol, currentPrice }: Props) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [period, setPeriod] = useState<Period>("3M");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stock/${encodeURIComponent(symbol)}/chart?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [symbol, period]);

  const isPositive =
    data.length >= 2
      ? data[data.length - 1].close >= data[0].close
      : (currentPrice ?? 0) >= 0;

  const color = isPositive ? "#22c55e" : "#ef4444";

  const minPrice = data.length ? Math.min(...data.map((d) => d.low || d.close)) : 0;
  const maxPrice = data.length ? Math.max(...data.map((d) => d.high || d.close)) : 0;
  const padding = (maxPrice - minPrice) * 0.05;

  return (
    <div className="w-full">
      {/* Period selector */}
      <div className="flex gap-1 mb-4">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              period === p
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-gray-500">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
          チャートデータが取得できませんでした
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return period === "5Y"
                  ? d.getFullYear().toString()
                  : `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              domain={[minPrice - padding, maxPrice + padding]}
              tickFormatter={(v) => v.toFixed(0)}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#9ca3af" }}
              itemStyle={{ color: "#f3f4f6" }}
              formatter={(value: number) => [value.toFixed(2), "終値"]}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${symbol})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
