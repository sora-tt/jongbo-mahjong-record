import * as React from "react";

import { StatisticsCard as Card } from "@/features/statistics/ui/v2/statistics-card";

type Props = {
  label: string;
  value: React.ReactNode;
  unit?: string;
  description?: React.ReactNode;
  valueClassName?: string;
};

export const StatisticsMetricCard: React.FC<Props> = ({
  label,
  value,
  unit,
  description,
  valueClassName = "text-v2-brand-strong",
}) => (
  <Card bodyClassName="min-h-28 text-center">
    <p className="text-sm font-medium text-v2-text-secondary">{label}</p>
    <p className={`mt-3 text-2xl font-bold ${valueClassName}`}>
      {value}
      {unit ? <span className="ml-1 text-sm font-medium">{unit}</span> : null}
    </p>
    {description ? (
      <p className="mt-2 text-xs text-v2-text-secondary">{description}</p>
    ) : null}
  </Card>
);
