import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchGameSummary, fetchPlayerStats, fetchRecentGamesForTeams } from "@/lib/espn";
import { ArrowLeft } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorState from "@/components/shared/ErrorState";
import GameHeader from "@/components/game/GameHeader";
import GameBoxScore from "@/components/game/GameBoxScore";
import GameRosters from "@/components/game/GameRosters";
import GameInjuryReport from "@/components/game/GameInjuryReport";
import GameRecentGames from "@/components/game/GameRecentGames";
import GamePlayerAverages from "@/components/game/GamePlayerAverages";

function getGameTeams(header) {
  const competitors = header?.competitions?.[0]?.competitors || [];
  return competitors.map((competitor) => competitor.team).filter(Boolean);
}

export default function GameDetail() {
  const { gameId } = useParams();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => fetchGameSummary(gameId),
  });

  const header = data?.header;
  const boxscore = data?.boxscore;
  const rosters = data?.rosters || [];
  const teams = getGameTeams(header);
  const teamIds = teams.map((team) => team.id).filter(Boolean);
  const gameDate = header?.competitions?.[0]?.date;
  const seasonType = header?.season?.type || 2;

  const { data: recentGamesByTeam = {}, isLoading: recentGamesLoading } = useQuery({
    queryKey: ["gameRecentGames", gameId, teamIds.join(","), gameDate],
    queryFn: () => fetchRecentGamesForTeams({ teamIds, beforeDate: gameDate, limit: 5 }),
    enabled: teamIds.length > 0 && Boolean(gameDate),
  });

  const { data: playerStatsData, isLoading: playerStatsLoading } = useQuery({
    queryKey: ["gamePlayerAverages", seasonType],
    queryFn: () => fetchPlayerStats({ season: 2026, seasonType, limit: 500, page: 1 }),
    enabled: teams.length > 0 && rosters.length > 0,
  });

  if (isLoading) return <LoadingSpinner text="Loading game..." />;
  if (error) return <ErrorState message="Failed to load game" onRetry={refetch} />;

  const gameState = header?.competitions?.[0]?.status?.type?.state;
  const isPreGame = gameState === "pre";
  const hasBoxScore = boxscore?.players?.length > 0;

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Scores
      </Link>

      {header && <GameHeader header={header} />}
      {rosters.length > 0 && <GameInjuryReport rosters={rosters} />}
      {teams.length > 0 && (
        <GameRecentGames teams={teams} recentGamesByTeam={recentGamesByTeam} isLoading={recentGamesLoading} />
      )}
      {rosters.length > 0 && (
        <GamePlayerAverages
          teams={teams}
          rosters={rosters}
          playerStats={playerStatsData?.athletes || []}
          isLoading={playerStatsLoading}
        />
      )}
      {hasBoxScore && <GameBoxScore boxscore={boxscore} />}
      {(isPreGame || !hasBoxScore) && rosters.length > 0 && <GameRosters rosters={rosters} />}
    </div>
  );
}
