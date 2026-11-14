import * as React from "react";

import clsx from "clsx";
import { LoaderCircle } from "lucide-react";

export const LoadingIcon = ({
  size = 20,
  className,
}: {
  size?: 16 | 20 | 24;
  className?: string;
}) => (
  <LoaderCircle
    size={size}
    strokeWidth={2}
    aria-hidden="true"
    className={clsx("shrink-0 motion-safe:animate-spin", className)}
  />
);
