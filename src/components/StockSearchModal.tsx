"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

interface Props {
  onSelect: (symbol: string, name: string) => void;
  onClose: () => void;
  title?: string;
}

export default function StockSearchModal({ onSelect, onClose, title = "銘柄を検索" }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 1) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ティッカー・企業名で検索 (例: AAPL, Toyota)"
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none text-sm placeholder-gray-500"
            />
          </div>
        </div>

        {/* Results */}
        <div className="px-5 pb-5 max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
          {!loading && results.length === 0 && query.length > 0 && (
            <p className="text-gray-500 text-sm text-center py-4">
              「{query}」に一致する銘柄が見つかりませんでした
            </p>
          )}
          {results.map((r) => (
            <button
              key={r.symbol}
              onClick={() => {
                onSelect(r.symbol, r.name ?? r.symbol);
                onClose();
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left group"
            >
              <div>
                <div className="text-white font-semibold text-sm group-hover:text-blue-400 transition-colors">
                  {r.symbol}
                </div>
                <div className="text-gray-400 text-xs mt-0.5">{r.name}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-500 text-xs">{r.exchange}</div>
                <div className="text-gray-600 text-xs">{r.type}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
