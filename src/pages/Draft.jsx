import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Search, Trophy, History, Sparkles } from "lucide-react";
import { fetchDraftHistory } from "@/lib/nba";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorState from "@/components/shared/ErrorState";

function DraftStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </div>
      <div className="mt-2 text-2xl font-black text-foreground">{value}</div>
    </div>
  );
}

function PickCard({ pick, featured = false }) {
  return (
    <a
      href={pick.nbaProfileUrl || "#"}
      target={pick.nbaProfileUrl ? "_blank" : undefined}
      rel={pick.nbaProfileUrl ? "noreferrer" : undefined}
      className={`group rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg ${featured ? "border-primary/40 bg-primary/5" : "border-border"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl font-black ${featured ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
            {pick.overallPick}
          </div>
          <div>
            <div className="font-bold text-foreground group-hover:text-primary">{pick.playerName}</div>
            <div className="text-xs text-muted-foreground">
              Round {pick.round} · Pick {pick.roundPick}
            </div>
          </div>
        </div>
        {pick.nbaProfileUrl && <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="uppercase tracking-wider text-muted-foreground">Team</p>
          <p className="mt-1 font-semibold text-foreground">{pick.teamAbbreviation || "—"}</p>
        </div>
        <div>
          <p className="uppercase tracking-wider text-muted-foreground">From</p>
          <p className="mt-1 truncate font-semibold text-foreground">{pick.organization || "—"}</p>
        </div>
      </div>
    </a>
  );
}

export default function Draft() {
  const [year, setYear] = useState("latest");
  const [round, setRound] = useState("all");
  const [search, setSearch] = useState("");

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["draftHistory"],
    queryFn: fetchDraftHistory,
  });

  const seasons = useMemo(() => [...new Set(data.map((pick) => pick.season))].sort((a, b) => b - a), [data]);
  const latestSeason = seasons[0];
  const selectedSeason = year === "latest" ? latestSeason : Number(year);
  const currentDraft = data.filter((pick) => pick.season === latestSeason);
  const selectedDraft = data.filter((pick) => pick.season === selectedSeason);
  const lotteryPicks = selectedDraft.filter((pick) => pick.overallPick <= 14);

  const filteredPicks = selectedDraft.filter((pick) => {
    const query = search.trim().toLowerCase();
    const matchesRound = round === "all" || pick.round === Number(round);
    const matchesSearch = !query || [pick.playerName, pick.team, pick.teamAbbreviation, pick.organization]
      .some((value) => String(value || "").toLowerCase().includes(query));
    return matchesRound && matchesSearch;
  });

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-3xl border border-border bg-card">
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-primary/20 via-background to-background">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" /> NBA.com Stats API
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground">NBA Draft Hub</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse the latest draft class and the full historical draft archive from NBA.com&apos;s draft history endpoint.
            </p>
          </div>
        </div>
      </div>

      {isLoading && <LoadingSpinner text="Loading NBA draft history..." />}
      {error && <ErrorState message="Failed to load NBA draft history" onRetry={refetch} />}

      {!isLoading && !error && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <DraftStat label="Latest draft" value={latestSeason || "—"} icon={Trophy} />
            <DraftStat label="Latest picks" value={currentDraft.length || "—"} icon={Sparkles} />
            <DraftStat label="Historical picks" value={data.length.toLocaleString()} icon={History} />
          </div>

          <div className="mb-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground">{selectedSeason} Lottery board</h2>
                <p className="text-xs text-muted-foreground">Top 14 picks styled like a draft-night board.</p>
              </div>
              <select value={year} onChange={(event) => setYear(event.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                <option value="latest">Latest draft</option>
                {seasons.map((season) => <option key={season} value={season}>{season}</option>)}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {lotteryPicks.map((pick) => <PickCard key={pick.id} pick={pick} featured={pick.overallPick === 1} />)}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Historical draft table</h2>
                <p className="text-xs text-muted-foreground">Filter by player, team, school/country, season, or round.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search draft history..." className="h-9 pl-9 sm:w-64" />
                </div>
                <select value={round} onChange={(event) => setRound(event.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                  <option value="all">All rounds</option>
                  <option value="1">Round 1</option>
                  <option value="2">Round 2</option>
                </select>
                <Button variant="outline" size="sm" onClick={() => { setSearch(""); setRound("all"); }}>Reset</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-secondary/60 text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Pick</th>
                    <th className="px-4 py-3 text-left">Player</th>
                    <th className="px-4 py-3 text-left">Team</th>
                    <th className="px-4 py-3 text-left">From</th>
                    <th className="px-4 py-3 text-center">Round</th>
                    <th className="px-4 py-3 text-center">NBA</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPicks.map((pick) => (
                    <tr key={pick.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="px-4 py-3 font-mono font-bold text-foreground">#{pick.overallPick}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{pick.playerName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{pick.team || pick.teamAbbreviation || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{pick.organization || "—"}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{pick.round}.{pick.roundPick}</td>
                      <td className="px-4 py-3 text-center">
                        {pick.nbaProfileUrl ? <a href={pick.nbaProfileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Profile</a> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              Showing {filteredPicks.length} of {selectedDraft.length} picks for {selectedSeason}.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
