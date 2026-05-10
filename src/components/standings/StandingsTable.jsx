import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronUp, ChevronDown } from "lucide-react";

const COLS = [
  { label: "W",       key: "wins",            cls: "font-bold text-foreground" },
  { label: "L",       key: "losses",          cls: "text-muted-foreground" },
  { label: "PCT",     key: "winPercent",       cls: "text-primary font-semibold" },
  { label: "GB",      key: "gamesBehind",      cls: "text-muted-foreground", hide: "" },
  { label: "STRK",    key: "streak",           cls: "", hide: "hidden sm:table-cell" },
  { label: "L10",     key: "lasttengames",     cls: "text-muted-foreground", hide: "hidden sm:table-cell" },
  { label: "HOME",    key: "home",             cls: "text-muted-foreground", hide: "hidden md:table-cell" },
  { label: "AWAY",    key: "road",             cls: "text-muted-foreground", hide: "hidden md:table-cell" },
  { label: "PPG",     key: "avgPointsFor",     cls: "text-muted-foreground", hide: "hidden lg:table-cell" },
  { label: "OPP PPG", key: "avgPointsAgainst", cls: "text-muted-foreground", hide: "hidden lg:table-cell" },
  { label: "DIFF",    key: "differential",     cls: "", hide: "hidden lg:table-cell" },
];

// Keys that are numeric for sorting
const NUMERIC_KEYS = new Set(["wins","losses","winPercent","gamesBehind","avgPointsFor","avgPointsAgainst","differential"]);

function SortIcon({ colKey, sortKey, dir }) {
  if (sortKey !== colKey) return <ChevronUp className="w-3 h-3 opacity-20 inline ml-0.5" />;
  return dir === "desc"
    ? <ChevronDown className="w-3 h-3 text-primary inline ml-0.5" />
    : <ChevronUp className="w-3 h-3 text-primary inline ml-0.5" />;
}

export default function StandingsTable({ conference }) {
  const [sortKey, setSortKey] = useState("winPercent");
  const [sortDir, setSortDir] = useState("desc");

  const entries = conference?.standings?.entries || [];

  const getStat = (entry, key) => {
    const s = entry.stats?.find(s => s.type === key || s.name === key);
    if (!s) return null;
    return { numeric: s.value ?? 0, display: s.displayValue || s.summary || String(s.value) };
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = [...entries].sort((a, b) => {
    const aS = getStat(a, sortKey);
    const bS = getStat(b, sortKey);
    const aV = aS?.numeric ?? 0;
    const bV = bS?.numeric ?? 0;
    return sortDir === "desc" ? bV - aV : aV - bV;
  });

  const getDiffColor = (entry) => {
    const val = entry.stats?.find(s => s.name === "differential")?.value;
    if (val == null) return "text-muted-foreground";
    if (val > 0) return "text-green-400";
    if (val < 0) return "text-red-400";
    return "text-muted-foreground";
  };

  const getStreakColor = (entry) => {
    const val = entry.stats?.find(s => s.name === "streak")?.displayValue || "";
    return val.startsWith("W") ? "text-green-400" : val.startsWith("L") ? "text-red-400" : "text-muted-foreground";
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-8">#</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team</th>
              {COLS.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-secondary/70 transition-colors select-none ${col.hide || ""}`}
                >
                  <span className={sortKey === col.key ? "text-primary" : "text-muted-foreground"}>{col.label}</span>
                  <SortIcon colKey={col.key} sortKey={sortKey} dir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, index) => {
              const team = entry.team;
              const logo = team?.logos?.[0]?.href;
              const abbrev = team?.abbreviation?.toLowerCase();
              const clincher = entry.stats?.find(s => s.name === "clincher")?.displayValue;
              const seed = index + 1;
              const isPlayIn = seed === 7;

              return (
                <React.Fragment key={team?.id || index}>
                  {isPlayIn && sortKey === "winPercent" && sortDir === "desc" && (
                    <tr>
                      <td colSpan={COLS.length + 2}>
                        <div className="px-4 py-1 text-xs text-yellow-500/80 bg-yellow-500/5 border-y border-yellow-500/20">
                          Play-In Tournament (Seeds 7–10)
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{seed}</td>
                    <td className="py-3 px-4">
                      <Link to={`/teams/${abbrev}`} className="flex items-center gap-3 hover:text-primary transition-colors group">
                        {logo && <img src={logo} alt={team?.displayName} className="w-6 h-6 object-contain" />}
                        <span className="font-medium text-sm hidden sm:inline group-hover:text-primary">{team?.displayName}</span>
                        <span className="font-medium text-sm sm:hidden group-hover:text-primary">{team?.abbreviation}</span>
                        {clincher && <span className="text-xs text-primary/70 font-mono">{clincher}</span>}
                      </Link>
                    </td>
                    {COLS.map(col => {
                      const stat = getStat(entry, col.key);
                      const val = stat?.display ?? "-";
                      let displayCls = col.cls;
                      if (col.key === "differential") displayCls = getDiffColor(entry);
                      if (col.key === "streak") displayCls = getStreakColor(entry);
                      return (
                        <td key={col.key} className={`py-3 px-3 text-center font-mono text-xs ${col.hide || ""}`}>
                          <span className={displayCls}>{val}</span>
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-border bg-secondary/20 text-xs text-muted-foreground flex flex-wrap gap-4">
        <span><span className="text-primary font-mono">z</span> — clinched 1st seed</span>
        <span><span className="text-primary font-mono">y</span> — clinched division</span>
        <span><span className="text-primary font-mono">x</span> — clinched playoff spot</span>
        <span className="text-yellow-500/80">Seeds 7–10: Play-In · Click headers to sort</span>
      </div>
    </div>
  );
}