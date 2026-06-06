import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className = "",
  classNames = {},
  showOutsideDays = true,
  ...props
}) {
  return (
    (<DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("rounded-2xl p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        caption: "relative flex items-center justify-center px-10 pt-1",
        caption_label: cn(
          buttonVariants({ variant: "outline" }),
          "h-9 min-w-[5.5rem] justify-between rounded-xl border-border/70 bg-secondary/70 px-3 text-sm font-bold text-foreground shadow-sm transition-colors hover:bg-secondary"
        ),
        caption_dropdowns: "flex items-center justify-center gap-2",
        dropdown_month: "relative inline-flex h-9 items-center",
        dropdown_year: "relative inline-flex h-9 items-center",
        dropdown:
          "absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none opacity-0",
        dropdown_icon: "ml-2 h-4 w-4 shrink-0 text-primary opacity-80",
        vhidden: "sr-only",
        nav: "absolute inset-x-0 top-1 flex items-center justify-between px-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 rounded-full border-border/70 bg-secondary/60 p-0 text-muted-foreground shadow-sm opacity-80 transition-all hover:bg-secondary hover:text-foreground hover:opacity-100"
        ),
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "w-9 rounded-md pb-1 text-center text-[0.78rem] font-semibold text-muted-foreground",
        row: "mt-1.5 flex w-full",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent/70 [&:has([aria-selected].day-outside)]:bg-accent/40 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-full"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 rounded-full p-0 text-sm font-semibold transition-all aria-selected:opacity-100"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-secondary text-foreground ring-1 ring-primary/40",
        day_outside:
          "day-outside text-muted-foreground/60 aria-selected:bg-accent/40 aria-selected:text-muted-foreground",
        day_disabled: "cursor-not-allowed text-muted-foreground/40 opacity-40",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props} />)
  );
}
Calendar.displayName = "Calendar"

export { Calendar }
