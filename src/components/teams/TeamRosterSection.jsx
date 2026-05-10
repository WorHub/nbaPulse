import React from "react";
import { Link } from "react-router-dom";

export default function TeamRosterSection({ athletes, teamColor }) {
  if (!athletes || athletes.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-foreground mb-4">Roster</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Player
                </th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  #
                </th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  POS
                </th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">
                  HT
                </th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">
                  WT
                </th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">
                  AGE
                </th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((player) => {
                const headshot = player.headshot?.href;
                return (
                  <tr
                    key={player.id}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Link to={`/player/${player.id}`} className="flex items-center gap-3 hover:text-primary transition-colors group">
                        {headshot ? (
                          <img
                            src={headshot}
                            alt={player.fullName}
                            className="w-8 h-8 rounded-full object-cover bg-muted"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted" />
                        )}
                        <span className="font-medium group-hover:text-primary">{player.fullName}</span>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                      {player.jersey || "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                        {player.position?.abbreviation || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground hidden sm:table-cell">
                      {player.displayHeight || "-"}
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground hidden sm:table-cell">
                      {player.displayWeight || "-"}
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground hidden md:table-cell">
                      {player.age || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}