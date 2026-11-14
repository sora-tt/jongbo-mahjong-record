import * as React from "react";

import { Card } from "@/components/v2/ui/card";

export const LeagueRecord = ({
  label,
  name,
  value,
}: {
  label: string;
  name?: string;
  value: string;
}) => (
  <Card as="article" size="auto">
    <h3 className="text-v2-caption font-semibold text-v2-text-secondary">
      {label}
    </h3>
    <p className="mt-2 text-v2-caption text-v2-brand-strong">{name ?? "—"}</p>
    <p className="mt-1 text-v2-label font-bold text-v2-danger">{value}</p>
  </Card>
);
