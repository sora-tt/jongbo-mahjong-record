import * as React from "react";

import clsx from "clsx";

const sizeStyles = { sm: "size-8", md: "size-10", lg: "size-12" };
export const IconContainer = ({
  size = "sm",
  tone = "brand",
  circle,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  size?: "sm" | "md" | "lg";
  tone?: "brand" | "plain";
  circle?: boolean;
}) => (
  <span
    {...props}
    className={clsx(
      "inline-flex shrink-0 items-center justify-center text-v2-brand-strong",
      circle ? "rounded-full" : "rounded-v2-control",
      tone === "plain" ? "bg-transparent" : "bg-v2-brand-soft",
      sizeStyles[size],
      className
    )}
  />
);
