import * as React from "react";

import { LeagueSeasonMember } from "@/types/domain/league";

import { PersonalRecordCard } from "@/components/pages/personal-record/personal-record-card";

import { useTotalMatchCard } from "./hooks";

interface TotalMatchCardProps {
  selectedLeagueSeasonMember: LeagueSeasonMember | null;
}

export const TotalMatchCard: React.FC<TotalMatchCardProps> = ({
  selectedLeagueSeasonMember,
}) => {
  const { gamesPlayed } = useTotalMatchCard({ selectedLeagueSeasonMember });
  const title = "総対戦数";
  const unit = "戦";
  const description = undefined;
  const value =
    typeof gamesPlayed === "number" ? Math.floor(gamesPlayed) : gamesPlayed;

  return (
    <PersonalRecordCard
      title={title}
      value={value}
      unit={unit}
      description={description}
    />
  );
};
