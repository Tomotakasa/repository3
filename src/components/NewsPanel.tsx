"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface NewsItem {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
  relatedSymbols: string[];
}

interface Props {
  symbols: string[];
}

export default function NewsPanel({ symbols }: Props) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }
    const params = symbols.slice(0, 5).join(",");
    fetch(`/api/news?symbols=${encodeURIComponent(params)}`)
      .then((r) => r.json())
      .then((d) => setNews(d.news ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbols]);

  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-4 h-4 text-blue-400" />
        <h3 className="text-white font-semibold">関連ニュース</h3>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-full mb-1" />
              <div className="h-3 bg-gray-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {!loading && news.length === 0 && (
        <p className="text-gray-500 text-sm">ニュースが見つかりませんでした</p>
      )}

      <div className="space-y-3">
        {news.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 group-hover:text-blue-400 transition-colors leading-snug line-clamp-2">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500 text-xs">{item.publisher}</span>
                  <span className="text-gray-600 text-xs">·</span>
                  <span className="text-gray-500 text-xs">
                    {formatDistanceToNow(new Date(item.publishedAt), {
                      addSuffix: true,
                      locale: ja,
                    })}
                  </span>
                  {item.relatedSymbols.length > 0 && (
                    <>
                      <span className="text-gray-600 text-xs">·</span>
                      <span className="text-blue-500 text-xs font-medium">
                        {item.relatedSymbols[0]}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-400 flex-shrink-0 mt-0.5 transition-colors" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
