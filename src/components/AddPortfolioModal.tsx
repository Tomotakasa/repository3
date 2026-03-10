"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";
import type { PortfolioItem } from "@/types";
import StockSearchModal from "./StockSearchModal";

interface Props {
  onAdd: (item: PortfolioItem) => void;
  onClose: () => void;
  initialSymbol?: string;
  initialName?: string;
}

export default function AddPortfolioModal({ onAdd, onClose, initialSymbol = "", initialName = "" }: Props) {
  const [symbol, setSymbol] = useState(initialSymbol.toUpperCase());
  const [name, setName] = useState(initialName);
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!symbol) { setError("銘柄を選択してください"); return; }
    if (!quantity || parseFloat(quantity) <= 0) { setError("保有数量を入力してください"); return; }
    if (!purchasePrice || parseFloat(purchasePrice) <= 0) { setError("取得単価を入力してください"); return; }

    onAdd({
      symbol: symbol.toUpperCase(),
      name: name || symbol,
      quantity: parseFloat(quantity),
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate,
      notes,
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
            <h3 className="text-white font-semibold text-lg">銘柄を追加</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            {/* Symbol selector */}
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">銘柄 *</label>
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="w-full bg-gray-800 text-left px-4 py-3 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors"
              >
                {symbol ? (
                  <div>
                    <span className="text-white font-semibold">{symbol}</span>
                    {name && <span className="text-gray-400 text-sm ml-2">{name}</span>}
                  </div>
                ) : (
                  <span className="text-gray-500 flex items-center gap-2">
                    <Search className="w-4 h-4" /> 銘柄を検索...
                  </span>
                )}
              </button>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">保有数量 *</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="例: 100"
                min="0"
                step="any"
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none text-sm placeholder-gray-500"
              />
            </div>

            {/* Purchase price */}
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">取得単価 *</label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="例: 150.00"
                min="0"
                step="any"
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none text-sm placeholder-gray-500"
              />
            </div>

            {/* Purchase date */}
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">取得日</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">メモ</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="任意メモ"
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none text-sm placeholder-gray-500"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors text-sm font-medium"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm font-medium"
              >
                追加する
              </button>
            </div>
          </form>
        </div>
      </div>

      {showSearch && (
        <StockSearchModal
          onSelect={(sym, n) => { setSymbol(sym); setName(n); }}
          onClose={() => setShowSearch(false)}
        />
      )}
    </>
  );
}
