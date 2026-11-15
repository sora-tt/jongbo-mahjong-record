import * as React from "react";

import clsx from "clsx";

import { LoadingIcon } from "@/components/v2/ui/loading-icon";

export const LoadingState = ({
  label,
  className,
  inline = false,
}: {
  label: string;
  className?: string;
  inline?: boolean;
}) => (
  <div
    role="status"
    className={clsx(
      "flex items-center text-v2-label text-v2-text-secondary",
      inline
        ? "flex-row justify-start gap-2 text-left"
        : "flex-col justify-center gap-3 p-4 text-center",
      className
    )}
  >
    <LoadingIcon size={inline ? 20 : 24} className="text-v2-brand-strong" />
    <span className="sr-only">{label}</span>
  </div>
);
