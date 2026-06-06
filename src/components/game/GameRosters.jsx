import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GameRosters({ rosters, gameId }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!rosters || rosters.length === 0) return null;

  const activeRoster = rosters[activeIdx];
  const team = activeRoster?.team;
  const players = activeRoster?.roster || [];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mt-6">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-foreground">Rosters</h3>
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase">#</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase">Player</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase">POS</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">HT</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">WT</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">AGE</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">EXP</th>
            </tr>
          </thead>
          <tbody>
            {players.map((entry) => {
              const player = entry.athlete || entry;
              const headshot = player.headshot?.href;
              const injuryStatus = player.injuries?.[0]?.status;
              return (
                <tr key={player.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                  <td className="py-2.5 px-4 text-muted-foreground font-mono text-xs">{player.jersey || "-"}</td>
                  <td className="py-2.5 px-4">
                    <Link to={`/player/${player.id}`} state={{ backTo: `/game/${gameId}`, backLabel: "Back" }} className="flex items-center gap-2.5 hover:text-primary transition-colors group">
                      {headshot ? (
                        <img src={headshot} alt={player.displayName} className="w-7 h-7 rounded-full object-cover bg-muted flex-shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0" />
                      )}
                      <div>
                        <span className="font-medium text-foreground group-hover:text-primary">{player.displayName}</span>
                        {injuryStatus && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-semibold">{injuryStatus}</span>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 text-center text-xs text-muted-foreground font-medium">{player.position?.abbreviation || "-"}</td>
                  <td className="py-2.5 px-3 text-center text-xs text-muted-foreground hidden sm:table-cell">{player.displayHeight || "-"}</td>
                  <td className="py-2.5 px-3 text-center text-xs text-muted-foreground hidden sm:table-cell">{player.displayWeight || "-"}</td>
                  <td className="py-2.5 px-3 text-center text-xs text-muted-foreground hidden md:table-cell">{player.age || "-"}</td>
                  <td className="py-2.5 px-3 text-center text-xs text-muted-foreground hidden md:table-cell">
                    {player.experience?.years != null ? (player.experience.years === 0 ? "R" : `${player.experience.years}yr`) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}