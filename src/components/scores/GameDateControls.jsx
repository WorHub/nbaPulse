import React, { useEffect, useRef, useState } from "react";
import { format, isSameDay } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

const ARCHIVE_START_DATE = new Date(1996, 0, 1);

export default function GameDateControls({ selectedDate, onSelect, onPrevious, onNext, onToday, align = "left" }) {
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
    <div className="flex items-center gap-2 flex-wrap">
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
