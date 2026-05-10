import React from "react";
import { Link } from "react-router-dom";
import { History } from "lucide-react";

function getTeams(event) {
  const competitors = event.competitions?.[0]?.competitors || [];
  return {
    home: competitors.find((competitor) => competitor.homeAway === "home"),
    away: competitors.find((competitor) => competitor.homeAway === "away"),
  };
}

function GamePill({ game, team }) {
  const { away, home } = getTeams(game);
  const teamCompetitor = [away, home].find((competitor) => String(competitor?.team?.id) === String(team.id));
  const opponent = [away, home].find((competitor) => String(competitor?.team?.id) !== String(team.id));
  const result = teamCompetitor?.winner ? "W" : "L";
  const score = teamCompetitor && opponent ? `${teamCompetitor.score || "-"}-${opponent.score || "-"}` : "-";

  return (
    <Link
      to={`/game/${game.id}`}
      className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-[11px] leading-none transition-colors hover:border-primary/60 hover:bg-primary/10"
      title={`${team.displayName} ${result} ${score}`}
    >
      <span className={`font-bold ${teamCompetitor?.winner ? "text-green-400" : "text-destructive"}`}>{result}</span>
      <span className="font-mono text-muted-foreground">{score}</span>
      {opponent?.team?.abbreviation && <span className="text-muted-foreground">vs {opponent.team.abbreviation}</span>}
    </Link>
  );
}

export default function GameRecentGames({ teams = [], recentGamesByTeam = {}, isLoading }) {
  if (!teams.length) return null;

  return (
    <div className="my-3 rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground lg:w-32">
          <History className="h-3.5 w-3.5 text-primary" />
          Past 5 Games
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 lg:flex-row lg:items-center">
          {teams.map((team) => {
            const games = recentGamesByTeam[String(team.id)] || [];

            return (
              <div key={team.id} className="flex min-w-0 flex-1 items-center gap-2">
                <div className="flex w-16 shrink-0 items-center gap-1.5">
                  {team.logo && <img src={team.logo} alt={team.displayName} className="h-4 w-4 object-contain" />}
                  <span className="truncate text-[11px] font-semibold text-muted-foreground">{team.abbreviation}</span>
                </div>

                {isLoading ? (
                  <div className="h-7 flex-1 rounded-full bg-secondary/60" />
                ) : games.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground">No recent completed games</span>
                ) : (
                  <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                    {games.map((game) => (
                      <GamePill key={game.id} game={game} team={team} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
