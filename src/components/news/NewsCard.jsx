import React from "react";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";

export default function NewsCard({ article }) {
  const image = article.images?.[0];
  const link = article.links?.web?.href;
  const published = article.published ? format(new Date(article.published), "MMM d, yyyy") : "";

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all"
    >
      {image && (
        <div className="aspect-video overflow-hidden">
          <img
            src={image.url}
            alt={article.headline}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {article.byline && (
            <span className="text-xs text-primary font-medium">{article.byline}</span>
          )}
          {published && (
            <span className="text-xs text-muted-foreground">{published}</span>
          )}
        </div>
        <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {article.headline}
        </h3>
        {article.description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
            {article.description}
          </p>
        )}
        <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Read more</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </a>
  );
}