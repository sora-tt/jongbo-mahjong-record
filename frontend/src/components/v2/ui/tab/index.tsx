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
      "cursor-pointer rounded-v2-control border px-4 text-v2-label font-semibold",
      size === "sm" ? "h-10" : "h-11",
      selected
        ? "border-v2-border bg-v2-brand-soft text-v2-brand-strong"
        : "border-transparent bg-v2-surface-subtle text-v2-text-secondary",
      className
    )}
  />
);
