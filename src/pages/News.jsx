import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchNews } from "@/lib/espn";
import NewsCard from "@/components/news/NewsCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorState from "@/components/shared/ErrorState";

export default function News() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
  });

  const articles = data?.articles || [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">News</h1>
        <p className="text-sm text-muted-foreground mt-1">Latest NBA headlines and stories</p>
      </div>

      {isLoading && <LoadingSpinner text="Loading news..." />}
      {error && <ErrorState message="Failed to load news" onRetry={refetch} />}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <NewsCard key={article.id || article.headline} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}