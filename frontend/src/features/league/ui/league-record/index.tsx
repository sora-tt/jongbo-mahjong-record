import * as React from "react";

import { Card } from "@/components/ui/card";

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
    <h3 className="text-app-caption font-semibold text-app-text-secondary">
      {label}
    </h3>
    <p className="mt-2 text-app-caption text-app-brand-strong">{name ?? "—"}</p>
    <p className="mt-1 text-app-label font-bold text-app-danger">{value}</p>
  </Card>
);
