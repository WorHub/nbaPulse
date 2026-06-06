import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calcFantasyPoints } from "@/lib/espn";

export default function GameBoxScore({ boxscore, gameId }) {
  const players = boxscore?.players || [];
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);

  if (players.length === 0) return null;

  const activeTeam = players[activeTeamIdx];
  const team = activeTeam?.team;
  const statGroups = activeTeam?.statistics || [];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-foreground">Box Score</h3>
        <Tabs
          value={String(activeTeamIdx)}
          onValueChange={(v) => setActiveTeamIdx(Number(v))}
        >
          <TabsList className="bg-secondary h-8">
            {players.map((p, i) => (
              <TabsTrigger key={i} value={String(i)} className="text-xs h-7 px-3">
                {p.team?.abbreviation}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {statGroups.map((group, gi) => {
        const labels = group.labels || [];
        const athletes = group.athletes || [];

        if (athletes.length === 0) return null;

        return (
          <div key={gi} className="overflow-x-auto">
            {group.name && (
              <div className="px-4 py-2 bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.name}
              </div>
            )}
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground sticky left-0 bg-card min-w-[140px]">
                    Player
                  </th>
                  {labels.map((label, li) => (
                    <th
                      key={li}
                      className="text-center py-2 px-2 font-semibold text-muted-foreground min-w-[40px]"
                    >
                      {label}
                    </th>
                  ))}
                  <th className="text-center py-2 px-2 font-semibold text-primary min-w-[50px]">FPTS</th>
                </tr>
              </thead>
              <tbody>
                {athletes.map((athlete) => {
                  const player = athlete.athlete;
                  const stats = athlete.stats || [];
                  const didNotPlay = athlete.didNotPlay;
                  const reason = athlete.reason;

                  // Compute FPTS from stats array (MIN PTS FG 3PT FT REB AST TO STL BLK ...)
                  const pts = parseFloat(stats[1]) || 0;
                  const reb = parseFloat(stats[5]) || 0;
                  const ast = parseFloat(stats[6]) || 0;
                  const to = parseFloat(stats[7]) || 0;
                  const stl = parseFloat(stats[8]) || 0;
                  const blk = parseFloat(stats[9]) || 0;
                  const fpts = !didNotPlay ? calcFantasyPoints({ pts, reb, ast, stl, blk, to }) : null;

                  return (
                    <tr
                      key={player?.id}
                      className="border-b border-border hover:bg-secondary/20 transition-colors"
                    >
                      <td className="py-2 px-3 sticky left-0 bg-card">
                        <Link to={`/player/${player?.id}`} state={{ backTo: `/game/${gameId}`, backLabel: "Back" }} className="flex items-center gap-2 hover:text-primary transition-colors">
                          <span className="font-medium text-foreground hover:text-primary">
                            {player?.shortName || player?.displayName}
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            {player?.position?.abbreviation}
                          </span>
                        </Link>
                      </td>
                      {didNotPlay ? (
                        <td
                          colSpan={labels.length + 1}
                          className="py-2 px-3 text-center text-muted-foreground italic"
                        >
                          DNP {reason ? `- ${reason}` : ""}
                        </td>
                      ) : (
                        <>
                          {stats.map((stat, si) => (
                            <td
                              key={si}
                              className="py-2 px-2 text-center font-mono text-muted-foreground"
                            >
                              {stat}
                            </td>
                          ))}
                          <td className="py-2 px-2 text-center font-mono font-bold text-primary">{fpts}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Team totals */}
      {statGroups[0]?.totals && (
        <div className="px-4 py-3 bg-secondary/30 border-t border-border">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Team Totals
            </span>
            {(statGroups[0].labels || []).map((label, i) => (
              <span key={i} className="text-xs font-mono">
                <span className="text-muted-foreground">{label}: </span>
                <span className="text-foreground font-medium">
                  {statGroups[0].totals[i]}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}