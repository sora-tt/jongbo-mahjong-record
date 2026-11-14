import * as React from "react";

import clsx from "clsx";

import { Panel } from "@/components/v2/ui/panel";

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
          <h2 className="text-v2-label font-bold text-v2-text">{title}</h2>
        )}
        {meta && (
          <span className="text-v2-caption text-v2-text-secondary">{meta}</span>
        )}
      </header>
    )}
    <div className={clsx(bodyClassName)}>{children}</div>
  </Panel>
);
