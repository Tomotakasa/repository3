import type { StockQuote, ChartDataPoint } from "@/types";

export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
  const results = await Promise.allSettled(
    symbols.map((s) => fetchStockQuote(s))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);
}

export async function fetchChartData(symbol: string, period: string): Promise<ChartDataPoint[]> {
  try {
    const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}/chart?period=${period}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function calculatePortfolioGain(
  currentPrice: number,
  purchasePrice: number,
  quantity: number
): { gainLoss: number; gainLossPercent: number } {
  const currentValue = currentPrice * quantity;
  const costBasis = purchasePrice * quantity;
  const gainLoss = currentValue - costBasis;
  const gainLossPercent = ((currentPrice - purchasePrice) / purchasePrice) * 100;
  return { gainLoss, gainLossPercent };
}
