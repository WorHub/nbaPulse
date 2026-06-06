import React from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPlayerCareerStats, fetchPlayerProfile, fetchPlayerSeasonStats } from "@/lib/espn";
import { ArrowLeft, Activity, Flame, Shield, Sparkles, TrendingUp } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorState from "@/components/shared/ErrorState";

const CURRENT_NBA_SEASON = 2026;
const CURRENT_SEASON_LABEL = "2025-26";

function StatBadge({ label, value, note, highlight = false }) {
  return (
    <div className={`rounded-xl p-3 border ${highlight ? "border-primary/40 bg-primary/10" : "border-border bg-card"}`}>
      <span className={`block text-2xl font-black font-mono leading-none ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
      <span className="block text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</span>
      {note && <span className="block text-[10px] text-muted-foreground mt-1">{note}</span>}
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

function flattenStats(statBlock) {
  const values = {};
  getCategories(statBlock).forEach((category) => {
    (category.stats || []).forEach((stat) => {
      values[stat.name] = stat.displayValue ?? stat.value;
      values[`${category.name}.${stat.name}`] = stat.displayValue ?? stat.value;
    });
  });
  return values;
}

function statNumber(values, names, fallback = 0) {
  const keys = Array.isArray(names) ? names : [names];
  for (const key of keys) {
    const raw = values[key];
    if (raw !== undefined && raw !== null && raw !== "") {
      const parsed = parseFloat(String(raw).replace("%", ""));
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return fallback;
}

function statDisplay(values, names, fallback = "—") {
  const keys = Array.isArray(names) ? names : [names];
  for (const key of keys) {
    const raw = values[key];
    if (raw !== undefined && raw !== null && raw !== "") return raw;
  }
  return fallback;
}

function seasonLabel(season) {
  const start = Number(season) - 1;
  return `${String(start).slice(-2)}-${String(season).slice(-2)}`;
}

function getCareerRows(careerData) {
  return (careerData || [])
    .map((seasonData) => {
      const values = flattenStats(seasonData);
      const gp = statNumber(values, ["gamesPlayed", "general.gamesPlayed", "GP"]);
      const pts = statNumber(values, ["avgPoints", "offensive.avgPoints"]);
      const reb = statNumber(values, ["avgRebounds", "general.avgRebounds", "offensive.avgRebounds"]);
      const ast = statNumber(values, ["avgAssists", "offensive.avgAssists"]);
      if (!gp && !pts && !reb && !ast) return null;

      return {
        season: seasonData.season,
        label: seasonLabel(seasonData.season),
        team: statDisplay(values, ["team", "teamName"], "—"),
        gp,
        min: statDisplay(values, ["avgMinutes", "general.avgMinutes"], "—"),
        pts,
        reb,
        ast,
        stl: statNumber(values, ["avgSteals", "defensive.avgSteals"]),
        blk: statNumber(values, ["avgBlocks", "defensive.avgBlocks"]),
        fg: statDisplay(values, ["fieldGoalPct", "offensive.fieldGoalPct"], "—"),
        three: statDisplay(values, ["threePointFieldGoalPct", "offensive.threePointFieldGoalPct"], "—"),
        ft: statDisplay(values, ["freeThrowPct", "offensive.freeThrowPct"], "—"),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.season - a.season);
}

function PlayerMetricBar({ label, value, max, colorClass = "bg-primary" }) {
  const width = Math.max(4, Math.min(100, (Number(value) / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="font-mono font-bold text-foreground">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function CareerTable({ rows }) {
  if (!rows.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Career stats</h2>
          <p className="text-xs text-muted-foreground mt-1">Season-by-season regular season averages.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/70 text-xs text-muted-foreground uppercase tracking-wider">
            <tr>
              {["Season", "GP", "MIN", "PTS", "REB", "AST", "STL", "BLK", "FG%", "3P%", "FT%"].map((header) => (
                <th key={header} className="px-4 py-3 text-right first:text-left whitespace-nowrap">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.season} className="border-t border-border/70 hover:bg-secondary/40 transition-colors">
                <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">{row.label}</td>
                <td className="px-4 py-3 text-right font-mono">{row.gp || "—"}</td>
                <td className="px-4 py-3 text-right font-mono">{row.min}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-primary">{row.pts || "—"}</td>
                <td className="px-4 py-3 text-right font-mono">{row.reb || "—"}</td>
                <td className="px-4 py-3 text-right font-mono">{row.ast || "—"}</td>
                <td className="px-4 py-3 text-right font-mono">{row.stl || "—"}</td>
                <td className="px-4 py-3 text-right font-mono">{row.blk || "—"}</td>
                <td className="px-4 py-3 text-right font-mono">{row.fg}</td>
                <td className="px-4 py-3 text-right font-mono">{row.three}</td>
                <td className="px-4 py-3 text-right font-mono">{row.ft}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PlayerProfile() {
  const { athleteId } = useParams();
  const location = useLocation();
  const backTo = location.state?.backTo || "/players";
  const backLabel = location.state?.backLabel || "All Players";

  const { data: profileData, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useQuery({
    queryKey: ["playerProfile", athleteId],
    queryFn: () => fetchPlayerProfile(athleteId),
  });

  const athlete = profileData?.athlete;
  const debutYear = Number(athlete?.debutYear) || CURRENT_NBA_SEASON - 14;
  const careerStartSeason = Math.max(debutYear + 1, 1997);

  const { data: statsData } = useQuery({
    queryKey: ["playerSeasonStats", athleteId, CURRENT_NBA_SEASON],
    queryFn: () => fetchPlayerSeasonStats(athleteId, { season: CURRENT_NBA_SEASON }),
  });

  const { data: careerData = [], isLoading: careerLoading } = useQuery({
    queryKey: ["playerCareerStats", athleteId, careerStartSeason, CURRENT_NBA_SEASON],
    queryFn: () => fetchPlayerCareerStats(athleteId, { startSeason: careerStartSeason, endSeason: CURRENT_NBA_SEASON }),
    enabled: Boolean(athleteId && athlete),
  });

  if (profileLoading) return <LoadingSpinner text="Loading player..." />;
  if (profileError) return <ErrorState message="Failed to load player" onRetry={refetchProfile} />;
  if (!athlete) return <ErrorState message="Player not found" onRetry={refetchProfile} />;

  const headshot = athlete.headshot?.href;
  const team = athlete.team;
  const teamColor = team?.color || "f97316";
  const injuries = athlete.injuries || [];
  const statValues = flattenStats(statsData);
  const careerRows = getCareerRows(careerData);
  const chartRows = [...careerRows].reverse().filter((row) => row.pts > 0);
  const bestSeason = careerRows.reduce((best, row) => (row.pts > (best?.pts || 0) ? row : best), null);

  const pts = statNumber(statValues, ["avgPoints", "offensive.avgPoints"]);
  const reb = statNumber(statValues, ["avgRebounds", "general.avgRebounds", "offensive.avgRebounds"]);
  const ast = statNumber(statValues, ["avgAssists", "offensive.avgAssists"]);
  const stl = statNumber(statValues, ["avgSteals", "defensive.avgSteals"]);
  const blk = statNumber(statValues, ["avgBlocks", "defensive.avgBlocks"]);
  const turnovers = statNumber(statValues, ["avgTurnovers", "offensive.avgTurnovers"]);
  const usageScore = Math.max(0, pts + ast * 2.2 + turnovers * 0.7).toFixed(1);
  const playmakingScore = Math.max(0, ast * 8 - turnovers * 3).toFixed(1);
  const stocks = (stl + blk).toFixed(1);
  const fantasy = (pts + reb * 1.2 + ast * 1.5 + stl * 3 + blk * 3 - turnovers).toFixed(1);

  return (
    <div>
      <Link
        to={backTo}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Link>

      <div
        className="rounded-3xl p-6 sm:p-8 mb-8 border border-border relative overflow-hidden"
        style={{ background: `radial-gradient(circle at 20% 20%, #${teamColor}44 0%, transparent 32%), linear-gradient(135deg, #${teamColor}24 0%, hsl(var(--card)) 70%)` }}
      >
        <div className="absolute inset-y-0 right-0 w-1/2 opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-end gap-6">
          {headshot && (
            <img src={headshot} alt={athlete.displayName} className="w-32 h-32 rounded-3xl object-cover bg-muted border border-white/10" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">{athlete.displayName}</h1>
              {athlete.jersey && <span className="text-2xl font-bold text-muted-foreground">#{athlete.jersey}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {team && (
                <div className="flex items-center gap-2">
                  <img src={team.logos?.[0]?.href} alt={team.displayName} className="w-7 h-7 object-contain" />
                  <span className="text-sm font-semibold text-muted-foreground">{team.displayName}</span>
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
              <div className="mt-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-semibold">
                  {injuries[0].status} — {injuries[0].longComment?.split(".")[0]}
                </span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            <StatBadge label="PTS" value={pts || "—"} highlight />
            <StatBadge label="REB" value={reb || "—"} />
            <StatBadge label="AST" value={ast || "—"} />
            <StatBadge label="Fantasy" value={Number(fantasy) ? fantasy : "—"} note="Pulse score" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2 space-y-6">
          {(pts > 0 || reb > 0) && (
            <section className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{CURRENT_SEASON_LABEL} impact dashboard</h2>
                  <p className="text-xs text-muted-foreground mt-1">A unique blend of box-score profile, efficiency, and role indicators.</p>
                </div>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <StatBadge label="STL" value={stl || "—"} />
                <StatBadge label="BLK" value={blk || "—"} />
                <StatBadge label="TO" value={turnovers || "—"} />
                <StatBadge label="STOCKS" value={Number(stocks) ? stocks : "—"} highlight />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <PlayerMetricBar label="Scoring gravity" value={pts || 0} max={38} colorClass="bg-primary" />
                  <PlayerMetricBar label="Playmaking" value={playmakingScore} max={70} colorClass="bg-sky-500" />
                  <PlayerMetricBar label="Usage profile" value={usageScore} max={55} colorClass="bg-orange-500" />
                  <PlayerMetricBar label="Defense events" value={stocks} max={5} colorClass="bg-emerald-500" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <StatBadge label="FG%" value={statDisplay(statValues, ["fieldGoalPct", "offensive.fieldGoalPct"])} />
                  <StatBadge label="3P%" value={statDisplay(statValues, ["threePointFieldGoalPct", "offensive.threePointFieldGoalPct"])} />
                  <StatBadge label="FT%" value={statDisplay(statValues, ["freeThrowPct", "offensive.freeThrowPct"])} />
                  <StatBadge label="eFG%" value={statDisplay(statValues, ["effectiveFieldGoalPct", "offensive.effectiveFieldGoalPct"])} />
                  <StatBadge label="2P%" value={statDisplay(statValues, ["twoPointFieldGoalPct", "offensive.twoPointFieldGoalPct"])} />
                  <StatBadge label="MIN" value={statDisplay(statValues, ["avgMinutes", "general.avgMinutes"])} />
                </div>
              </div>
            </section>
          )}

          <section className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-lg font-bold text-foreground">Career scoring arc</h2>
                <p className="text-xs text-muted-foreground">Historical per-game points by season.</p>
              </div>
            </div>
            {careerLoading ? (
              <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Loading career trend…</div>
            ) : chartRows.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartRows} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Line type="monotone" dataKey="pts" name="PTS" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No career trend available.</div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold text-foreground">Signature season</h2>
            </div>
            {bestSeason ? (
              <div>
                <p className="text-4xl font-black font-mono text-primary">{bestSeason.pts}</p>
                <p className="text-sm text-muted-foreground mt-1">points per game in {bestSeason.label}</p>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <StatBadge label="REB" value={bestSeason.reb || "—"} />
                  <StatBadge label="AST" value={bestSeason.ast || "—"} />
                  <StatBadge label="GP" value={bestSeason.gp || "—"} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Career peak will appear once historical stats load.</p>
            )}
          </section>

          <section className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Career context</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-6">
              Player pages combine current profile details with season-by-season trends so long-term production is easy to scan.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <StatBadge label="Seasons" value={careerRows.length || "—"} />
              <StatBadge label="Peak year" value={bestSeason?.label || "—"} />
            </div>
          </section>

          {(athlete.birthPlace || athlete.college) && (
            <section className="bg-card border border-border rounded-2xl p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Bio</h2>
              </div>
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
            </section>
          )}

          <section className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-foreground">Role snapshot</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-6">
              {pts >= 25 ? "Primary scorer" : pts >= 15 ? "Rotation scorer" : "Low-usage contributor"} · {ast >= 6 ? "creator" : "finisher"} · {stocks >= 2 ? "active event defender" : "team-defense dependent"}.
            </p>
          </section>
        </aside>
      </div>

      <CareerTable rows={careerRows} />
    </div>
  );
}
