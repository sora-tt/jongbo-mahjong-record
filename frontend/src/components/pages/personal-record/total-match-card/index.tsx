import * as React from "react";

import { PersonalRecordCard } from "@/components/pages/personal-record/personal-record-card";

import type { PersonalRecordStats } from "@/types/domain/personal-record";

interface TotalMatchCardProps {
  selectedStats: PersonalRecordStats | null;
}

export const TotalMatchCard: React.FC<TotalMatchCardProps> = ({
  selectedStats,
}) => {
  const title = "総対戦数";
  const unit = "戦";
  const description = undefined;
  const value =
    typeof selectedStats?.totalMatchCount === "number"
      ? Math.floor(selectedStats.totalMatchCount)
      : selectedStats?.totalMatchCount;

  return (
    <PersonalRecordCard
      title={title}
      value={value}
      unit={unit}
      description={description}
    />
  );
};
