import * as React from "react";

import clsx from "clsx";

import { Panel } from "@/components/ui/panel";

export const StatisticsCard = ({
  title,
  meta,
  bodyClassName,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  title?: React.ReactNode;
  meta?: React.ReactNode;
  bodyClassName?: string;
}) => (
  <Panel {...props} className={className}>
    {(title || meta) && (
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        {title && (
          <h2 className="text-app-label font-bold text-app-text">{title}</h2>
        )}
        {meta && (
          <span className="text-app-caption text-app-text-secondary">
            {meta}
          </span>
        )}
      </header>
    )}
    <div className={clsx(bodyClassName)}>{children}</div>
  </Panel>
);
