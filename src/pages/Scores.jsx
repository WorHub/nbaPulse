import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchScoreboard } from "@/lib/espn";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import ScoreCard from "@/components/scores/ScoreCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorState from "@/components/shared/ErrorState";

export default function Scores() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

  const dateStr = format(selectedDate, "yyyyMMdd");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["scoreboard", dateStr],
    queryFn: () => fetchScoreboard(dateStr),
  });

  const games = data?.events || [];

  const goBack = () => setSelectedDate((d) => subDays(d, 1));
  const goForward = () => setSelectedDate((d) => addDays(d, 1));
  const goToday = () => setSelectedDate(new Date());

  const handleDateSelect = (date) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  // Close calendar on outside click
  useEffect(() => {
    const handler = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setCalendarOpen(false);
      }
    };
    if (calendarOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calendarOpen]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Scores</h1>
          <p className="text-sm text-muted-foreground mt-1">Live and recent NBA game results</p>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Button variant="outline" size="icon" onClick={goBack} className="h-9 w-9">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToday} className="h-9 text-xs">
          Today
        </Button>

        {/* Clickable date with calendar popup */}
        <div className="relative" ref={calendarRef}>
          <button
            onClick={() => setCalendarOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
          >
            <CalendarDays className="w-4 h-4 text-primary" />
            {format(selectedDate, "EEEE, MMM d, yyyy")}
          </button>

          {calendarOpen && (
            <div className="absolute top-full left-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                className="rounded-lg"
              />
            </div>
          )}
        </div>

        <Button variant="outline" size="icon" onClick={goForward} className="h-9 w-9">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {isLoading && <LoadingSpinner text="Loading scores..." />}
      {error && <ErrorState message="Failed to load scores" onRetry={refetch} />}

      {!isLoading && !error && games.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-sm">No games scheduled for this day</p>
        </div>
      )}

      {!isLoading && !error && games.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <ScoreCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}