"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import type { DiscoverStock, StockQuote } from "@/types";
import { getPortfolio, addToPortfolio, addToWatchlist, isInWatchlist } from "@/lib/portfolioStorage";
import AddPortfolioModal from "@/components/AddPortfolioModal";
import DiscoverCard from "@/components/DiscoverCard";
import type { PortfolioItem } from "@/types";

interface DiscoverResponse {
  recommendations: DiscoverStock[];
  generatedAt: string;
}

export default function DiscoverPage() {
  const [data, setData] = useState<DiscoverResponse | null>(null);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addTarget, setAddTarget] = useState<{ symbol: string; name: string } | null>(null);
  const [watchlistState, setWatchlistState] = useState<Record<string, boolean>>({});

  const ownedSymbols = getPortfolio().map((p) => p.symbol);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = ownedSymbols.length > 0 ? `?owned=${ownedSymbols.join(",")}` : "";
      const res = await fetch(`/api/discover${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);

      // Update watchlist state
      const wstate: Record<string, boolean> = {};
      json.recommendations.forEach((r: DiscoverStock) => {
        wstate[r.symbol] = isInWatchlist(r.symbol);
      });
      setWatchlistState(wstate);

      // Fetch quotes for recommended stocks
      if (json.recommendations.length > 0) {
        const qResults = await Promise.allSettled(
          json.recommendations.map((r: DiscoverStock) =>
            fetch(`/api/stock/${encodeURIComponent(r.symbol)}`).then((res) => res.json())
          )
        );
        const qMap: Record<string, StockQuote> = {};
        qResults.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value?.symbol) {
            qMap[json.recommendations[i].symbol] = r.value;
          }
        });
        setQuotes(qMap);
      }
    } catch {
      setError("推薦銘柄の取得に失敗しました。APIキーが設定されているか確認してください。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleAddToWatchlist = (symbol: string, name: string) => {
    addToWatchlist({ symbol, name, addedAt: new Date().toISOString() });
    setWatchlistState((prev) => ({ ...prev, [symbol]: true }));
  };

  const handleAddToPortfolio = (symbol: string, name: string) => {
    setAddTarget({ symbol, name });
  };

  const handlePortfolioAdd = (item: PortfolioItem) => {
    addToPortfolio(item);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">銘柄発見</h1>
          <p className="text-gray-400 mt-1">Claude AIが市場データを分析して上昇が期待される銘柄を提案</p>
        </div>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "分析中..." : "再分析"}
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-900/20 border border-blue-800/40 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-300 font-medium text-sm">Claude AI 分析について</p>
            <p className="text-blue-400/70 text-xs mt-1">
              本アプリの推薦はClaude AIによるデータ分析に基づいています。
              投資判断は必ずご自身でも確認し、自己責任のもと行ってください。
              過去の実績は将来の成果を保証するものではありません。
            </p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && !data && (
        <div className="text-center py-16">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <Sparkles className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div>
              <p className="text-white font-medium">Claude AIが市場を分析中</p>
              <p className="text-gray-400 text-sm mt-1">上昇が見込まれる銘柄を探しています...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium">エラーが発生しました</p>
              <p className="text-red-400/70 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data && !loading && (
        <>
          {data.recommendations.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h2 className="text-white font-semibold">
                  注目銘柄 {data.recommendations.length}件
                </h2>
                <span className="text-gray-500 text-sm">
                  · 分析時刻: {new Date(data.generatedAt).toLocaleTimeString("ja-JP")}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.recommendations.map((stock) => (
                  <DiscoverCard
                    key={stock.symbol}
                    stock={stock}
                    quote={quotes[stock.symbol] ?? null}
                    onAddToPortfolio={handleAddToPortfolio}
                    onAddToWatchlist={handleAddToWatchlist}
                    isInWatchlist={watchlistState[stock.symbol] ?? false}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">推薦銘柄が見つかりませんでした</p>
              <button
                onClick={fetchRecommendations}
                className="mt-3 text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
              >
                再試行する
              </button>
            </div>
          )}
        </>
      )}

      {/* Add to portfolio modal */}
      {addTarget && (
        <AddPortfolioModal
          onAdd={handlePortfolioAdd}
          onClose={() => setAddTarget(null)}
          initialSymbol={addTarget.symbol}
          initialName={addTarget.name}
        />
      )}
    </div>
  );
}
