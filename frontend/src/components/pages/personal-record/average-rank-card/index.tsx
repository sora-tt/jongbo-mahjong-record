import * as React from "react";

import { LeagueSeasonMember } from "@/types/domain/league";

import { PersonalRecordCard } from "@/components/pages/personal-record/personal-record-card";

import { useAverageRankCard } from "./hooks";

interface AverageRankCardProps {
  selectedLeagueSeasonMember: LeagueSeasonMember | null;
}

export const AverageRankCard: React.FC<AverageRankCardProps> = ({
  selectedLeagueSeasonMember,
}) => {
  const { averageRank } = useAverageRankCard({ selectedLeagueSeasonMember });
  const title = "平均順位";
  const unit = "位";
  const description = undefined;
  const value =
    typeof averageRank === "number" ? averageRank.toFixed(2) : averageRank;

  return (
    <PersonalRecordCard
      title={title}
      value={value}
      unit={unit}
      description={description}
    />
  );
};
