import React from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
export default function ScoreCard({ game }) {
  const competition = game.competitions?.[0];
  if (!competition) return null;

  const homeTeam = competition.competitors?.find(c => c.homeAway === "home");
  const awayTeam = competition.competitors?.find(c => c.homeAway === "away");
  if (!homeTeam || !awayTeam) return null;

  const status = game.status?.type;
  const isLive = status?.state === "in";
  const isFinal = status?.completed;
  const displayClock = game.status?.displayClock;
  const period = game.status?.period;

  const statusText = isLive
    ? `Q${period} ${displayClock}`
    : isFinal
    ? status?.detail || "Final"
    : format(new Date(game.date), "h:mm a");

  // Betting odds
  const odds = competition.odds?.[0];

  const getLeader = (team, statName) =>
    team.leaders?.find(l => l.name === statName)?.leaders?.[0];

  const getTopPerformer = (team) => {
    const pts = getLeader(team, "points");
    if (!pts) return null;
    const ptsVal = pts.displayValue;
    const rebVal = getLeader(team, "rebounds")?.displayValue;
    const astVal = getLeader(team, "assists")?.displayValue;
    const statLine = [ptsVal && `${ptsVal} PTS`, rebVal && `${rebVal} REB`, astVal && `${astVal} AST`].filter(Boolean).join(" · ");
    return { leader: pts, statLine };
  };

  const homeTop = getTopPerformer(homeTeam);
  const awayTop = getTopPerformer(awayTeam);

  return (
    <Link
      to={`/game/${game.id}`}
      className="block bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isLive
              ? "bg-red-500/20 text-red-400 animate-pulse"
              : isFinal
              ? "bg-muted text-muted-foreground"
              : "bg-primary/10 text-primary"
          }`}
        >
          {statusText}
        </span>
        {odds && (
          <span className="text-xs text-muted-foreground">
            O/U {odds.overUnder} · {odds.details}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {[awayTeam, homeTeam].map(team => {
          const isWinner = isFinal && team.winner;
          return (
            <div key={team.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={team.team.logo} alt={team.team.displayName} className="w-8 h-8 object-contain" />
                <div>
                  <span className={`text-sm font-semibold ${isWinner ? "text-foreground" : "text-muted-foreground"}`}>
                    {team.team.shortDisplayName}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">{team.records?.[0]?.summary}</span>
                </div>
              </div>
              <span className={`text-lg font-bold font-mono ${isWinner ? "text-foreground" : "text-muted-foreground"}`}>
                {team.score || "-"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Top performers */}
      {(isFinal || isLive) && (awayTop || homeTop) && (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5">
          {[awayTop, homeTop].filter(Boolean).map((top, i) => (
            <div key={i} className="flex items-center gap-2">
              {top.leader.athlete?.headshot && (
                <img src={top.leader.athlete.headshot} alt={top.leader.athlete.shortName} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
              )}
              <span className="text-xs text-muted-foreground truncate">
                <span className="text-foreground font-medium">{top.leader.athlete?.shortName}</span>
                <span className="ml-1">{top.statLine}</span>
              </span>
            </div>
          ))}
        </div>
      )}

    </Link>
  );
}