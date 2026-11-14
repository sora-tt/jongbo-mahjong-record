import * as React from "react";

import clsx from "clsx";

export const Table = ({
  className,
  plain = false,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & { plain?: boolean }) => (
  <table
    {...props}
    className={clsx(
      "w-full border-collapse",
      !plain &&
        "text-left [&_td]:border-b [&_td]:border-v2-border-subtle [&_td]:p-3 [&_th]:border-b [&_th]:border-v2-border-subtle [&_th]:p-3 [&_th]:text-v2-caption [&_th]:font-semibold [&_th]:text-v2-text-secondary",
      className
    )}
  />
);
