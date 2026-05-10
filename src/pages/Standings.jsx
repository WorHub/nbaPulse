import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStandings } from "@/lib/espn";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorState from "@/components/shared/ErrorState";
import StandingsTable from "@/components/standings/StandingsTable";

export default function Standings() {
  const [conference, setConference] = useState("east");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["standings"],
    queryFn: fetchStandings,
  });

  // New API: data.children[0] = East, data.children[1] = West
  const children = data?.children || [];
  const eastConf = children.find((c) => c.name?.toLowerCase().includes("east"));
  const westConf = children.find((c) => c.name?.toLowerCase().includes("west"));
  const activeConf = conference === "east" ? eastConf : westConf;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Standings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            2025-26 NBA Season · Win%, Record, PPG, OPP PPG, DIFF
          </p>
        </div>
        <Tabs value={conference} onValueChange={setConference}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="east">Eastern</TabsTrigger>
            <TabsTrigger value="west">Western</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading && <LoadingSpinner text="Loading standings..." />}
      {error && <ErrorState message="Failed to load standings" onRetry={refetch} />}

      {!isLoading && !error && activeConf && (
        <StandingsTable conference={activeConf} />
      )}
    </div>
  );
}