import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchScoreboard, findNearestGameDate } from "@/lib/espn";
import { format, addDays, subDays, isAfter, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import ScoreCard from "@/components/scores/ScoreCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorState from "@/components/shared/ErrorState";

const ARCHIVE_START_DATE = new Date(1996, 0, 1);

const HISTORIC_DATES = [
  { label: "Opening night throwback", date: new Date(1996, 10, 1), note: "Bulls vs Celtics" },
  { label: "Kobe 81", date: new Date(2006, 0, 22), note: "Lakers vs Raptors" },
  { label: "2016 Finals G7", date: new Date(2016, 5, 19), note: "Cavaliers vs Warriors" },
  { label: "2024 Finals close", date: new Date(2024, 5, 17), note: "Celtics title night" },
];

export default function Scores() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [historicOpen, setHistoricOpen] = useState(false);
  const [isFindingGameDay, setIsFindingGameDay] = useState(false);
  const calendarRef = useRef(null);

  const dateStr = format(selectedDate, "yyyyMMdd");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["scoreboard", dateStr],
    queryFn: () => fetchScoreboard(dateStr),
  });

  const games = data?.events || [];

  const moveToGameDay = async (date, direction = "nearest") => {
    if (isAfter(ARCHIVE_START_DATE, date)) return;

    setIsFindingGameDay(true);
    try {
      const gameDate = await findNearestGameDate(date, direction);
      setSelectedDate(isAfter(ARCHIVE_START_DATE, gameDate) ? ARCHIVE_START_DATE : gameDate);
    } finally {
      setIsFindingGameDay(false);
    }
  };

  const goBack = () => moveToGameDay(subDays(selectedDate, 1), "back");
  const goForward = () => moveToGameDay(addDays(selectedDate, 1), "forward");
  const goToday = () => moveToGameDay(new Date(), "nearest");
  const jumpToDate = (date) => {
    moveToGameDay(date, "nearest");
    setHistoricOpen(false);
  };

  const handleDateSelect = (date) => {
    if (date) {
      moveToGameDay(date, "nearest");
      setCalendarOpen(false);
    }
  };

  useEffect(() => {
    if (isLoading || error || isFindingGameDay || games.length > 0) return;

    let cancelled = false;
    setIsFindingGameDay(true);
    findNearestGameDate(selectedDate, "nearest")
      .then((gameDate) => {
        if (!cancelled && !isSameDay(gameDate, selectedDate)) {
          setSelectedDate(gameDate);
        }
      })
      .finally(() => {
        if (!cancelled) setIsFindingGameDay(false);
      });

    return () => {
      cancelled = true;
    };
  }, [error, games.length, isFindingGameDay, isLoading, selectedDate]);

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
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Scores</h1>
          <p className="text-sm text-muted-foreground mt-1">Live, recent, and historic NBA game results</p>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Button variant="outline" size="icon" onClick={goBack} disabled={isFindingGameDay || !isAfter(selectedDate, ARCHIVE_START_DATE)} className="h-9 w-9">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToday} disabled={isFindingGameDay} className="h-9 text-xs">
          {isFindingGameDay ? "Finding games…" : "Today"}
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
                defaultMonth={selectedDate}
                captionLayout="dropdown-buttons"
                fromYear={1996}
                toYear={new Date().getFullYear() + 1}
                disabled={{ before: ARCHIVE_START_DATE }}
                initialFocus
                className="rounded-lg"
              />
            </div>
          )}
        </div>

        <Button variant="outline" size="icon" onClick={goForward} disabled={isFindingGameDay} className="h-9 w-9">
          <ChevronRight className="w-4 h-4" />
        </Button>

        <div className="relative">
          <Button variant="outline" size="sm" onClick={() => setHistoricOpen((open) => !open)} className="h-9 text-xs gap-2">
            <RotateCcw className="w-4 h-4" />
            Historic games
          </Button>
          {historicOpen && (
            <div className="absolute top-full left-0 mt-2 z-40 w-72 bg-card border border-border rounded-xl shadow-xl p-2">
              {HISTORIC_DATES.map((item) => (
                <button
                  key={item.label}
                  onClick={() => jumpToDate(item.date)}
                  className="w-full text-left rounded-lg px-3 py-2 hover:bg-secondary transition-colors"
                >
                  <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                  <span className="block text-xs text-muted-foreground">{format(item.date, "MMM d, yyyy")} · {item.note}</span>
                </button>
              ))}
              <div className="border-t border-border mt-2 pt-2 px-3 pb-1 text-[11px] leading-5 text-muted-foreground">
                Pick a featured date or use the calendar month and year menus to jump anywhere quickly.
              </div>
            </div>
          )}
        </div>
      </div>

      {(isLoading || isFindingGameDay) && <LoadingSpinner text={isFindingGameDay ? "Finding next game day..." : "Loading scores..."} />}
      {error && <ErrorState message="Failed to load scores" onRetry={refetch} />}

      {!isLoading && !isFindingGameDay && !error && games.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-sm">No games scheduled for this day</p>
        </div>
      )}

      {!isLoading && !isFindingGameDay && !error && games.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <ScoreCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}