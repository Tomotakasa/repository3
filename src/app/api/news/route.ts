import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols")?.split(",") ?? [];

  if (symbols.length === 0) {
    return NextResponse.json({ news: [] });
  }

  try {
    const newsResults = await Promise.allSettled(
      symbols.slice(0, 5).map((s) =>
        yahooFinance.search(s, { newsCount: 3, quotesCount: 0 })
      )
    );

    const allNews: Array<{
      title: string;
      link: string;
      publisher: string;
      publishedAt: string;
      relatedSymbols: string[];
    }> = [];

    newsResults.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value.news) {
        result.value.news.forEach((item) => {
          allNews.push({
            title: item.title,
            link: item.link,
            publisher: item.publisher ?? "",
            publishedAt: item.providerPublishTime
              ? new Date(item.providerPublishTime * 1000).toISOString()
              : new Date().toISOString(),
            relatedSymbols: [symbols[i]],
          });
        });
      }
    });

    // Deduplicate by title and sort by date
    const unique = Array.from(
      new Map(allNews.map((n) => [n.title, n])).values()
    ).sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return NextResponse.json({ news: unique.slice(0, 10) });
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json({ news: [] });
  }
}
