import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchGameSummary } from "@/lib/espn";
import { ArrowLeft } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorState from "@/components/shared/ErrorState";
import GameHeader from "@/components/game/GameHeader";
import GameBoxScore from "@/components/game/GameBoxScore";
import GameRosters from "@/components/game/GameRosters";
import GameInjuryReport from "@/components/game/GameInjuryReport";

export default function GameDetail() {
  const { gameId } = useParams();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => fetchGameSummary(gameId),
  });

  if (isLoading) return <LoadingSpinner text="Loading game..." />;
  if (error) return <ErrorState message="Failed to load game" onRetry={refetch} />;

  const header = data?.header;
  const boxscore = data?.boxscore;
  const rosters = data?.rosters;
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
      {hasBoxScore && <GameBoxScore boxscore={boxscore} />}
      {(isPreGame || !hasBoxScore) && rosters && <GameRosters rosters={rosters} />}
      {(isPreGame || !hasBoxScore) && rosters && <GameInjuryReport rosters={rosters} />}
    </div>
  );
}