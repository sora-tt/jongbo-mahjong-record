import * as React from "react";

import { PersonalRecordCard } from "@/components/pages/personal-record/personal-record-card";

import { useTopTwoRateCard } from "./hooks";

import { LeagueSeasonMember } from "@/types/domain/league";

interface TopTwoRateCardProps {
  selectedLeagueSeasonMember: LeagueSeasonMember | null;
}

export const TopTwoRateCard: React.FC<TopTwoRateCardProps> = ({
  selectedLeagueSeasonMember,
}) => {
  const { top2Rate } = useTopTwoRateCard({ selectedLeagueSeasonMember });
  const title = "連対率";
  const unit = "%";
  const description = undefined;
  const value = typeof top2Rate === "number" ? top2Rate.toFixed(2) : top2Rate;

  return (
    <PersonalRecordCard
      title={title}
      value={value}
      unit={unit}
      description={description}
    />
  );
};
