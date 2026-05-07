import * as React from "react";

import { PersonalRecordCard } from "@/components/pages/personal-record/personal-record-card";

import type { PersonalRecordStats } from "@/types/domain/personal-record";

interface AverageRankCardProps {
  selectedStats: PersonalRecordStats | null;
}

export const AverageRankCard: React.FC<AverageRankCardProps> = ({
  selectedStats,
}) => {
  const title = "平均順位";
  const unit = "位";
  const description = undefined;
  const value =
    typeof selectedStats?.averageRank === "number"
      ? selectedStats.averageRank.toFixed(2)
      : selectedStats?.averageRank;

  return (
    <PersonalRecordCard
      title={title}
      value={value}
      unit={unit}
      description={description}
    />
  );
};
