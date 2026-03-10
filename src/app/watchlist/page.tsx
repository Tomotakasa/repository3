"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Bookmark } from "lucide-react";
import type { WatchlistItem, StockQuote, PortfolioItem } from "@/types";
import { getWatchlist, removeFromWatchlist, addToPortfolio } from "@/lib/portfolioStorage";
import WatchlistCard from "@/components/WatchlistCard";
import StockSearchModal from "@/components/StockSearchModal";
import AddPortfolioModal from "@/components/AddPortfolioModal";
import { addToWatchlist } from "@/lib/portfolioStorage";

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [addPortfolioTarget, setAddPortfolioTarget] = useState<{ symbol: string; name: string } | null>(null);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  const loadWatchlist = () => {
    setWatchlist(getWatchlist());
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const fetchQuotes = (items: WatchlistItem[]) => {
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
    fetchQuotes(watchlist);
  }, [watchlist]);

  const handleAddSymbol = (symbol: string, name: string) => {
    addToWatchlist({ symbol, name, addedAt: new Date().toISOString() });
    loadWatchlist();
  };

  const handleRemove = (symbol: string) => {
    removeFromWatchlist(symbol);
    loadWatchlist();
  };

  const handleAddToPortfolio = (item: PortfolioItem) => {
    addToPortfolio(item);
    setAddPortfolioTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ウォッチリスト</h1>
          <p className="text-gray-400 mt-1">気になる銘柄をウォッチ</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchQuotes(watchlist)}
            disabled={loadingQuotes || watchlist.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingQuotes ? "animate-spin" : ""}`} />
            <span className="hidden sm:block">更新</span>
          </button>
          <button
            onClick={() => setShowSearchModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            銘柄を追加
          </button>
        </div>
      </div>

      {/* Content */}
      {watchlist.length === 0 ? (
        <div className="bg-gray-800 rounded-2xl p-10 border border-gray-700 text-center">
          <Bookmark className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-2">ウォッチリストが空です</h3>
          <p className="text-gray-400 text-sm mb-4">
            気になる銘柄を追加して価格を追跡しましょう
          </p>
          <button
            onClick={() => setShowSearchModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            銘柄を追加する
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {watchlist.map((item) => (
            <WatchlistCard
              key={item.symbol}
              item={item}
              quote={quotes[item.symbol] ?? null}
              onRemove={handleRemove}
              onAddToPortfolio={(symbol, name) => setAddPortfolioTarget({ symbol, name })}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showSearchModal && (
        <StockSearchModal
          title="ウォッチリストに追加"
          onSelect={(symbol, name) => {
            handleAddSymbol(symbol, name);
          }}
          onClose={() => setShowSearchModal(false)}
        />
      )}

      {addPortfolioTarget && (
        <AddPortfolioModal
          onAdd={handleAddToPortfolio}
          onClose={() => setAddPortfolioTarget(null)}
          initialSymbol={addPortfolioTarget.symbol}
          initialName={addPortfolioTarget.name}
        />
      )}
    </div>
  );
}
