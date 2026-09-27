import * as React from "react";

import clsx from "clsx";

type CardProps = React.HTMLAttributes<HTMLElement> & {
  title?: React.ReactNode;
  meta?: React.ReactNode;
  bodyClassName?: string;
};

export const Card: React.FC<CardProps> = ({
  title,
  meta,
  bodyClassName,
  className,
  children,
  ...props
}) => (
  <section
    className={clsx(
      "overflow-hidden rounded-surface border border-border bg-white shadow-sm",
      className
    )}
    {...props}
  >
    {title || meta ? (
      <header className="flex items-start justify-between gap-4 border-b border-border bg-surface-muted px-4 py-3">
        {title ? (
          <h2 className="font-semibold text-foreground">{title}</h2>
        ) : (
          <span />
        )}
        {meta ? <div className="text-xs text-text-muted">{meta}</div> : null}
      </header>
    ) : null}
    <div className={clsx("p-4", bodyClassName)}>{children}</div>
  </section>
);
