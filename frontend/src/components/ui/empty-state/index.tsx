import * as React from "react";

import clsx from "clsx";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  className,
}) => (
  <div
    className={clsx(
      "space-y-2 rounded-surface border border-dashed border-border bg-surface-muted p-8 text-center",
      className
    )}
  >
    <h2 className="font-semibold text-foreground">{title}</h2>
    {description ? (
      <p className="text-sm text-text-muted">{description}</p>
    ) : null}
    {action ? <div className="pt-2">{action}</div> : null}
  </div>
);
