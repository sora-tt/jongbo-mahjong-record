import * as React from "react";

import clsx from "clsx";

const sizeStyles = { sm: "h-7", md: "h-9", lg: "h-11" };
const variantStyles = {
  neutral:
    "border-v2-border-subtle bg-v2-surface-subtle text-v2-text-secondary",
  selected: "border-v2-border bg-v2-brand-soft text-v2-brand-strong",
  status: "border-transparent bg-v2-success text-v2-on-primary",
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
      "inline-flex items-center justify-center rounded-full border px-3 text-v2-caption font-semibold",
      variantStyles[variant],
      sizeStyles[size],
      className
    )}
  />
);
