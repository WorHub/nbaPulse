import React from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { AlertTriangle, History } from "lucide-react";

const STATUS_COLORS = {
  out: "bg-destructive/20 text-destructive",
  doubtful: "bg-orange-500/20 text-orange-400",
  questionable: "bg-yellow-500/20 text-yellow-400",
  probable: "bg-green-500/20 text-green-400",
  day: "bg-yellow-500/20 text-yellow-400",
};

function getInjuryColor(status) {
  const key = Object.keys(STATUS_COLORS).find((statusKey) =>
    status?.toLowerCase().includes(statusKey)
  );

  return STATUS_COLORS[key] || "bg-muted text-muted-foreground";
}

function getTeamInjuries(rosters, team) {
  const roster = rosters.find((entry) => {
    const rosterTeam = entry.team || {};

    return (
      String(rosterTeam.id) === String(team.id) ||
      rosterTeam.abbreviation === team.abbreviation ||
      rosterTeam.displayName === team.displayName
    );
  });

  return (roster?.roster || [])
    .map((entry) => entry.athlete || entry)
    .filter((player) => player.injuries?.length > 0);
}

function TeamInjuryReport({ injuries }) {
  return (
    <div className="p-4 border-b border-border bg-secondary/20">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <h4 className="text-sm font-bold text-foreground">Injury Report</h4>
      </div>

      {injuries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No reported injuries</p>
      ) : (
        <div className="space-y-3">
          {injuries.map((player) => {
            const injury = player.injuries[0];
            const headshot = player.headshot?.href;

            return (
              <div key={player.id} className="flex items-center gap-3">
                {headshot ? (
                  <img src={headshot} alt={player.displayName} className="w-8 h-8 rounded-full object-cover bg-muted flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/player/${player.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                    {player.displayName || player.fullName}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {injury.longComment || injury.shortComment || "No details available"}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${getInjuryColor(injury.status)}`}>
                  {injury.status || "Injured"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getTeams(event) {
  const competitors = event.competitions?.[0]?.competitors || [];
  return {
    home: competitors.find((competitor) => competitor.homeAway === "home"),
    away: competitors.find((competitor) => competitor.homeAway === "away"),
  };
}

function TeamLine({ competitor }) {
  if (!competitor) return null;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {competitor.team?.logo && (
          <img src={competitor.team.logo} alt={competitor.team.displayName} className="w-6 h-6 object-contain flex-shrink-0" />
        )}
        <span className={`text-sm truncate ${competitor.winner ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
          {competitor.team?.shortDisplayName || competitor.team?.abbreviation}
        </span>
      </div>
      <span className={`font-mono text-sm ${competitor.winner ? "text-foreground font-bold" : "text-muted-foreground"}`}>
        {competitor.score || "-"}
      </span>
    </div>
  );
}

export default function GameRecentGames({ teams = [], rosters = [], recentGamesByTeam = {}, isLoading }) {
  if (!teams.length) return null;

  return (
    <div className="mt-6 mb-8">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-primary" />
        Past 5 Games
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {teams.map((team) => {
          const games = recentGamesByTeam[String(team.id)] || [];
          const injuries = getTeamInjuries(rosters, team);

          return (
            <div key={team.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-3">
                {team.logo && <img src={team.logo} alt={team.displayName} className="w-8 h-8 object-contain" />}
                <div>
                  <h3 className="font-bold text-foreground">{team.displayName}</h3>
                  <p className="text-xs text-muted-foreground">Most recent completed games before this matchup</p>
                </div>
              </div>

              <TeamInjuryReport injuries={injuries} />

              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading recent games...</p>
              ) : games.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No recent completed games found</p>
              ) : (
                <div className="divide-y divide-border">
                  {games.map((game) => {
                    const { away, home } = getTeams(game);
                    const teamCompetitor = [away, home].find((competitor) => String(competitor?.team?.id) === String(team.id));
                    const result = teamCompetitor?.winner ? "W" : "L";

                    return (
                      <Link key={game.id} to={`/game/${game.id}`} className="block p-4 hover:bg-secondary/30 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-muted-foreground">{format(new Date(game.date), "MMM d, yyyy")}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${teamCompetitor?.winner ? "bg-green-500/20 text-green-400" : "bg-destructive/20 text-destructive"}`}>
                            {result}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <TeamLine competitor={away} />
                          <TeamLine competitor={home} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
