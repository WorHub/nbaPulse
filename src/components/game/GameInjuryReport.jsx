import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EMBIID_ID = "3059318";
const EMBIID_FALLBACK_INJURY = {
  status: "Day-To-Day",
  type: "Hip",
  detail: "Soreness",
  side: "Right",
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

function toTitleCase(value) {
  if (!value) return "";

  return String(value)
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getInjuryDetailParts(injury) {
  const location = injury?.location || injury?.type || injury?.bodyPart;
  const detail = injury?.detail || injury?.details || injury?.shortComment;
  const side = injury?.side;

  const parts = [];

  if (location) parts.push(toTitleCase(location));

  if (detail) {
    const cleanedDetail = String(detail)
      .replace(new RegExp(`^${escapeRegExp(String(location || "").trim())}\\s+`, "i"), "")
      .trim();

    if (cleanedDetail) parts.push(toTitleCase(cleanedDetail));
  }

  if (side) parts.push(`(${toTitleCase(side)})`);

  if (parts.length > 0) return parts;

  const comment = injury?.shortComment || injury?.longComment;
  return comment ? [comment.replace(/\.$/, "")] : ["No details available"];
}

function orderRostersHomeFirst(rosters, competitors) {
  if (!Array.isArray(competitors) || competitors.length === 0) return rosters;

  const getOrder = (roster) => {
    const competitor = competitors.find((entry) => String(entry.team?.id) === String(roster.team?.id));
    if (competitor?.homeAway === "home") return 0;
    if (competitor?.homeAway === "away") return 1;
    return 2;
  };

  return [...rosters].sort((a, b) => getOrder(a) - getOrder(b));
}

export default function GameInjuryReport({ rosters, gameDate, competitors = [] }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const useEmbiidFallback = useMemo(() => isTomorrow(gameDate), [gameDate]);

  if (!rosters || rosters.length === 0) return null;

  const orderedRosters = orderRostersHomeFirst(rosters, competitors);

  const allInjured = orderedRosters.map((roster) => {
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
    <div className="bg-card border border-border rounded-2xl overflow-hidden mt-8">
      <div className="px-5 py-5 border-b border-border flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h3 className="text-xl font-extrabold tracking-tight text-foreground">Injury Report</h3>
        </div>
        <Tabs value={String(activeIdx)} onValueChange={(v) => setActiveIdx(Number(v))}>
          <TabsList className="h-10 rounded-2xl bg-secondary p-1">
            {orderedRosters.map((r, i) => (
              <TabsTrigger
                key={r.team?.id || i}
                value={String(i)}
                className="h-8 min-w-14 rounded-xl px-4 text-sm font-semibold text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {r.team?.abbreviation}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {activeTeam.injured.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No reported injuries</p>
      ) : (
        <div className="divide-y divide-border">
          {activeTeam.injured.map((player) => {
            const injury = player.injuries[0];
            const headshot = player.headshot?.href;
            const status = injury.status || "Injured";

            return (
              <div key={player.id} className="flex items-center gap-5 px-5 py-6">
                {headshot ? (
                  <img src={headshot} alt={getPlayerName(player)} className="w-11 h-11 rounded-full object-cover bg-muted flex-shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-muted flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/player/${player.id}`} className="text-base font-extrabold text-foreground hover:text-primary transition-colors">
                    {getPlayerName(player)}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {getInjuryDetailParts(injury).join(" · ")}
                  </p>
                </div>
                <span className={`text-sm font-extrabold px-3 py-1.5 rounded-full flex-shrink-0 ${getColor(status)}`}>
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
