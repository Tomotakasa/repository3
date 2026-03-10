export interface PortfolioItem {
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  notes?: string;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: string;
  notes?: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  high52Week?: number;
  low52Week?: number;
  avgVolume?: number;
  currency: string;
}

export interface ApiUsage {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface StockAnalysis {
  symbol: string;
  recommendation: "BUY" | "SELL" | "HOLD";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  targetPrice?: number;
  summary: string;
  bullishPoints: string[];
  bearishPoints: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  analysisDate: string;
  usage?: ApiUsage;
}

export interface DiscoverStock {
  symbol: string;
  name: string;
  sector: string;
  reason: string;
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  potentialReturn: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface ChartDataPoint {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

export interface NewsItem {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
  relatedSymbols: string[];
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayGainLoss: number;
  dayGainLossPercent: number;
}
