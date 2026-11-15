import * as React from "react";

import clsx from "clsx";

export const Dialog = ({
  className,
  ...props
}: React.ComponentPropsWithRef<"dialog">) => (
  <dialog
    {...props}
    className={clsx(
      "fixed inset-0 m-auto max-h-[calc(100dvh-32px)] max-w-[min(342px,calc(100vw-32px))] overflow-y-auto rounded-v2-panel border-0 bg-v2-surface p-6 text-v2-text shadow-v2-feature backdrop:bg-[rgba(36,24,24,0.4)]",
      className
    )}
  />
);
