import React from "react";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

export default function TeamSchedulePreview({ event }) {
  if (!event) return null;

  const competition = event.competitions?.[0];
  const homeTeam = competition?.competitors?.find((c) => c.homeAway === "home");
  const awayTeam = competition?.competitors?.find((c) => c.homeAway === "away");

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="text-sm text-muted-foreground">
          {event.date ? format(new Date(event.date), "EEEE, MMM d · h:mm a") : "TBD"}
        </span>
      </div>
      {homeTeam && awayTeam && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={awayTeam.team?.logos?.[0]?.href || awayTeam.team?.logo}
              alt={awayTeam.team?.displayName}
              className="w-8 h-8 object-contain"
            />
            <span className="font-medium text-sm">{awayTeam.team?.displayName}</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">@</span>
          <div className="flex items-center gap-3">
            <span className="font-medium text-sm">{homeTeam.team?.displayName}</span>
            <img
              src={homeTeam.team?.logos?.[0]?.href || homeTeam.team?.logo}
              alt={homeTeam.team?.displayName}
              className="w-8 h-8 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}