import * as React from "react";

import { StandingsTable } from "@/features/statistics/ui/standings-table";

import { SectionCard } from "@/components/ui/section-card";

import type { useSeasonPage } from "@/features/season/hooks/use-season-page";

type State = ReturnType<typeof useSeasonPage>;
export const SeasonStandings = ({
  season,
  leagueId,
  seasonId,
  leagueName,
}: Pick<State, "leagueId" | "seasonId" | "leagueName"> & {
  season: NonNullable<State["season"]>;
}) => (
  <SectionCard
    title="順位表"
    rightText={`総対局数：${season.totalMatchCount}`}
    bodyClassName="overflow-x-auto"
  >
    <StandingsTable
      rows={season.standings}
      leagueId={leagueId}
      seasonId={seasonId}
      leagueName={leagueName}
      seasonName={season.name}
    />
  </SectionCard>
);
