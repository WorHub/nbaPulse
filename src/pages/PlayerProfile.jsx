import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPlayerProfile, fetchPlayerSeasonStats } from "@/lib/espn";
import { ArrowLeft } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorState from "@/components/shared/ErrorState";

const STAT_LABELS = {
  offensive: {
    "avgPoints": "PTS",
    "avgRebounds": "REB",
    "avgAssists": "AST",
    "avgSteals": "STL",
    "avgBlocks": "BLK",
    "avgTurnovers": "TO",
    "fieldGoalPct": "FG%",
    "threePointFieldGoalPct": "3P%",
    "freeThrowPct": "FT%",
    "avgThreePointFieldGoalsMade": "3PM",
  }
};

function StatBadge({ label, value, highlight }) {
  return (
    <div className={`flex flex-col items-center rounded-xl p-3 border ${highlight ? "border-primary/40 bg-primary/10" : "border-border bg-card"}`}>
      <span className={`text-xl font-black font-mono ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

export default function PlayerProfile() {
  const { athleteId } = useParams();

  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ["playerProfile", athleteId],
    queryFn: () => fetchPlayerProfile(athleteId),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["playerSeasonStats", athleteId],
    queryFn: () => fetchPlayerSeasonStats(athleteId),
  });

  if (profileLoading) return <LoadingSpinner text="Loading player..." />;
  if (profileError) return <ErrorState message="Failed to load player" />;

  const athlete = profileData?.athlete;
  if (!athlete) return <ErrorState message="Player not found" />;

  const headshot = athlete.headshot?.href;
  const team = athlete.team;
  const teamColor = team?.color || "f97316";
  const injuries = athlete.injuries || [];

  // Parse season stats
  const splits = statsData?.splits?.categories || [];
  const avgSplit = splits.find(c => c.name === "offensive") || splits[0];
  const statValues = {};
  (avgSplit?.stats || []).forEach(s => { statValues[s.name] = s.displayValue || s.value; });

  const pts = parseFloat(statValues["avgPoints"] || 0);
  const reb = parseFloat(statValues["avgRebounds"] || 0);
  const ast = parseFloat(statValues["avgAssists"] || 0);
  const stl = parseFloat(statValues["avgSteals"] || 0);
  const blk = parseFloat(statValues["avgBlocks"] || 0);
  const to = parseFloat(statValues["avgTurnovers"] || 0);
  // Past seasons from stats page
  const seasonHistory = statsData?.stats || [];

  return (
    <div>
      <Link
        to="/players"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        All Players
      </Link>

      {/* Hero */}
      <div
        className="rounded-2xl p-6 sm:p-8 mb-8 border border-border relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, #${teamColor}20 0%, transparent 60%)` }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {headshot && (
            <img src={headshot} alt={athlete.displayName} className="w-24 h-24 rounded-2xl object-cover bg-muted" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-black text-foreground">{athlete.displayName}</h1>
              {athlete.jersey && (
                <span className="text-2xl font-bold text-muted-foreground">#{athlete.jersey}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {team && (
                <div className="flex items-center gap-2">
                  <img src={team.logos?.[0]?.href} alt={team.displayName} className="w-6 h-6 object-contain" />
                  <span className="text-sm font-medium text-muted-foreground">{team.displayName}</span>
                </div>
              )}
              {athlete.position && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                  {athlete.position.displayName}
                </span>
              )}
              {athlete.age && (
                <span className="text-xs text-muted-foreground">Age {athlete.age}</span>
              )}
              {athlete.displayHeight && (
                <span className="text-xs text-muted-foreground">{athlete.displayHeight} · {athlete.displayWeight}</span>
              )}
            </div>
            {injuries.length > 0 && (
              <div className="mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-semibold">
                  {injuries[0].status} — {injuries[0].longComment?.split(".")[0]}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* This Season Averages */}
      {(pts > 0 || reb > 0) && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">2025-26 Season Averages</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
            <StatBadge label="PTS" value={pts || "-"} highlight />
            <StatBadge label="REB" value={reb || "-"} />
            <StatBadge label="AST" value={ast || "-"} />
            <StatBadge label="STL" value={stl || "-"} />
            <StatBadge label="BLK" value={blk || "-"} />
            <StatBadge label="TO" value={to || "-"} />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 mt-3">
            {statValues["fieldGoalPct"] && <StatBadge label="FG%" value={statValues["fieldGoalPct"]} />}
            {statValues["threePointFieldGoalPct"] && <StatBadge label="3P%" value={statValues["threePointFieldGoalPct"]} />}
            {statValues["freeThrowPct"] && <StatBadge label="FT%" value={statValues["freeThrowPct"]} />}
          </div>
        </div>
      )}

      {/* Bio info */}
      {(athlete.birthPlace || athlete.college) && (
        <div className="mb-8 bg-card border border-border rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {athlete.birthPlace?.country && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Country</p>
              <p className="text-sm font-medium mt-1">{athlete.birthPlace.country}</p>
            </div>
          )}
          {athlete.birthPlace?.city && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Hometown</p>
              <p className="text-sm font-medium mt-1">{athlete.birthPlace.city}</p>
            </div>
          )}
          {athlete.college?.name && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">College</p>
              <p className="text-sm font-medium mt-1">{athlete.college.name}</p>
            </div>
          )}
          {athlete.debutYear && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Draft Year</p>
              <p className="text-sm font-medium mt-1">{athlete.debutYear}</p>
            </div>
          )}
        </div>
      )}

      {/* Season history table */}
      {statsLoading && <LoadingSpinner text="Loading stats history..." />}
      {!statsLoading && seasonHistory.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Career Stats</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase">Season</th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground uppercase">Team</th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground uppercase">GP</th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground uppercase text-primary">PTS</th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground uppercase">REB</th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground uppercase">AST</th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground uppercase">STL</th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground uppercase">BLK</th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground uppercase">FG%</th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground uppercase">3P%</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonHistory.map((season, i) => {
                    const cats = season.splits?.categories || [];
                    const off = cats.find(c => c.name === "offensive") || {};
                    const gen = cats.find(c => c.name === "general") || {};
                    const getStat = (cat, name) => {
                      const s = (cat.stats || []).find(s => s.name === name);
                      return s?.displayValue || s?.value || "-";
                    };
                    return (
                      <tr key={i} className="border-b border-border hover:bg-secondary/20 transition-colors">
                        <td className="py-2.5 px-4 font-medium">{season.displayName || `Season ${i + 1}`}</td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground">{season.team?.abbreviation || "-"}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{getStat(gen, "gamesPlayed")}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-primary">{getStat(off, "avgPoints")}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{getStat(off, "avgRebounds")}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{getStat(off, "avgAssists")}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{getStat(off, "avgSteals")}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{getStat(off, "avgBlocks")}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{getStat(off, "fieldGoalPct")}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{getStat(off, "threePointFieldGoalPct")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}