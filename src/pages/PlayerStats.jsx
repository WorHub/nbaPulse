import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllPlayerStats } from "@/lib/espn";
import { ChevronLeft, ChevronRight, Search, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorState from "@/components/shared/ErrorState";

const PAGE_SIZE = 50;
const ALL_PLAYER_PAGE_SIZE = 500;

const VIEWS = [
  { key: "offensive", label: "Scoring" },
  { key: "defensive", label: "Defense" },
];

// Indices into the API's totals array per category
// offensive totals: PTS FGM FGA FG% 3PM 3PA 3P% FTM FTA FT% AST TO ...
// general totals:   GP  MIN DD2 TD3 PF  +/- ... REB at idx 11
const GP_COL = { label: "GP", cat: "general", idx: 0 };

const OFFENSIVE_COLS = [
  GP_COL,
  { label: "PTS", cat: "offensive", idx: 0 },
  { label: "FG%", cat: "offensive", idx: 3 },
  { label: "3P%", cat: "offensive", idx: 6 },
  { label: "FT%", cat: "offensive", idx: 9 },
  { label: "AST", cat: "offensive", idx: 10 },
  { label: "TO",  cat: "offensive", idx: 11 },
  { label: "REB", cat: "general",   idx: 11 },
];
const DEFENSIVE_COLS = [
  GP_COL,
  { label: "STL",  cat: "defensive", idx: 0 },
  { label: "BLK",  cat: "defensive", idx: 1 },
  { label: "DREB", cat: "defensive", idx: 2 },
];
const VIEW_COLS = {
  offensive: OFFENSIVE_COLS,
  defensive: DEFENSIVE_COLS,
};

function SortIcon({ col, sortKey, dir }) {
  if (sortKey !== col) return <ChevronUp className="w-3 h-3 opacity-20" />;
  return dir === "desc"
    ? <ChevronDown className="w-3 h-3 text-primary" />
    : <ChevronUp className="w-3 h-3 text-primary" />;
}

export default function PlayerStats() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [seasonType, setSeasonType] = useState("2");
  const [view, setView] = useState("offensive");
  const [sortKey, setSortKey] = useState("PTS");
  const [sortDir, setSortDir] = useState("desc");

  const trimmedSearch = search.trim();
  const isSearching = trimmedSearch.length > 0;
  const playerStatsParams = {
    season: 2026,
    seasonType: Number(seasonType),
    limit: ALL_PLAYER_PAGE_SIZE,
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["playerStats", seasonType, "all"],
    queryFn: () => fetchAllPlayerStats(playerStatsParams),
  });

  const athletes = data?.athletes || [];

  const getCols = (nextView = view) => VIEW_COLS[nextView] || OFFENSIVE_COLS;

  const getStatVal = (entry, catName, idx) => {
    const cat = entry.categories?.find(c => c.name === catName);
    return parseFloat(cat?.values?.[idx] ?? cat?.totals?.[idx]) || 0;
  };

  const toggleSort = (label) => {
    setPage(1);

    if (sortKey === label) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortKey(label);
      setSortDir("desc");
    }
  };

  const filtered = athletes.filter(a => {
    if (!trimmedSearch) return true;
    const query = trimmedSearch.toLowerCase();
    const name = a.athlete?.displayName?.toLowerCase() || "";
    const fullName = a.athlete?.fullName?.toLowerCase() || "";
    const shortName = a.athlete?.shortName?.toLowerCase() || "";
    const team = a.athlete?.teamShortName?.toLowerCase() || "";
    return name.includes(query) || fullName.includes(query) || shortName.includes(query) || team.includes(query);
  });

  const cols = getCols();

  const sorted = [...filtered].sort((a, b) => {
    const col = cols.find(c => c.label === sortKey);
    if (!col) return 0;
    const aVal = getStatVal(a, col.cat, col.idx);
    const bVal = getStatVal(b, col.cat, col.idx);
    return sortDir === "desc" ? bVal - aVal : aVal - bVal;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const displayed = isSearching ? sorted : sorted.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Player Stats</h1>
          <p className="text-sm text-muted-foreground mt-1">Click any column header to sort</p>
        </div>
        <Tabs value={seasonType} onValueChange={(v) => { setSeasonType(v); setPage(1); }}>
          <TabsList className="bg-secondary h-8">
            <TabsTrigger value="2" className="text-xs h-7 px-3">Regular Season</TabsTrigger>
            <TabsTrigger value="3" className="text-xs h-7 px-3">Playoffs</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search all players or teams..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-card h-9"
          />
        </div>
        <Tabs value={view} onValueChange={(v) => { setView(v); setSortKey(v === "defensive" ? "STL" : "PTS"); setSortDir("desc"); setPage(1); }}>
          <TabsList className="bg-secondary h-8">
            {VIEWS.map(v => (
              <TabsTrigger key={v.key} value={v.key} className="text-xs h-7 px-3">{v.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading && <LoadingSpinner text="Loading all player stats..." />}
      {error && <ErrorState message="Failed to load player stats" onRetry={refetch} />}


      {!isLoading && !error && (
        <>
          <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left py-3 px-4 text-muted-foreground uppercase tracking-wider w-8 sticky left-0 bg-secondary/50">#</th>
                    <th className="text-left py-3 px-4 text-muted-foreground uppercase tracking-wider min-w-[160px] sticky left-8 bg-secondary/50">Player</th>
                    <th className="text-center py-3 px-3 text-muted-foreground uppercase tracking-wider">Team</th>
                    {cols.map(col => (
                      <th
                        key={col.label}
                        className="text-center py-3 px-3 uppercase tracking-wider min-w-[50px] cursor-pointer select-none hover:bg-secondary/70 transition-colors"
                        onClick={() => toggleSort(col.label)}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className={sortKey === col.label ? "text-primary font-bold" : "text-muted-foreground"}>{col.label}</span>
                          <SortIcon col={col.label} sortKey={sortKey} dir={sortDir} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.length > 0 ? (
                    displayed.map((entry, index) => {
                      const athlete = entry.athlete;
                      const headshot = athlete?.headshot?.href;
                      const globalRank = isSearching ? index + 1 : pageStart + index + 1;

                      return (
                        <tr key={athlete?.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                          <td className="py-2.5 px-4 text-muted-foreground font-mono sticky left-0 bg-card">{globalRank}</td>
                          <td className="py-2.5 px-4 sticky left-8 bg-card">
                            <Link to={`/player/${athlete?.id}`} className="flex items-center gap-2.5 hover:text-primary transition-colors group">
                              {headshot ? (
                                <img src={headshot} alt={athlete?.displayName} className="w-7 h-7 rounded-full object-cover bg-muted flex-shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0" />
                              )}
                              <div>
                                <div className="font-semibold text-foreground group-hover:text-primary whitespace-nowrap">{athlete?.displayName}</div>
                                <div className="text-muted-foreground text-[10px]">{athlete?.position?.abbreviation}</div>
                              </div>
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 text-center text-muted-foreground font-semibold">{athlete?.teamShortName}</td>
                          {cols.map(col => {
                            const raw = entry.categories?.find(c => c.name === col.cat)?.totals?.[col.idx] ?? "-";
                            return (
                              <td key={col.label} className="py-2.5 px-3 text-center font-mono text-muted-foreground">{raw}</td>
                            );
                          })}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={cols.length + 3} className="py-8 px-4 text-center text-sm text-muted-foreground">
                        No players found for “{trimmedSearch}”.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {isSearching ? (
            <p className="text-xs text-muted-foreground">Showing {sorted.length} matching players from the full player stats list.</p>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages} · {sorted.length} players</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}