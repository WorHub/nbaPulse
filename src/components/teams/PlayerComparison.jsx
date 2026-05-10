import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPlayerSeasonStats } from "@/lib/espn";
import { GitCompare } from "lucide-react";

const STATS = [
  { key: "avgPoints", label: "PTS" },
  { key: "avgRebounds", label: "REB" },
  { key: "avgAssists", label: "AST" },
  { key: "avgSteals", label: "STL" },
  { key: "avgBlocks", label: "BLK" },
  { key: "avgTurnovers", label: "TO" },
  { key: "fieldGoalPct", label: "FG%" },
  { key: "threePointFieldGoalPct", label: "3P%" },
  { key: "freeThrowPct", label: "FT%" },
];

function usePlayerStats(athleteId) {
  return useQuery({
    queryKey: ["playerSeasonStats", athleteId],
    queryFn: () => fetchPlayerSeasonStats(athleteId),
    enabled: !!athleteId,
  });
}

function getStatMap(statsData) {
  const splits = statsData?.splits?.categories || [];
  const off = splits.find((c) => c.name === "offensive") || {};
  const map = {};
  (off.stats || []).forEach((s) => { map[s.name] = parseFloat(s.displayValue ?? s.value) || 0; });
  return map;
}

function Bar({ valA, valB, isA }) {
  const max = Math.max(valA, valB, 0.01);
  const pct = ((isA ? valA : valB) / max) * 100;
  return (
    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${isA ? "bg-primary" : "bg-chart-2"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function PlayerComparison({ athletes }) {
  const [playerA, setPlayerA] = useState(null);
  const [playerB, setPlayerB] = useState(null);
  const [open, setOpen] = useState(false);

  const { data: dataA } = usePlayerStats(playerA?.id);
  const { data: dataB } = usePlayerStats(playerB?.id);

  const statsA = getStatMap(dataA);
  const statsB = getStatMap(dataB);

  if (!athletes || athletes.length < 2) return null;

  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-lg font-bold text-foreground mb-4 hover:text-primary transition-colors"
      >
        <GitCompare className="w-5 h-5 text-primary" />
        Player Comparison
        <span className="text-xs text-muted-foreground font-normal ml-1">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="bg-card border border-border rounded-xl p-4">
          {/* Player selectors */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[{ label: "Player A", val: playerA, set: setPlayerA, color: "text-primary" },
              { label: "Player B", val: playerB, set: setPlayerB, color: "text-chart-2" }].map(({ label, val, set, color }) => (
              <div key={label}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${color}`}>{label}</p>
                <select
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={val?.id || ""}
                  onChange={(e) => {
                    const found = athletes.find((a) => a.id === e.target.value);
                    set(found || null);
                  }}
                >
                  <option value="">Select player...</option>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>{a.fullName || a.displayName}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Comparison rows */}
          {playerA && playerB ? (
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-[1fr_2rem_3rem_2rem_1fr] items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                <span className="text-primary truncate">{playerA.shortName || playerA.fullName || playerA.displayName}</span>
                <span />
                <span className="text-center uppercase tracking-wider">Stat</span>
                <span />
                <span className="text-chart-2 truncate text-right">{playerB.shortName || playerB.fullName || playerB.displayName}</span>
              </div>
              {STATS.map(({ key, label }) => {
                const a = statsA[key] || 0;
                const b = statsB[key] || 0;
                return (
                  <div key={key} className="grid grid-cols-[1fr_auto_3rem_auto_1fr] items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Bar valA={a} valB={b} isA={true} />
                      <span className={`text-xs font-mono font-bold w-10 text-right ${a >= b ? "text-primary" : "text-muted-foreground"}`}>{a.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-center">{label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-mono font-bold w-10 ${b >= a ? "text-chart-2" : "text-muted-foreground"}`}>{b.toFixed(1)}</span>
                      <Bar valA={a} valB={b} isA={false} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Select two players to compare</p>
          )}
        </div>
      )}
    </div>
  );
}