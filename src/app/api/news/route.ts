import { NextRequest, NextResponse } from "next/server";
import { fetchNews } from "@/lib/yahooFinance";

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols")?.split(",") ?? [];
  if (symbols.length === 0) return NextResponse.json({ news: [] });

  const results = await Promise.allSettled(
    symbols.slice(0, 5).map((s) => fetchNews(s))
  );

  const allNews: Array<{
    title: string;
    link: string;
    publisher: string;
    publishedAt: string;
    relatedSymbols: string[];
  }> = [];

  results.forEach((r, i) => {
    if (r.status !== "fulfilled") return;
    r.value.forEach((item) => {
      allNews.push({
        title:          item.title,
        link:           item.link,
        publisher:      item.publisher ?? "",
        publishedAt:    item.providerPublishTime
          ? new Date(item.providerPublishTime * 1000).toISOString()
          : new Date().toISOString(),
        relatedSymbols: [symbols[i]],
      });
    });
  });

  const unique = Array.from(new Map(allNews.map((n) => [n.title, n])).values())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 10);

  return NextResponse.json({ news: unique });
}
