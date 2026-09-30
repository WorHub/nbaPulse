import React from "react";
import { format } from "date-fns";
import { Activity, CalendarX2, Radio, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import GameDateControls from "@/components/scores/GameDateControls";
import ScoreCard from "@/components/scores/ScoreCard";
import ErrorState from "@/components/shared/ErrorState";
import { useScoreboard } from "@/hooks/use-scoreboard";

function ScoreboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading games">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="h-44 animate-pulse rounded-xl border border-border bg-card p-4">
          <div className="mb-6 h-5 w-20 rounded-full bg-muted" />
          <div className="space-y-5">
            <div className="h-7 rounded-lg bg-muted" />
            <div className="h-7 rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Scores() {
  const {
    selectedDate,
    games,
    selectDate,
    goPrevious,
    goNext,
    goToday,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useScoreboard();

  const liveCount = games.filter((game) => game.status?.type?.state === "in").length;
  const finalCount = games.filter((game) => game.status?.type?.completed).length;
  const scheduledCount = games.length - liveCount - finalCount;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Activity className="h-4 w-4" /> NBA scoreboard
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Games</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every matchup, live status, and final score—one day at a time.</p>
        </div>
        <GameDateControls
          selectedDate={selectedDate}
          onSelect={selectDate}
          onPrevious={goPrevious}
          onNext={goNext}
          onToday={goToday}
          align="right"
        />
      </div>

      <div className="mb-5 flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{format(selectedDate, "EEEE, MMMM d")}</span>
        {!isLoading && !error && games.length > 0 && (
          <>
            <span>·</span>
            <span>{games.length} {games.length === 1 ? "game" : "games"}</span>
            {liveCount > 0 && <span className="inline-flex items-center gap-1 font-semibold text-red-400"><Radio className="h-3 w-3" />{liveCount} live</span>}
            {scheduledCount > 0 && <span>· {scheduledCount} upcoming</span>}
            {finalCount > 0 && <span>· {finalCount} final</span>}
          </>
        )}
        {isFetching && !isLoading && <RefreshCw className="ml-auto h-3.5 w-3.5 animate-spin text-primary" aria-label="Refreshing scores" />}
      </div>

      {isLoading && <ScoreboardSkeleton />}
      {!isLoading && error && (
        <ErrorState message={error.message || "The scoreboard could not be loaded."} onRetry={refetch} />
      )}

      {!isLoading && !error && games.length === 0 && (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 text-center">
          <div className="mb-4 rounded-full bg-secondary p-4"><CalendarX2 className="h-7 w-7 text-primary" /></div>
          <h2 className="text-lg font-bold text-foreground">No games on this date</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">The scoreboard loaded successfully, but the NBA has no games scheduled for {format(selectedDate, "MMMM d, yyyy")}.</p>
          <div className="mt-5 flex gap-2">
            <Button variant="outline" size="sm" onClick={goPrevious}>Previous day</Button>
            <Button size="sm" onClick={goToday}>Back to today</Button>
          </div>
        </div>
      )}

      {!isLoading && !error && games.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => <ScoreCard key={game.id} game={game} />)}
        </div>
      )}
    </div>
  );
}
