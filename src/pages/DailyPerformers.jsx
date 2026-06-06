import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchScoreboard, calcFantasyPoints } from "@/lib/espn";
import { format, subDays, addDays, isAfter } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, Star, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Link } from "react-router-dom";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorState from "@/components/shared/ErrorState";

// Box score stats order: MIN PTS FG 3PT FT REB AST TO STL BLK OREB DREB PF +/-
const IDX = { MIN: 0, PTS: 1, FG: 2, "3PT": 3, FT: 4, REB: 5, AST: 6, TO: 7, STL: 8, BLK: 9, OREB: 10, DREB: 11, PF: 12, PM: 13 };
const ARCHIVE_START_DATE = new Date(1996, 0, 1);

function parseStat(statsArr, key) {
  const val = statsArr?.[IDX[key]];
  if (!val || val === "--") return 0;
  // handle "x-y" fractions
  if (typeof val === "string" && val.includes("-")) return 0;
  return parseFloat(val) || 0;
}

function extractPlayersFromGames(games) {
  const players = [];
  for (const game of games) {
    const competition = game.competitions?.[0];
    if (!competition) continue;
    const isFinal = competition.status?.type?.completed;
    const isLive = competition.status?.type?.state === "in";
    if (!isFinal && !isLive) continue;

    const boxPlayers = competition.competitors?.flatMap(competitor => {
      const teamAbbrev = competitor.team?.abbreviation;
      const teamLogo = competitor.team?.logo;
      return (competitor.leaders || []).flatMap(leader =>
        (leader.leaders || []).map(l => ({
          athleteId: l.athlete?.id,
          displayName: l.athlete?.displayName,
          shortName: l.athlete?.shortName,
          headshot: l.athlete?.headshot,
          position: l.athlete?.position?.abbreviation,
          teamAbbrev,
          teamLogo,
          gameId: game.id,
          statType: leader.name,
          displayValue: l.displayValue,
        }))
      );
    }) || [];

    players.push(...boxPlayers);
  }
  return players;
}

function extractDetailedFromBoxscore(game) {
  const competition = game.competitions?.[0];
  if (!competition) return [];

  const playerMap = {};

  for (const competitor of (competition.competitors || [])) {
    const teamAbbrev = competitor.team?.abbreviation;
    const teamLogo = competitor.team?.logo;

    // Use statistics array if available (in leaders)
    for (const leader of (competitor.leaders || [])) {
      for (const l of (leader.leaders || [])) {
        const id = l.athlete?.id;
        if (!id) continue;
        if (!playerMap[id]) {
          playerMap[id] = {
            athleteId: id,
            displayName: l.athlete?.displayName,
            shortName: l.athlete?.shortName,
            headshot: l.athlete?.headshot,
            position: l.athlete?.position?.abbreviation,
            teamAbbrev,
            teamLogo,
            gameId: game.id,
            stats: {},
          };
        }
        // Map leader stat names to our keys
        const nameMap = { points: "PTS", rebounds: "REB", assists: "AST", steals: "STL", blocks: "BLK" };
        const statKey = nameMap[leader.name];
        if (statKey) {
          playerMap[id].stats[statKey] = parseFloat(l.displayValue) || 0;
        }
      }
    }
  }

  return Object.values(playerMap).map(p => {
    const pts = p.stats.PTS || 0;
    const reb = p.stats.REB || 0;
    const ast = p.stats.AST || 0;
    const stl = p.stats.STL || 0;
    const blk = p.stats.BLK || 0;
    const to = p.stats.TO || 0;
    return { ...p, fpts: calcFantasyPoints({ pts, reb, ast, stl, blk, to }) };
  });
}

