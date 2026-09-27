import * as React from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
}) => (
  <div className="space-y-2 rounded-surface border border-dashed border-border bg-surface-muted p-8 text-center">
    <h2 className="font-semibold text-foreground">{title}</h2>
    {description ? (
      <p className="text-sm text-text-muted">{description}</p>
    ) : null}
    {action ? <div className="pt-2">{action}</div> : null}
  </div>
);
