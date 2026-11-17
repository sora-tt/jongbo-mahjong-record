import * as React from "react";

import clsx from "clsx";

export const EmptyState = ({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={clsx(
      "rounded-app-panel bg-app-surface p-4 text-center text-app-text-secondary",
      className
    )}
  >
    <p className="text-app-label font-semibold">{title}</p>
    {description && <p className="mt-2 text-app-caption">{description}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);
