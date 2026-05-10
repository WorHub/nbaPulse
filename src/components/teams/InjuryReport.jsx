import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const STATUS_COLORS = {
  Out: "bg-destructive/20 text-destructive",
  Doubtful: "bg-orange-500/20 text-orange-400",
  Questionable: "bg-yellow-500/20 text-yellow-400",
  Probable: "bg-green-500/20 text-green-400",
  Day: "bg-yellow-500/20 text-yellow-400",
};

export default function InjuryReport({ athletes }) {
  if (!athletes || athletes.length === 0) return null;

  const injured = athletes.filter((a) => a.injuries?.length > 0);
  if (injured.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        Injury Report
      </h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="divide-y divide-border">
          {injured.map((player) => {
            const injury = player.injuries[0];
            const headshot = player.headshot?.href;
            const statusKey = Object.keys(STATUS_COLORS).find((k) =>
              injury.status?.toLowerCase().includes(k.toLowerCase())
            );
            const colorClass = STATUS_COLORS[statusKey] || "bg-muted text-muted-foreground";

            return (
              <div key={player.id} className="flex items-center gap-4 p-4">
                {headshot ? (
                  <img src={headshot} alt={player.fullName} className="w-9 h-9 rounded-full object-cover bg-muted flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/player/${player.id}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                    {player.fullName}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {injury.longComment || injury.shortComment || "No details available"}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${colorClass}`}>
                  {injury.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}