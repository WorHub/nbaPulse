import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPlayerProfile, fetchPlayerSeasonStats, fetchPlayerCareerStats, fetchPlayerNews } from "@/lib/espn";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorState from "@/components/shared/ErrorState";

const CURRENT_NBA_SEASON = 2026;
const CURRENT_SEASON_LABEL = "2025-26";
const FALLBACK_CAREER_START = 2002;

function StatBadge({ label, value, highlight = false }) {
  return (
    <div className={`flex flex-col items-center rounded-xl p-3 border ${highlight ? "border-primary/40 bg-primary/10" : "border-border bg-card"}`}>
      <span className={`text-xl font-black font-mono ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</span>
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

function getStatFromCategory(category, name) {
  const stat = (category?.stats || []).find((item) => item.name === name || item.abbreviation === name);
  return stat?.displayValue ?? stat?.value ?? "-";
}

function statRowHasData(row) {
  const categories = getCategories(row);
  return categories.some((category) => (
    (category.stats || []).some((stat) => {
      const value = Number(stat.value ?? stat.displayValue);
      return Number.isFinite(value) && value > 0;
    })
  ));
}

function formatSeasonLabel(season) {
  const startYear = Number(season) - 1;
  const endYear = String(season).slice(-2);
  return Number.isFinite(startYear) ? `${startYear}-${endYear}` : season;
}

function PlayerNewsCard({ article }) {
  const image = article.images?.[0];
  const link = article.links?.web?.href || article.link;
  const published = article.published ? format(new Date(article.published), "MMM d, yyyy") : "";

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all"
    >
      {image && (
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={image.url}
            alt={article.headline}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {article.byline && <span className="text-xs text-primary font-medium">{article.byline}</span>}
          {published && <span className="text-xs text-muted-foreground">{published}</span>}
        </div>
        <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {article.headline}
        </h3>
        {article.description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{article.description}</p>
        )}
        {link && (
          <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Read more</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        )}
      </div>
    </a>
  );
}

export default function PlayerProfile() {
  const { athleteId } = useParams();

  const { data: profileData, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useQuery({
    queryKey: ["playerProfile", athleteId],
    queryFn: () => fetchPlayerProfile(athleteId),
  });

  const athlete = profileData?.athlete;
  const debutYear = Number(athlete?.debutYear);
  const careerStartSeason = Number.isFinite(debutYear) ? debutYear + 1 : FALLBACK_CAREER_START;

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["playerSeasonStats", athleteId, CURRENT_NBA_SEASON],
    queryFn: () => fetchPlayerSeasonStats(athleteId, { season: CURRENT_NBA_SEASON }),
  });

  const { data: careerStatsData, isLoading: careerLoading } = useQuery({
    queryKey: ["playerCareerStats", athleteId, careerStartSeason],
    queryFn: () => fetchPlayerCareerStats(athleteId, { startSeason: careerStartSeason, endSeason: CURRENT_NBA_SEASON }),
    enabled: Boolean(athleteId && athlete),
  });

  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ["playerNews", athleteId],
    queryFn: () => fetchPlayerNews(athleteId),
    enabled: Boolean(athleteId),
  });

  if (profileLoading) return <LoadingSpinner text="Loading player..." />;
  if (profileError) return <ErrorState message="Failed to load player" onRetry={refetchProfile} />;
  if (!athlete) return <ErrorState message="Player not found" onRetry={refetchProfile} />;

  const headshot = athlete.headshot?.href;
  const team = athlete.team;
  const teamColor = team?.color || "f97316";
  const injuries = athlete.injuries || [];

  const currentCategories = getCategories(statsData);
  const offensiveStats = currentCategories.find((category) => category.name === "offensive") || currentCategories[0];
  const statValues = {};
  (offensiveStats?.stats || []).forEach((stat) => {
    statValues[stat.name] = stat.displayValue || stat.value;
  });

  const pts = parseFloat(statValues.avgPoints || 0);
  const reb = parseFloat(statValues.avgRebounds || 0);
  const ast = parseFloat(statValues.avgAssists || 0);
  const stl = parseFloat(statValues.avgSteals || 0);
  const blk = parseFloat(statValues.avgBlocks || 0);
  const turnovers = parseFloat(statValues.avgTurnovers || 0);

  const seasonHistory = (careerStatsData || [])
    .filter(statRowHasData)
    .sort((a, b) => Number(b.season) - Number(a.season));
  const articles = (newsData?.articles || newsData?.headlines || []).slice(0, 6);

  return (
    <div>
      <Link
        to="/players"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        All Players
      </Link>

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
              {athlete.jersey && <span className="text-2xl font-bold text-muted-foreground">#{athlete.jersey}</span>}
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
              {athlete.age && <span className="text-xs text-muted-foreground">Age {athlete.age}</span>}
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

      {(pts > 0 || reb > 0) && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">{CURRENT_SEASON_LABEL} Season Averages</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
            <StatBadge label="PTS" value={pts || "-"} highlight />
            <StatBadge label="REB" value={reb || "-"} />
            <StatBadge label="AST" value={ast || "-"} />
            <StatBadge label="STL" value={stl || "-"} />
            <StatBadge label="BLK" value={blk || "-"} />
            <StatBadge label="TO" value={turnovers || "-"} />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 mt-3">
            {statValues.fieldGoalPct && <StatBadge label="FG%" value={statValues.fieldGoalPct} />}
            {statValues.threePointFieldGoalPct && <StatBadge label="3P%" value={statValues.threePointFieldGoalPct} />}
            {statValues.freeThrowPct && <StatBadge label="FT%" value={statValues.freeThrowPct} />}
          </div>
        </div>
      )}

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

      {careerLoading && <LoadingSpinner text="Loading past seasons..." />}
      {!careerLoading && seasonHistory.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Year-by-Year Stats</h2>
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
                  {seasonHistory.map((season) => {
                    const categories = getCategories(season);
                    const offensive = categories.find((category) => category.name === "offensive") || {};
                    const general = categories.find((category) => category.name === "general") || {};
                    return (
                      <tr key={season.season} className="border-b border-border hover:bg-secondary/20 transition-colors">
                        <td className="py-2.5 px-4 font-medium">{season.displayName || formatSeasonLabel(season.season)}</td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground">{season.team?.abbreviation || season.team?.shortDisplayName || "-"}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{getStatFromCategory(general, "gamesPlayed")}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-primary">{getStatFromCategory(offensive, "avgPoints")}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{getStatFromCategory(offensive, "avgRebounds")}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{getStatFromCategory(offensive, "avgAssists")}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{getStatFromCategory(offensive, "avgSteals")}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{getStatFromCategory(offensive, "avgBlocks")}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{getStatFromCategory(offensive, "fieldGoalPct")}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{getStatFromCategory(offensive, "threePointFieldGoalPct")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {!careerLoading && seasonHistory.length === 0 && !statsLoading && (
        <div className="mb-8 bg-card border border-border rounded-xl p-4 text-sm text-muted-foreground">
          Past-season stats are not available for this player yet.
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-4">Related News</h2>
        {newsLoading && <LoadingSpinner text="Loading player news..." />}
        {!newsLoading && articles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => (
              <PlayerNewsCard key={article.id || article.headline} article={article} />
            ))}
          </div>
        )}
        {!newsLoading && articles.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-4 text-sm text-muted-foreground">
            No recent ESPN stories found for {athlete.displayName}.
          </div>
        )}
      </div>
    </div>
  );
}
