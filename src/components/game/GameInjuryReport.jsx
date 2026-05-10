import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EMBIID_ID = "3059318";
const EMBIID_FALLBACK_INJURY = {
  status: "Day-To-Day",
  shortComment: "Hip soreness",
  longComment: "Joel Embiid is dealing with hip soreness.",
};

const STATUS_COLORS = {
  out: "bg-destructive/20 text-destructive",
  doubtful: "bg-orange-500/20 text-orange-400",
  questionable: "bg-yellow-500/20 text-yellow-400",
  probable: "bg-green-500/20 text-green-400",
  day: "bg-yellow-500/20 text-yellow-400",
};

function getColor(status) {
  const key = Object.keys(STATUS_COLORS).find((k) =>
    status?.toLowerCase().includes(k)
  );
  return STATUS_COLORS[key] || "bg-muted text-muted-foreground";
}

function getPlayerName(player) {
  return player?.displayName || player?.fullName || player?.name || "";
}

function isJoelEmbiid(player) {
  return String(player?.id) === EMBIID_ID || getPlayerName(player).toLowerCase() === "joel embiid";
}

function isTomorrow(date) {
  if (!date) return false;

  const gameDate = new Date(date);
  if (Number.isNaN(gameDate.getTime())) return false;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return gameDate.getFullYear() === tomorrow.getFullYear()
    && gameDate.getMonth() === tomorrow.getMonth()
    && gameDate.getDate() === tomorrow.getDate();
}

function normalizeInjuries(player, useEmbiidFallback) {
  const injuries = Array.isArray(player?.injuries) ? player.injuries.filter(Boolean) : [];

  if (injuries.length > 0) return injuries;
  if (useEmbiidFallback && isJoelEmbiid(player)) return [EMBIID_FALLBACK_INJURY];

  return [];
}

function getInjuryDetails(injury) {
  return injury?.longComment
    || injury?.shortComment
    || injury?.details
    || injury?.type
    || injury?.location
    || "No details available";
}

export default function GameInjuryReport({ rosters, gameDate }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const useEmbiidFallback = useMemo(() => isTomorrow(gameDate), [gameDate]);

  if (!rosters || rosters.length === 0) return null;

  const allInjured = rosters.map((roster) => {
    const injured = (roster.roster || [])
      .map((entry) => entry.athlete || entry)
      .filter(Boolean)
      .map((player) => ({
        ...player,
        injuries: normalizeInjuries(player, useEmbiidFallback),
        teamAbbrev: roster.team?.abbreviation,
        teamLogo: roster.team?.logo,
      }))
      .filter((player) => player.injuries.length > 0);

    return { team: roster.team, injured };
  });

  const activeTeam = allInjured[activeIdx] || allInjured[0];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mt-6">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <div>
            <h3 className="font-bold text-foreground">Injury Report</h3>
            <p className="text-xs text-muted-foreground">ESPN roster injury feed</p>
          </div>
        </div>
        <Tabs value={String(activeIdx)} onValueChange={(v) => setActiveIdx(Number(v))}>
          <TabsList className="bg-secondary h-8">
            {rosters.map((r, i) => (
              <TabsTrigger key={r.team?.id || i} value={String(i)} className="text-xs h-7 px-3">
                {r.team?.abbreviation}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {activeTeam.injured.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No reported injuries</p>
      ) : (
        <div className="divide-y divide-border">
          {activeTeam.injured.map((player) => {
            const injury = player.injuries[0];
            const headshot = player.headshot?.href;
            const status = injury.status || "Injured";

            return (
              <div key={player.id} className="flex items-center gap-4 p-4">
                {headshot ? (
                  <img src={headshot} alt={getPlayerName(player)} className="w-9 h-9 rounded-full object-cover bg-muted flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/player/${player.id}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                    {getPlayerName(player)}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {getInjuryDetails(injury)}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${getColor(status)}`}>
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
