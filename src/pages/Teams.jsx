import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTeams } from "@/lib/espn";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import TeamCard from "@/components/teams/TeamCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorState from "@/components/shared/ErrorState";

export default function Teams() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });

  const teams = data?.sports?.[0]?.leagues?.[0]?.teams?.map((t) => t.team) || [];

  const filtered = teams.filter((t) =>
    t.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teams</h1>
          <p className="text-sm text-muted-foreground mt-1">All 30 NBA teams</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
      </div>

      {isLoading && <LoadingSpinner text="Loading teams..." />}
      {error && <ErrorState message="Failed to load teams" onRetry={refetch} />}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}