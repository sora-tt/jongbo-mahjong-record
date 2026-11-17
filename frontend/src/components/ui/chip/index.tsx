import * as React from "react";

import clsx from "clsx";

const sizeStyles = { sm: "h-7", md: "h-9", lg: "h-11" };
const variantStyles = {
  neutral:
    "border-app-border-subtle bg-app-surface-subtle text-app-text-secondary",
  selected: "border-app-border bg-app-brand-soft text-app-brand-strong",
  status: "border-transparent bg-app-success text-app-on-primary",
};
export const Chip = ({
  variant = "neutral",
  size = "md",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "neutral" | "selected" | "status";
  size?: "sm" | "md" | "lg";
}) => (
  <span
    {...props}
    className={clsx(
      "inline-flex items-center justify-center rounded-full border px-3 text-app-caption font-semibold",
      variantStyles[variant],
      sizeStyles[size],
      className
    )}
  />
);
