import React from "react";

// Stats to skip entirely (obvious/redundant)
const SKIP_STATS = new Set(["GP", "GamesPlayed", "gamesPlayed", "wins", "losses", "winPercent", "streak"]);

// Labels to display nicely
const STAT_LABELS = {
  avgPoints: "PPG",
  avgPointsAgainst: "OPP PPG",
  pointDifferential: "DIFF",
  avgRebounds: "REB",
  avgAssists: "AST",
  avgSteals: "STL",
  avgBlocks: "BLK",
  avgTurnovers: "TOV",
  fieldGoalPct: "FG%",
  threePointFieldGoalPct: "3P%",
  freeThrowPct: "FT%",
};

function formatVal(name, raw) {
  const n = parseFloat(raw);
  if (isNaN(n)) return raw;
  // Percentages — show as e.g. "46.3"
  if (name?.toLowerCase().includes("pct")) return n.toFixed(1);
  // Averages — 1 decimal
  if (name?.toLowerCase().includes("avg") || name?.toLowerCase().includes("differential")) return n.toFixed(1);
  return raw;
}

export default function TeamStatsSection({ stats }) {
  if (!stats || stats.length === 0) return null;

  const overallRecord = stats.find((s) => s.type === "total") || stats[0];
  const homeRecord = stats.find((s) => s.description === "Home");
  const awayRecord = stats.find((s) => s.description === "Road" || s.description === "Away");

  const statCards = [
    { label: "Overall", value: overallRecord?.summary },
    { label: "Home", value: homeRecord?.summary },
    { label: "Away", value: awayRecord?.summary },
  ].filter((s) => s.value);

  const detailedStats = (overallRecord?.stats || []).filter(
    (s) => !SKIP_STATS.has(s.name) && !SKIP_STATS.has(s.abbreviation)
  );

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-foreground mb-4">Season Record</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{card.label}</p>
            <p className="text-xl font-bold font-mono text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      {detailedStats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {detailedStats.map((stat) => (
            <div key={stat.name} className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {STAT_LABELS[stat.name] || stat.abbreviation || stat.name}
              </p>
              <p className="text-lg font-bold font-mono text-primary">
                {formatVal(stat.name, stat.displayValue ?? stat.value)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}