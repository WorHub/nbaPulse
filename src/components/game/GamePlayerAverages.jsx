import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";

const STAT_COLUMNS = [
  { label: "GP", cat: "general", idx: 0 },
  { label: "MIN", cat: "general", idx: 1 },
  { label: "PTS", cat: "offensive", idx: 0, highlight: true },
  { label: "REB", cat: "general", idx: 11 },
  { label: "AST", cat: "offensive", idx: 10 },
  { label: "STL", cat: "defensive", idx: 0 },
  { label: "BLK", cat: "defensive", idx: 1 },
  { label: "FG%", cat: "offensive", idx: 3 },
  { label: "3P%", cat: "offensive", idx: 6 },
];

function getStat(entry, catName, idx) {
  const category = entry?.categories?.find((cat) => cat.name === catName);
  return category?.totals?.[idx] ?? category?.values?.[idx] ?? "-";
}

function normalizeRoster(roster) {
  return (roster?.roster || []).map((entry) => entry.athlete || entry).filter(Boolean);
}

export default function GamePlayerAverages({ teams = [], rosters = [], playerStats = [], isLoading, gameId }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const statsByAthlete = useMemo(() => {
    return (playerStats || []).reduce((acc, entry) => {
      if (entry.athlete?.id) acc[String(entry.athlete.id)] = entry;
      return acc;
    }, {});
  }, [playerStats]);

  if (!teams.length) return null;

  const activeTeam = teams[activeIdx] || teams[0];
  const roster = rosters.find((item) => String(item.team?.id) === String(activeTeam?.id));
  const players = normalizeRoster(roster)
    .map((player) => ({ player, stats: statsByAthlete[String(player.id)] }))
    .sort((a, b) => {
      const bPts = parseFloat(getStat(b.stats, "offensive", 0)) || 0;
      const aPts = parseFloat(getStat(a.stats, "offensive", 0)) || 0;
      return bPts - aPts;
    });

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mt-6 mb-8">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-bold text-foreground">Player Season Averages</h2>
            <p className="text-xs text-muted-foreground">Full roster averages for each team in this game</p>
          </div>
        </div>
        <div className="inline-flex h-8 items-center rounded-md bg-secondary p-1">
          {teams.map((team, index) => (
            <button
              key={team.id}
              type="button"
              onClick={() => setActiveIdx(index)}
              className={`text-xs h-6 px-3 rounded-sm transition-colors ${activeIdx === index ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {team.abbreviation}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading player averages...</p>
      ) : players.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No roster players found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wider min-w-[190px] sticky left-0 bg-secondary/50">
                  Player
                </th>
                <th className="text-center py-3 px-3 font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                <th className="text-center py-3 px-3 font-semibold text-muted-foreground uppercase tracking-wider">POS</th>
                {STAT_COLUMNS.map((column) => (
                  <th key={column.label} className={`text-center py-3 px-3 font-semibold uppercase tracking-wider ${column.highlight ? "text-primary" : "text-muted-foreground"}`}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map(({ player, stats }) => {
                const headshot = player.headshot?.href;

                return (
                  <tr key={player.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 px-4 sticky left-0 bg-card">
                      <Link to={`/player/${player.id}`} state={{ backTo: `/game/${gameId}`, backLabel: "Back" }} className="flex items-center gap-2.5 hover:text-primary transition-colors group">
                        {headshot ? (
                          <img src={headshot} alt={player.displayName || player.fullName} className="w-8 h-8 rounded-full object-cover bg-muted flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
                        )}
                        <span className="font-semibold text-foreground group-hover:text-primary whitespace-nowrap">
                          {player.displayName || player.fullName}
                        </span>
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{player.jersey || "-"}</td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground font-semibold">{player.position?.abbreviation || "-"}</td>
                    {STAT_COLUMNS.map((column) => (
                      <td key={column.label} className={`py-2.5 px-3 text-center font-mono ${column.highlight ? "text-primary font-bold" : "text-muted-foreground"}`}>
                        {getStat(stats, column.cat, column.idx)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
