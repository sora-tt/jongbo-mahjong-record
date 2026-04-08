import * as React from "react";

import { LeagueSeasonMember } from "@/types/domain/league";

import { PersonalRecordCard } from "@/components/pages/personal-record/personal-record-card";

import { useTotalPointCard } from "./hooks";

interface TotalPointCardProps {
  selectedLeagueSeasonMember: LeagueSeasonMember | null;
}

export const TotalPointCard: React.FC<TotalPointCardProps> = ({
  selectedLeagueSeasonMember,
}) => {
  const { totalPoints } = useTotalPointCard({ selectedLeagueSeasonMember });
  const title = "総合pt";
  const unit = "pt";
  const description = undefined;
  const value =
    typeof totalPoints === "number" ? totalPoints.toFixed(2) : totalPoints;

  return (
    <PersonalRecordCard
      title={title}
      value={value}
      unit={unit}
      description={description}
    />
  );
};
