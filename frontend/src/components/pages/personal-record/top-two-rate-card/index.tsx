import * as React from "react";

import { PersonalRecordCard } from "@/components/pages/personal-record/personal-record-card";

import type { PersonalRecordStats } from "@/types/domain/personal-record";

interface TopTwoRateCardProps {
  selectedStats: PersonalRecordStats | null;
}

export const TopTwoRateCard: React.FC<TopTwoRateCardProps> = ({
  selectedStats,
}) => {
  const title = "連対率";
  const unit = "%";
  const description = undefined;
  const value =
    typeof selectedStats?.top2Rate === "number"
      ? selectedStats.top2Rate.toFixed(2)
      : selectedStats?.top2Rate;

  return (
    <PersonalRecordCard
      title={title}
      value={value}
      unit={unit}
      description={description}
    />
  );
};
