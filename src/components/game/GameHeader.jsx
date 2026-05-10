import React from "react";

export default function GameHeader({ header }) {
  const competition = header?.competitions?.[0];
  if (!competition) return null;

  const competitors = competition.competitors || [];
  const homeTeam = competitors.find((c) => c.homeAway === "home");
  const awayTeam = competitors.find((c) => c.homeAway === "away");
  const status = competition.status?.type;
  const isFinal = status?.completed;
  const isLive = status?.state === "in";
  const statusDetail = status?.detail || "";

  const linescores = competition.competitors?.[0]?.linescores || [];

  return (
    <div className="bg-card border border-border rounded-2xl p-6 mb-6">
      <div className="text-center mb-6">
        <span
          className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
            isLive
              ? "bg-red-500/20 text-red-400"
              : isFinal
              ? "bg-muted text-muted-foreground"
              : "bg-primary/10 text-primary"
          }`}
        >
          {statusDetail}
        </span>
        {header?.gameNote && (
          <p className="text-xs text-muted-foreground mt-2">{header.gameNote}</p>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 sm:gap-12">
        {[awayTeam, homeTeam].filter(Boolean).map((team, i) => {
          const logo = team.team?.logos?.[0]?.href;
          const isWinner = isFinal && team.winner;
          return (
            <React.Fragment key={team.id}>
              {i === 1 && (
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">VS</span>
                </div>
              )}
              <div className="text-center">
                {logo && (
                  <img src={logo} alt={team.team?.displayName} className="w-16 h-16 sm:w-20 sm:h-20 mx-auto object-contain" />
                )}
                <h2 className={`font-bold text-sm mt-2 ${isWinner ? "text-foreground" : "text-muted-foreground"}`}>
                  {team.team?.displayName}
                </h2>
                <p className="text-xs text-muted-foreground">{team.record?.[0]?.displayValue}</p>
                <p className={`text-3xl sm:text-4xl font-black font-mono mt-2 ${isWinner ? "text-primary" : "text-muted-foreground"}`}>
                  {team.score || "-"}
                </p>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Quarter scores */}
      {linescores.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="mx-auto text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="px-3 py-1 text-left">Team</th>
                {linescores.map((_, i) => (
                  <th key={i} className="px-3 py-1 text-center">
                    {i < 4 ? `Q${i + 1}` : `OT${i - 3}`}
                  </th>
                ))}
                <th className="px-3 py-1 text-center font-bold">T</th>
              </tr>
            </thead>
            <tbody>
              {[awayTeam, homeTeam].filter(Boolean).map((team) => (
                <tr key={team.id} className="border-t border-border">
                  <td className="px-3 py-1.5 font-medium">{team.team?.abbreviation}</td>
                  {(team.linescores || []).map((qs, i) => (
                    <td key={i} className="px-3 py-1.5 text-center font-mono text-muted-foreground">
                      {qs.displayValue}
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-center font-mono font-bold text-foreground">
                    {team.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}