export default function DailyPerformers() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

  const dateStr = format(selectedDate, "yyyyMMdd");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["scoreboard-daily", dateStr],
    queryFn: () => fetchScoreboard(dateStr),
  });

  useEffect(() => {
    const handler = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) setCalendarOpen(false);
    };
    if (calendarOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calendarOpen]);

  const games = data?.events || [];

  // Extract all performers from leaders across games
  const performerMap = {};
  for (const game of games) {
    const competition = game.competitions?.[0];
    if (!competition) continue;
    const isFinal = competition.status?.type?.completed;
    const isLive = competition.status?.type?.state === "in";
    if (!isFinal && !isLive) continue;

    for (const competitor of (competition.competitors || [])) {
      const teamAbbrev = competitor.team?.abbreviation;
      const teamLogo = competitor.team?.logo;

      for (const leader of (competitor.leaders || [])) {
        for (const l of (leader.leaders || [])) {
          const id = l.athlete?.id;
          if (!id) continue;
          if (!performerMap[id]) {
            performerMap[id] = {
              athleteId: id,
              displayName: l.athlete?.displayName,
              shortName: l.athlete?.shortName,
              headshot: l.athlete?.headshot,
              position: l.athlete?.position?.abbreviation,
              teamAbbrev,
              teamLogo,
              gameId: game.id,
              PTS: 0, REB: 0, AST: 0, STL: 0, BLK: 0, TO: 0,
            };
          }
          const nameMap = { points: "PTS", rebounds: "REB", assists: "AST", steals: "STL", blocks: "BLK" };
          const key = nameMap[leader.name];
          if (key) performerMap[id][key] = parseFloat(l.displayValue) || 0;
        }
      }
    }
  }

  const performers = Object.values(performerMap)
    .map(p => ({
      ...p,
      fpts: calcFantasyPoints({ pts: p.PTS, reb: p.REB, ast: p.AST, stl: p.STL, blk: p.BLK, to: p.TO }),
    }))
    .sort((a, b) => b.fpts - a.fpts);

  const hasData = performers.length > 0;
  const topPerformer = performers[0];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Performers</h1>
          <p className="text-sm text-muted-foreground mt-1">Top fantasy performers ranked by FPTS</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setSelectedDate((d) => {
              const previousDate = subDays(d, 1);
              return isAfter(ARCHIVE_START_DATE, previousDate) ? d : previousDate;
            })}
            disabled={!isAfter(selectedDate, ARCHIVE_START_DATE)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => setCalendarOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
            >
              <CalendarDays className="w-4 h-4 text-primary" />
              {format(selectedDate, "MMM d, yyyy")}
            </button>
            {calendarOpen && (
              <div className="absolute top-full right-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => { if (d) { setSelectedDate(d); setCalendarOpen(false); } }}
                  defaultMonth={selectedDate}
                  captionLayout="dropdown-buttons"
                  fromYear={1996}
                  toYear={new Date().getFullYear() + 1}
                  disabled={{ before: ARCHIVE_START_DATE }}
                  initialFocus
                />
              </div>
            )}
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setSelectedDate(d => addDays(d, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading && <LoadingSpinner text="Loading performers..." />}
      {error && <ErrorState message="Failed to load data" onRetry={refetch} />}

      {!isLoading && !error && !hasData && (
        <div className="text-center py-20 text-muted-foreground text-sm">No completed games on this date</div>
      )}

      {!isLoading && !error && hasData && (
        <>
          {/* Top performer spotlight */}
          {topPerformer && (
            <div
              className="rounded-2xl p-6 mb-6 border border-primary/30 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.15) 0%, transparent 60%)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold text-primary uppercase tracking-wider">Top Performer</span>
              </div>
              <div className="flex items-center gap-4">
                {topPerformer.headshot && (
                  <img src={topPerformer.headshot} alt={topPerformer.displayName} className="w-16 h-16 rounded-full object-cover bg-muted" />
                )}
                <div className="flex-1">
                  <Link to={`/player/${topPerformer.athleteId}`} className="text-2xl font-black text-foreground hover:text-primary transition-colors">
                    {topPerformer.displayName}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    {topPerformer.teamLogo && <img src={topPerformer.teamLogo} className="w-5 h-5 object-contain" alt="" />}
                    <span className="text-sm text-muted-foreground">{topPerformer.teamAbbrev} · {topPerformer.position}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-primary font-mono">{topPerformer.fpts}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">FPTS</div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 mt-4">
                {[["PTS", topPerformer.PTS], ["REB", topPerformer.REB], ["AST", topPerformer.AST], ["STL", topPerformer.STL], ["BLK", topPerformer.BLK]].map(([label, val]) => (
                  <div key={label} className="text-center bg-card/50 rounded-lg p-2">
                    <div className="text-lg font-bold font-mono text-foreground">{val || 0}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full rankings table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Fantasy Rankings — {format(selectedDate, "MMMM d, yyyy")}</span>
              <span className="text-xs text-muted-foreground ml-auto">FPTS = PTS + REB×1.2 + AST×1.5 + STL×3 + BLK×3 - TO</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left py-3 px-4 text-muted-foreground uppercase w-8">#</th>
                    <th className="text-left py-3 px-4 text-muted-foreground uppercase min-w-[150px]">Player</th>
                    <th className="text-center py-3 px-3 text-muted-foreground uppercase">Team</th>
                    <th className="text-center py-3 px-3 text-primary uppercase font-bold">FPTS</th>
                    <th className="text-center py-3 px-3 text-muted-foreground uppercase">PTS</th>
                    <th className="text-center py-3 px-3 text-muted-foreground uppercase">REB</th>
                    <th className="text-center py-3 px-3 text-muted-foreground uppercase">AST</th>
                    <th className="text-center py-3 px-3 text-muted-foreground uppercase">STL</th>
                    <th className="text-center py-3 px-3 text-muted-foreground uppercase">BLK</th>
                    <th className="text-center py-3 px-3 text-muted-foreground uppercase hidden sm:table-cell">TO</th>
                  </tr>
                </thead>
                <tbody>
                  {performers.map((p, i) => (
                    <tr key={p.athleteId} className={`border-b border-border hover:bg-secondary/30 transition-colors ${i < 3 ? "bg-primary/5" : ""}`}>
                      <td className="py-2.5 px-4 font-mono text-muted-foreground">{i + 1}</td>
                      <td className="py-2.5 px-4">
                        <Link to={`/player/${p.athleteId}`} className="flex items-center gap-2.5 hover:text-primary transition-colors group">
                          {p.headshot && (
                            <img src={p.headshot} alt={p.displayName} className="w-7 h-7 rounded-full object-cover bg-muted flex-shrink-0" />
                          )}
                          <div>
                            <div className="font-semibold text-foreground group-hover:text-primary whitespace-nowrap">{p.displayName}</div>
                            <div className="text-[10px] text-muted-foreground">{p.position}</div>
                          </div>
                          {i === 0 && <Star className="w-3 h-3 text-primary fill-primary ml-1" />}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {p.teamLogo && <img src={p.teamLogo} alt="" className="w-4 h-4 object-contain" />}
                          <span className="text-muted-foreground font-semibold">{p.teamAbbrev}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-primary">{p.fpts}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{p.PTS || "-"}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{p.REB || "-"}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{p.AST || "-"}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{p.STL || "-"}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">{p.BLK || "-"}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-muted-foreground hidden sm:table-cell">{p.TO || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}