import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_COLORS = {
  out: "bg-destructive/20 text-destructive",
  doubtful: "bg-orange-500/20 text-orange-400",
  questionable: "bg-yellow-500/20 text-yellow-400",
  probable: "bg-green-500/20 text-green-400",
  day: "bg-yellow-500/20 text-yellow-400",
};

function getColor(status) {
  const key = Object.keys(STATUS_COLORS).find((k) =>
    status?.toLowerCase().includes(k)
  );
  return STATUS_COLORS[key] || "bg-muted text-muted-foreground";
}

export default function GameInjuryReport({ rosters }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!rosters || rosters.length === 0) return null;

  // Collect injured players across both teams
  const allInjured = rosters.map((roster) => {
    const injured = (roster.roster || [])
      .map((entry) => entry.athlete || entry)
      .filter((p) => p.injuries?.length > 0)
      .map((p) => ({ ...p, teamAbbrev: roster.team?.abbreviation, teamLogo: roster.team?.logo }));
    return { team: roster.team, injured };
  });

  const hasAnyInjuries = allInjured.some((t) => t.injured.length > 0);
  if (!hasAnyInjuries) return null;

  const activeTeam = allInjured[activeIdx];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mt-6">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h3 className="font-bold text-foreground">Injury Report</h3>
        </div>
        <Tabs value={String(activeIdx)} onValueChange={(v) => setActiveIdx(Number(v))}>
          <TabsList className="bg-secondary h-8">
            {rosters.map((r, i) => (
              <TabsTrigger key={i} value={String(i)} className="text-xs h-7 px-3">
                {r.team?.abbreviation}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {activeTeam.injured.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No reported injuries</p>
      ) : (
        <div className="divide-y divide-border">
          {activeTeam.injured.map((player) => {
            const injury = player.injuries[0];
            const headshot = player.headshot?.href;
            return (
              <div key={player.id} className="flex items-center gap-4 p-4">
                {headshot ? (
                  <img src={headshot} alt={player.displayName} className="w-9 h-9 rounded-full object-cover bg-muted flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/player/${player.id}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                    {player.displayName}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {injury.longComment || injury.shortComment || "No details available"}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${getColor(injury.status)}`}>
                  {injury.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}