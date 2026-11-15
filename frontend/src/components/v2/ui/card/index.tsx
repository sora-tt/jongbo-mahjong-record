import * as React from "react";

import clsx from "clsx";

const sizeStyles = {
  auto: "p-4",
  none: "",
  sm: "min-h-[88px] p-4",
  md: "min-h-[120px] p-5",
  lg: "min-h-[152px] p-6",
};
export const Card = ({
  as: Component = "div",
  size = "md",
  soft,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: "div" | "article" | "section" | "details";
  size?: "auto" | "none" | "sm" | "md" | "lg";
  soft?: boolean;
}) => (
  <Component
    {...props}
    className={clsx(
      "rounded-v2-panel shadow-v2-card",
      soft ? "bg-v2-brand-soft" : "bg-v2-surface",
      sizeStyles[size],
      className
    )}
  />
);
