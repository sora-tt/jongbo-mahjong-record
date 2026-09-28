import * as React from "react";

import { Card } from "@/components/ui/card";

type Props = {
  label: string;
  value: React.ReactNode;
  unit?: string;
};

export const StatisticsMetricCard: React.FC<Props> = ({
  label,
  value,
  unit,
}) => (
  <Card bodyClassName="min-h-28">
    <p className="text-sm font-medium text-text-muted">{label}</p>
    <p className="mt-3 text-2xl font-bold text-brand-strong">
      {value}
      {unit ? <span className="ml-1 text-sm font-medium">{unit}</span> : null}
    </p>
  </Card>
);
