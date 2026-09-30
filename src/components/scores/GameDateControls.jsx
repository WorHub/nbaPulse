import React, { useEffect, useRef, useState } from "react";
import { format, isSameDay } from "date-fns";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ARCHIVE_START_DATE = new Date(1996, 0, 1);
const CLASSIC_DATES = [
  { date: new Date(1998, 5, 14), label: "The Last Shot", detail: "1998 Finals · Game 6" },
  { date: new Date(2002, 5, 2), label: "Lakers–Kings", detail: "2002 West finals · Game 7" },
  { date: new Date(2010, 5, 17), label: "Lakers–Celtics", detail: "2010 Finals · Game 7" },
  { date: new Date(2016, 3, 13), label: "Kobe's farewell", detail: "60-point final game" },
  { date: new Date(2016, 5, 19), label: "Cavaliers–Warriors", detail: "2016 Finals · Game 7" },
  { date: new Date(2019, 5, 13), label: "Raptors' first title", detail: "2019 Finals · Game 6" },
];

export default function GameDateControls({
  selectedDate,
  onSelect,
  onPrevious,
  onNext,
  onToday,
  onRecent,
  isFindingRecent = false,
  showQuickJumps = false,
  align = "left",
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!calendarRef.current?.contains(event.target)) setCalendarOpen(false);
    };
    if (calendarOpen) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [calendarOpen]);

  const chooseDate = (date) => {
    if (!date) return;
    onSelect(date);
    setCalendarOpen(false);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${align === "right" ? "xl:justify-end" : ""}`}>
      {showQuickJumps && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <History className="h-4 w-4 text-primary" />
                Classic games
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align === "right" ? "end" : "start"} className="w-72 p-2">
              <DropdownMenuLabel className="px-2 pb-1 pt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Jump to NBA history
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {CLASSIC_DATES.map((classic) => (
                <DropdownMenuItem
                  key={classic.date.toISOString()}
                  onSelect={() => onSelect(classic.date)}
                  className="cursor-pointer items-start px-2 py-2.5"
                >
                  <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold text-foreground">{classic.label}</span>
                    <span className="text-xs text-muted-foreground">{classic.detail} · {format(classic.date, "MMM d, yyyy")}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={onRecent} disabled={isFindingRecent} className="h-9 gap-2">
            {isFindingRecent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4 text-primary" />}
            {isFindingRecent ? "Finding games…" : "Recent games"}
          </Button>
        </>
      )}
      <Button variant="outline" size="icon" onClick={onPrevious} disabled={selectedDate <= ARCHIVE_START_DATE} className="h-9 w-9" aria-label="Previous day">
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <Button variant={isSameDay(selectedDate, new Date()) ? "secondary" : "outline"} size="sm" onClick={onToday} className="h-9 text-xs">
        Today
      </Button>
      <div className="relative" ref={calendarRef}>
        <button
          type="button"
          onClick={() => setCalendarOpen((open) => !open)}
          className="flex h-9 items-center gap-2 rounded-lg bg-secondary px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
        >
          <CalendarDays className="w-4 h-4 text-primary" />
          {format(selectedDate, "EEE, MMM d, yyyy")}
        </button>
        {calendarOpen && (
          <div className={`absolute top-full ${align === "right" ? "right-0" : "left-0"} mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-2`}>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={chooseDate}
              defaultMonth={selectedDate}
              captionLayout="dropdown-buttons"
              fromYear={1996}
              toYear={new Date().getFullYear() + 2}
              disabled={{ before: ARCHIVE_START_DATE }}
              initialFocus
            />
          </div>
        )}
      </div>
      <Button variant="outline" size="icon" onClick={onNext} className="h-9 w-9" aria-label="Next day">
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
