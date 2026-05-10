import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function TeamCard({ team }) {
  const logo = team.logos?.[0]?.href;
  const abbrev = team.abbreviation?.toLowerCase();

  return (
    <Link
      to={`/teams/${abbrev}`}
      className="group flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all"
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `#${team.color}15` }}
      >
        {logo && (
          <img src={logo} alt={team.displayName} className="w-10 h-10 object-contain" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
          {team.displayName}
        </h3>
        <p className="text-xs text-muted-foreground">
          {team.location} · {team.abbreviation}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}