import * as React from "react";

import clsx from "clsx";

export const Tab = ({
  selected,
  size = "md",
  className,
  ...props
}: React.ComponentPropsWithRef<"button"> & {
  selected: boolean;
  size?: "sm" | "md";
}) => (
  <button
    {...props}
    type={props.type ?? "button"}
    role="tab"
    aria-selected={selected}
    className={clsx(
      "cursor-pointer rounded-app-control border px-4 text-app-label font-semibold",
      size === "sm" ? "h-10" : "h-11",
      selected
        ? "border-app-border bg-app-brand-soft text-app-brand-strong"
        : "border-transparent bg-app-surface-subtle text-app-text-secondary",
      className
    )}
  />
);
