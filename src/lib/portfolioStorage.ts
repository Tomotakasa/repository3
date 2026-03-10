import type { PortfolioItem, WatchlistItem } from "@/types";

const PORTFOLIO_KEY = "stock_portfolio";
const WATCHLIST_KEY = "stock_watchlist";

export function getPortfolio(): PortfolioItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(PORTFOLIO_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePortfolio(items: PortfolioItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(items));
}

export function addToPortfolio(item: PortfolioItem): void {
  const portfolio = getPortfolio();
  const existingIndex = portfolio.findIndex((p) => p.symbol === item.symbol);
  if (existingIndex >= 0) {
    portfolio[existingIndex] = item;
  } else {
    portfolio.push(item);
  }
  savePortfolio(portfolio);
}

export function removeFromPortfolio(symbol: string): void {
  const portfolio = getPortfolio().filter((p) => p.symbol !== symbol);
  savePortfolio(portfolio);
}

export function getWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(WATCHLIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveWatchlist(items: WatchlistItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
}

export function addToWatchlist(item: WatchlistItem): void {
  const watchlist = getWatchlist();
  if (!watchlist.find((w) => w.symbol === item.symbol)) {
    watchlist.push(item);
    saveWatchlist(watchlist);
  }
}

export function removeFromWatchlist(symbol: string): void {
  const watchlist = getWatchlist().filter((w) => w.symbol !== symbol);
  saveWatchlist(watchlist);
}

export function isInWatchlist(symbol: string): boolean {
  return getWatchlist().some((w) => w.symbol === symbol);
}
