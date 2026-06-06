import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPlayerCareerStats, fetchPlayerNews, fetchPlayerProfile, fetchPlayerSeasonStats, calcFantasyPoints } from "@/lib/espn";
import { ArrowLeft, Activity, Newspaper, Ruler, TrendingUp, UserRound } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorState from "@/components/shared/ErrorState";

const CURRENT_NBA_SEASON = 2026;
const CURRENT_SEASON_LABEL = "2025-26";

function StatBadge({ label, value, sublabel = null, highlight = false }) {
  return (
    <div className={`rounded-xl p-3 border ${highlight ? "border-primary/40 bg-primary/10" : "border-border bg-card"}`}>
      <span className={`block text-2xl font-black font-mono ${highlight ? "text-primary" : "text-foreground"}`}>{value ?? "-"}</span>
      <span className="block text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</span>
      {sublabel && <span className="block text-[10px] text-muted-foreground mt-1">{sublabel}</span>}
    </div>
  );
}

function DetailItem({ label, value, icon: Icon }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function getCategories(statBlock) {
  return (
    statBlock?.splits?.categories ||
    statBlock?.categories ||
    statBlock?.statistics?.splits?.categories ||
    statBlock?.statistics?.categories ||
    []
  );
}

function collectStats(statBlock) {
  const values = {};
  getCategories(statBlock).forEach((category) => {
    (category.stats || []).forEach((stat) => {
      values[stat.name] = stat.displayValue ?? stat.value;
    });
  });
  return values;
}

function num(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function seasonLabel(season) {
  const start = Number(season) - 1;
  return `${String(start).slice(-2)}-${String(season).slice(-2)}`;
}

function formatPct(value) {
  const parsed = num(value);
  if (!parsed) return value || "-";
  return parsed <= 1 ? `${(parsed * 100).toFixed(1)}%` : `${parsed.toFixed(1)}%`;
}

export default function PlayerProfile() {
  const { athleteId } = useParams();

  const { data: profileData, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useQuery({
    queryKey: ["playerProfile", athleteId],
    queryFn: () => fetchPlayerProfile(athleteId),
  });

  const athlete = profileData?.athlete;

  const { data: statsData } = useQuery({
    queryKey: ["playerSeasonStats", athleteId, CURRENT_NBA_SEASON],
    queryFn: () => fetchPlayerSeasonStats(athleteId, { season: CURRENT_NBA_SEASON }),
  });

  const debutSeason = Math.max(Number(athlete?.debutYear || CURRENT_NBA_SEASON - 8), 1997);
  const { data: careerData = [] } = useQuery({
    queryKey: ["playerCareerStats", athleteId, debutSeason],
    queryFn: () => fetchPlayerCareerStats(athleteId, { startSeason: debutSeason, endSeason: CURRENT_NBA_SEASON }),
    enabled: Boolean(athlete),
  });

  const { data: newsData } = useQuery({
    queryKey: ["playerNews", athleteId],
    queryFn: () => fetchPlayerNews(athleteId),
    enabled: Boolean(athlete),
  });

  const statValues = useMemo(() => collectStats(statsData), [statsData]);
  const careerRows = useMemo(() => careerData
    .map((seasonBlock) => ({ season: seasonBlock.season, stats: collectStats(seasonBlock) }))
    .filter((row) => num(row.stats.gamesPlayed || row.stats.gamesStarted || row.stats.avgPoints) > 0)
    .sort((a, b) => b.season - a.season), [careerData]);

  if (profileLoading) return <LoadingSpinner text="Loading player..." />;
  if (profileError) return <ErrorState message="Failed to load player" onRetry={refetchProfile} />;
  if (!athlete) return <ErrorState message="Player not found" onRetry={refetchProfile} />;

  const headshot = athlete.headshot?.href;
  const team = athlete.team;
  const teamColor = team?.color || "f97316";
  const injuries = athlete.injuries || [];
  const pts = num(statValues.avgPoints);
  const reb = num(statValues.avgRebounds);
  const ast = num(statValues.avgAssists);
  const stl = num(statValues.avgSteals);
  const blk = num(statValues.avgBlocks);
  const turnovers = num(statValues.avgTurnovers);
  const fantasy = calcFantasyPoints({ pts, reb, ast, stl, blk, to: turnovers });
  const latestNews = newsData?.articles?.slice(0, 3) || [];
  const maxPts = Math.max(...careerRows.map((row) => num(row.stats.avgPoints)), 1);

  return (
    <div>
      <Link to="/players" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        All Players
      </Link>

      <div className="rounded-3xl mb-8 border border-border relative overflow-hidden bg-card">
        <div className="absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at 10% 10%, #${teamColor}55, transparent 38%), linear-gradient(135deg, #${teamColor}24 0%, transparent 65%)` }} />
        <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row gap-6 lg:items-end">
          {headshot && <img src={headshot} alt={athlete.displayName} className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl object-cover bg-muted" />}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-5xl font-black text-foreground">{athlete.displayName}</h1>
              {athlete.jersey && <span className="text-2xl font-bold text-muted-foreground">#{athlete.jersey}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {team && (
                <div className="flex items-center gap-2 rounded-full bg-background/70 px-3 py-1">
                  <img src={team.logos?.[0]?.href} alt={team.displayName} className="w-6 h-6 object-contain" />
                  <span className="text-sm font-medium text-foreground">{team.displayName}</span>
                </div>
              )}
              {athlete.position && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{athlete.position.displayName}</span>}
              {athlete.displayHeight && <span className="rounded-full bg-background/70 px-3 py-1 text-xs text-muted-foreground">{athlete.displayHeight} · {athlete.displayWeight}</span>}
              {athlete.age && <span className="rounded-full bg-background/70 px-3 py-1 text-xs text-muted-foreground">Age {athlete.age}</span>}
            </div>
            {injuries.length > 0 && (
              <div className="mt-4">
                <span className="text-xs px-3 py-1 rounded-full bg-destructive/20 text-destructive font-semibold">
                  {injuries[0].status} — {injuries[0].longComment?.split(".")[0]}
                </span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 lg:w-80">
            <StatBadge label="PTS" value={pts || "-"} highlight />
            <StatBadge label="REB" value={reb || "-"} />
            <StatBadge label="AST" value={ast || "-"} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">{CURRENT_SEASON_LABEL} profile</h2>
              <span className="text-xs text-muted-foreground">Regular season averages</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatBadge label="PTS" value={pts || "-"} highlight />
              <StatBadge label="REB" value={reb || "-"} />
              <StatBadge label="AST" value={ast || "-"} />
              <StatBadge label="STL" value={stl || "-"} />
              <StatBadge label="BLK" value={blk || "-"} />
              <StatBadge label="Fantasy" value={fantasy || "-"} sublabel="DK-style est." />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground"><TrendingUp className="h-5 w-5 text-primary" /> Shooting & ball security</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBadge label="FG%" value={formatPct(statValues.fieldGoalPct)} />
              <StatBadge label="3P%" value={formatPct(statValues.threePointFieldGoalPct)} />
              <StatBadge label="FT%" value={formatPct(statValues.freeThrowPct)} />
              <StatBadge label="TO" value={turnovers || "-"} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border p-4">
              <h2 className="text-lg font-bold text-foreground">Career stats</h2>
              <p className="text-xs text-muted-foreground">Season-by-season averages pulled from ESPN endpoints.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-secondary/50 text-muted-foreground uppercase tracking-wider">
                  <tr>
                    {["Season", "GP", "PTS", "REB", "AST", "STL", "BLK", "FG%", "3P%", "FT%", "Trend"].map((header) => <th key={header} className="px-3 py-3 text-center first:text-left">{header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {careerRows.map((row) => {
                    const rowPts = num(row.stats.avgPoints);
                    return (
                      <tr key={row.season} className="border-t border-border hover:bg-secondary/30">
                        <td className="px-3 py-3 font-semibold text-foreground">{seasonLabel(row.season)}</td>
                        <td className="px-3 py-3 text-center font-mono text-muted-foreground">{row.stats.gamesPlayed || "-"}</td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-foreground">{row.stats.avgPoints || "-"}</td>
                        <td className="px-3 py-3 text-center font-mono text-muted-foreground">{row.stats.avgRebounds || "-"}</td>
                        <td className="px-3 py-3 text-center font-mono text-muted-foreground">{row.stats.avgAssists || "-"}</td>
                        <td className="px-3 py-3 text-center font-mono text-muted-foreground">{row.stats.avgSteals || "-"}</td>
                        <td className="px-3 py-3 text-center font-mono text-muted-foreground">{row.stats.avgBlocks || "-"}</td>
                        <td className="px-3 py-3 text-center font-mono text-muted-foreground">{formatPct(row.stats.fieldGoalPct)}</td>
                        <td className="px-3 py-3 text-center font-mono text-muted-foreground">{formatPct(row.stats.threePointFieldGoalPct)}</td>
                        <td className="px-3 py-3 text-center font-mono text-muted-foreground">{formatPct(row.stats.freeThrowPct)}</td>
                        <td className="px-3 py-3 min-w-28"><div className="h-2 rounded-full bg-secondary"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(5, (rowPts / maxPts) * 100)}%` }} /></div></td>
                      </tr>
                    );
                  })}
                  {careerRows.length === 0 && <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">Career stats are not available for this player yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <DetailItem label="Height / Weight" value={athlete.displayHeight && `${athlete.displayHeight} · ${athlete.displayWeight}`} icon={Ruler} />
            <DetailItem label="Birthplace" value={[athlete.birthPlace?.city, athlete.birthPlace?.state, athlete.birthPlace?.country].filter(Boolean).join(", ")} icon={UserRound} />
            <DetailItem label="College / Org" value={athlete.college?.name} icon={Activity} />
            <DetailItem label="Draft / Debut" value={athlete.debutYear && `NBA debut: ${athlete.debutYear}`} icon={TrendingUp} />
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground"><Newspaper className="h-5 w-5 text-primary" /> Latest news</h2>
            <div className="space-y-4">
              {latestNews.map((article) => (
                <a key={article.dataSourceIdentifier || article.headline} href={article.links?.web?.href} target="_blank" rel="noreferrer" className="block rounded-xl border border-border p-3 hover:border-primary/50 hover:bg-secondary/30">
                  <p className="text-sm font-semibold text-foreground">{article.headline}</p>
                  {article.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{article.description}</p>}
                </a>
              ))}
              {latestNews.length === 0 && <p className="text-sm text-muted-foreground">No recent player news available.</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
