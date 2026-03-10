"use client";

import { useEffect, useState } from "react";
import { Plus, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import type { PortfolioItem, StockQuote } from "@/types";
import { getPortfolio, addToPortfolio, removeFromPortfolio } from "@/lib/portfolioStorage";
import { formatCurrency, formatPercent, calculatePortfolioGain } from "@/lib/stockService";
import AddPortfolioModal from "@/components/AddPortfolioModal";
import PortfolioCard from "@/components/PortfolioCard";
import NewsPanel from "@/components/NewsPanel";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [sortBy, setSortBy] = useState<"symbol" | "value" | "gainLoss" | "gainLossPercent">("value");

  const loadPortfolio = () => {
    setPortfolio(getPortfolio());
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const fetchQuotes = (items: PortfolioItem[]) => {
    if (items.length === 0) return;
    setLoadingQuotes(true);
    Promise.allSettled(
      items.map((item) =>
        fetch(`/api/stock/${encodeURIComponent(item.symbol)}`).then((r) => r.json())
      )
    )
      .then((results) => {
        const map: Record<string, StockQuote> = {};
        results.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value?.symbol) {
            map[items[i].symbol] = r.value;
          }
        });
        setQuotes((prev) => ({ ...prev, ...map }));
      })
      .finally(() => setLoadingQuotes(false));
  };

  useEffect(() => {
    fetchQuotes(portfolio);
  }, [portfolio]);

  const handleAdd = (item: PortfolioItem) => {
    addToPortfolio(item);
    loadPortfolio();
  };

  const handleRemove = (symbol: string) => {
    if (confirm(`${symbol}をポートフォリオから削除しますか？`)) {
      removeFromPortfolio(symbol);
      loadPortfolio();
    }
  };

  // Portfolio totals
  let totalValue = 0, totalCost = 0, dayGainLoss = 0;
  portfolio.forEach((item) => {
    const q = quotes[item.symbol];
    if (q?.price) {
      totalValue += q.price * item.quantity;
      totalCost += item.purchasePrice * item.quantity;
      dayGainLoss += (q.change ?? 0) * item.quantity;
    }
  });
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  // Sort portfolio
  const sortedPortfolio = [...portfolio].sort((a, b) => {
    const qa = quotes[a.symbol];
    const qb = quotes[b.symbol];
    if (sortBy === "symbol") return a.symbol.localeCompare(b.symbol);
    if (sortBy === "value") {
      const va = (qa?.price ?? 0) * a.quantity;
      const vb = (qb?.price ?? 0) * b.quantity;
      return vb - va;
    }
    if (sortBy === "gainLoss") {
      const ga = calculatePortfolioGain(qa?.price ?? 0, a.purchasePrice, a.quantity).gainLoss;
      const gb = calculatePortfolioGain(qb?.price ?? 0, b.purchasePrice, b.quantity).gainLoss;
      return gb - ga;
    }
    if (sortBy === "gainLossPercent") {
      const gpa = calculatePortfolioGain(qa?.price ?? 0, a.purchasePrice, a.quantity).gainLossPercent;
      const gpb = calculatePortfolioGain(qb?.price ?? 0, b.purchasePrice, b.quantity).gainLossPercent;
      return gpb - gpa;
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ポートフォリオ</h1>
          <p className="text-gray-400 mt-1">保有株式の管理とAI分析</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchQuotes(portfolio)}
            disabled={loadingQuotes || portfolio.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingQuotes ? "animate-spin" : ""}`} />
            <span className="hidden sm:block">更新</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            銘柄を追加
          </button>
        </div>
      </div>

      {portfolio.length > 0 && (
        <>
          {/* Summary banner */}
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "評価額合計", value: totalValue > 0 ? formatCurrency(totalValue) : "---", color: "text-white" },
                { label: "投資元本", value: totalCost > 0 ? formatCurrency(totalCost) : "---", color: "text-gray-300" },
                {
                  label: "含み損益",
                  value: totalGainLoss !== 0 ? `${totalGainLoss >= 0 ? "+" : ""}${formatCurrency(totalGainLoss)}` : "---",
                  sub: totalGainLossPercent !== 0 ? formatPercent(totalGainLossPercent) : undefined,
                  color: totalGainLoss >= 0 ? "text-green-400" : "text-red-400",
                  icon: totalGainLoss >= 0 ? TrendingUp : TrendingDown,
                },
                {
                  label: "本日損益",
                  value: dayGainLoss !== 0 ? `${dayGainLoss >= 0 ? "+" : ""}${formatCurrency(dayGainLoss)}` : "---",
                  color: dayGainLoss >= 0 ? "text-green-400" : "text-red-400",
                },
              ].map(({ label, value, sub, color, icon: Icon }) => (
                <div key={label}>
                  <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
                  <div className={`flex items-center gap-1 font-bold text-lg ${color}`}>
                    {Icon && <Icon className="w-4 h-4" />}
                    {value}
                  </div>
                  {sub && <p className={`text-sm font-medium ${color}`}>{sub}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Sort options */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">並び替え:</span>
            {[
              { key: "value", label: "評価額" },
              { key: "gainLossPercent", label: "損益率" },
              { key: "gainLoss", label: "損益額" },
              { key: "symbol", label: "銘柄名" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key as typeof sortBy)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  sortBy === key
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {portfolio.length === 0 ? (
            <div className="bg-gray-800 rounded-2xl p-10 border border-gray-700 text-center">
              <Plus className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">保有銘柄がありません</h3>
              <p className="text-gray-400 text-sm mb-4">
                「銘柄を追加」ボタンから保有株を登録してください
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                銘柄を追加する
              </button>
            </div>
          ) : (
            sortedPortfolio.map((item) => (
              <PortfolioCard
                key={item.symbol}
                item={item}
                quote={quotes[item.symbol] ?? null}
                onRemove={handleRemove}
              />
            ))
          )}
        </div>

        {/* News panel */}
        {portfolio.length > 0 && (
          <div>
            <NewsPanel symbols={portfolio.map((p) => p.symbol)} />
          </div>
        )}
      </div>

      {showAddModal && (
        <AddPortfolioModal
          onAdd={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
