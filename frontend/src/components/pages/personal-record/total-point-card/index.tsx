import * as React from "react";

import { PersonalRecordCard } from "@/components/pages/personal-record/personal-record-card";

import type { PersonalRecordStats } from "@/types/domain/personal-record";

interface TotalPointCardProps {
  selectedStats: PersonalRecordStats | null;
}

export const TotalPointCard: React.FC<TotalPointCardProps> = ({
  selectedStats,
}) => {
  const title = "総合pt";
  const unit = "pt";
  const description = undefined;
  const value =
    typeof selectedStats?.totalPoints === "number"
      ? selectedStats.totalPoints.toFixed(2)
      : selectedStats?.totalPoints;

  return (
    <PersonalRecordCard
      title={title}
      value={value}
      unit={unit}
      description={description}
    />
  );
};
