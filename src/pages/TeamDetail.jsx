import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTeam } from "@/lib/espn";
import { ArrowLeft, MapPin, Users, Trophy } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorState from "@/components/shared/ErrorState";
import TeamStatsSection from "@/components/teams/TeamStatsSection";
import TeamRosterSection from "@/components/teams/TeamRosterSection";
import TeamSchedulePreview from "@/components/teams/TeamSchedulePreview";
import InjuryReport from "@/components/teams/InjuryReport";

export default function TeamDetail() {
  // param is the abbreviation (e.g. "bos")
  const { slug: abbrev } = useParams();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["team", abbrev],
    queryFn: () => fetchTeam(abbrev),
  });

  if (isLoading) return <LoadingSpinner text="Loading team..." />;
  if (error) return <ErrorState message="Failed to load team" onRetry={refetch} />;

  const team = data?.team;
  if (!team) return <ErrorState message="Team not found" />;

  const logo = team.logos?.[0]?.href;
  const record = team.record?.items?.[0]?.summary;
  const standingSummary = team.standingSummary;
  const venue = team.franchise?.venue;
  const nextEvent = team.nextEvent?.[0];
  const stats = team.record?.items || [];

  return (
    <div>
      <Link
        to="/standings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Standings
      </Link>

      {/* Hero */}
      <div
        className="rounded-2xl p-6 sm:p-8 mb-8 border border-border relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #${team.color}20 0%, transparent 60%)`,
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {logo && (
            <img src={logo} alt={team.displayName} className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
          )}
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-black text-foreground">
              {team.displayName}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              {record && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{record}</span>
                </div>
              )}
              {standingSummary && (
                <span className="text-sm text-muted-foreground">{standingSummary}</span>
              )}
              {venue && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {venue.fullName}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <TeamStatsSection stats={stats} teamColor={team.color} />

      {/* Next Game */}
      {nextEvent && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Next Game
          </h2>
          <TeamSchedulePreview event={nextEvent} />
        </div>
      )}

      {/* Injury Report */}
      {team.athletes && <InjuryReport athletes={team.athletes} />}

      {/* Roster */}
      {team.athletes && (
        <TeamRosterSection athletes={team.athletes} teamColor={team.color} />
      )}
    </div>
  );
}