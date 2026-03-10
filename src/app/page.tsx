"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Briefcase, Compass,
  ArrowRight, DollarSign, BarChart2, Activity,
} from "lucide-react";
import type { PortfolioItem, StockQuote } from "@/types";
import { getPortfolio, getWatchlist } from "@/lib/portfolioStorage";
import { formatCurrency, formatPercent, calculatePortfolioGain } from "@/lib/stockService";
import MarketOverview from "@/components/MarketOverview";
import NewsPanel from "@/components/NewsPanel";
import PortfolioDonutChart from "@/components/PortfolioDonutChart";

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [watchlist, setWatchlist] = useState<{ symbol: string; name: string; addedAt: string }[]>([]);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  useEffect(() => {
    setPortfolio(getPortfolio());
    setWatchlist(getWatchlist());
  }, []);

  useEffect(() => {
    const allSymbols = [
      ...portfolio.map((p) => p.symbol),
      ...watchlist.map((w) => w.symbol),
    ];
    if (allSymbols.length === 0) return;

    setLoadingQuotes(true);
    Promise.allSettled(
      allSymbols.map((s) =>
        fetch(`/api/stock/${encodeURIComponent(s)}`).then((r) => r.json())
      )
    )
      .then((results) => {
        const map: Record<string, StockQuote> = {};
        results.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value?.symbol) {
            map[allSymbols[i]] = r.value;
          }
        });
        setQuotes(map);
      })
      .finally(() => setLoadingQuotes(false));
  }, [portfolio, watchlist]);

  // Portfolio calculations
  let totalValue = 0;
  let totalCost = 0;
  let dayGainLoss = 0;

  portfolio.forEach((item) => {
    const q = quotes[item.symbol];
    if (q?.price) {
      const { gainLoss } = calculatePortfolioGain(q.price, item.purchasePrice, item.quantity);
      totalValue += q.price * item.quantity;
      totalCost += item.purchasePrice * item.quantity;
      dayGainLoss += (q.change ?? 0) * item.quantity;
    }
  });

  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  const dayGainLossPercent = totalCost > 0 ? (dayGainLoss / totalCost) * 100 : 0;

  const donutData = portfolio
    .map((item) => {
      const q = quotes[item.symbol];
      return {
        name: item.symbol,
        symbol: item.symbol,
        value: q?.price ? q.price * item.quantity : item.purchasePrice * item.quantity,
      };
    })
    .filter((d) => d.value > 0);

  const allSymbols = portfolio.map((p) => p.symbol);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">ダッシュボード</h1>
        <p className="text-gray-400 mt-1">ポートフォリオの概要と市場動向</p>
      </div>

      {/* Market overview */}
      <section>
        <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-3">市場インデックス</h2>
        <MarketOverview />
      </section>

      {/* Portfolio summary cards */}
      {portfolio.length > 0 ? (
        <section>
          <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-3">ポートフォリオサマリー</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "評価額合計",
                value: totalValue > 0 ? formatCurrency(totalValue) : "---",
                icon: DollarSign,
                color: "text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                label: "含み損益",
                value: totalGainLoss !== 0 ? formatCurrency(totalGainLoss) : "---",
                sub: totalGainLossPercent !== 0 ? formatPercent(totalGainLossPercent) : undefined,
                icon: totalGainLoss >= 0 ? TrendingUp : TrendingDown,
                color: totalGainLoss >= 0 ? "text-green-400" : "text-red-400",
                bg: totalGainLoss >= 0 ? "bg-green-500/10" : "bg-red-500/10",
              },
              {
                label: "本日損益",
                value: dayGainLoss !== 0 ? formatCurrency(dayGainLoss) : "---",
                sub: dayGainLossPercent !== 0 ? formatPercent(dayGainLossPercent) : undefined,
                icon: dayGainLoss >= 0 ? TrendingUp : TrendingDown,
                color: dayGainLoss >= 0 ? "text-green-400" : "text-red-400",
                bg: dayGainLoss >= 0 ? "bg-green-500/10" : "bg-red-500/10",
              },
              {
                label: "保有銘柄数",
                value: `${portfolio.length}銘柄`,
                icon: BarChart2,
                color: "text-purple-400",
                bg: "bg-purple-500/10",
              },
            ].map(({ label, value, sub, icon: Icon, color, bg }) => (
              <div key={label} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-gray-400 text-sm">{label}</p>
                <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
                {sub && <p className={`text-sm font-medium mt-0.5 ${color}`}>{sub}</p>}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio donut + top holdings */}
        <div className="lg:col-span-2 space-y-4">
          {portfolio.length > 0 ? (
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">ポートフォリオ構成</h3>
                <Link
                  href="/portfolio"
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors"
                >
                  詳細 <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-shrink-0">
                  <PortfolioDonutChart data={donutData} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="space-y-2">
                    {portfolio.slice(0, 6).map((item) => {
                      const q = quotes[item.symbol];
                      const { gainLossPercent } = calculatePortfolioGain(
                        q?.price ?? 0,
                        item.purchasePrice,
                        item.quantity
                      );
                      const itemValue = (q?.price ?? 0) * item.quantity;
                      const weight = totalValue > 0 ? (itemValue / totalValue) * 100 : 0;
                      return (
                        <div key={item.symbol} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-white font-medium text-sm">{item.symbol}</span>
                            {weight > 0 && (
                              <span className="text-gray-500 text-xs">{weight.toFixed(1)}%</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {q?.price ? (
                              <>
                                <span className="text-gray-300 text-sm">{formatCurrency(q.price * item.quantity)}</span>
                                <span className={`text-xs font-medium ${gainLossPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                                  {formatPercent(gainLossPercent)}
                                </span>
                              </>
                            ) : loadingQuotes ? (
                              <span className="text-gray-600 text-sm">---</span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {portfolio.length > 6 && (
                    <Link href="/portfolio" className="text-gray-500 hover:text-blue-400 text-xs mt-3 block transition-colors">
                      他{portfolio.length - 6}銘柄を表示 →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 text-center">
              <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">ポートフォリオが空です</h3>
              <p className="text-gray-400 text-sm mb-4">保有している株式を追加して資産を管理しましょう</p>
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors text-sm font-medium"
              >
                <Briefcase className="w-4 h-4" />
                ポートフォリオを管理
              </Link>
            </div>
          )}

          {/* Quick discover link */}
          <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-2xl p-5 border border-blue-800/40">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <h3 className="text-white font-semibold">AI銘柄レコメンデーション</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Claudeが市場データを分析し、上昇が見込まれる銘柄を提案します
                </p>
              </div>
            </div>
            <Link
              href="/discover"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors text-sm font-medium"
            >
              <Compass className="w-4 h-4" />
              銘柄を探す <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* News */}
        <div>
          <NewsPanel symbols={allSymbols.length > 0 ? allSymbols : ["AAPL", "MSFT", "NVDA"]} />
        </div>
      </div>
    </div>
  );
}
