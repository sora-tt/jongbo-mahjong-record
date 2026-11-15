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
      "rounded-v2-panel bg-v2-surface p-4 text-center text-v2-text-secondary",
      className
    )}
  >
    <p className="text-v2-label font-semibold">{title}</p>
    {description && <p className="mt-2 text-v2-caption">{description}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);
