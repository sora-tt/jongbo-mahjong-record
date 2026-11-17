import * as React from "react";

import clsx from "clsx";
import { Check } from "lucide-react";

export const Control = ({
  label,
  type = "checkbox",
  appearance = "native",
  controlSize = "sm",
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: React.ReactNode;
  type?: "checkbox" | "radio";
  appearance?: "native" | "compact";
  controlSize?: "sm" | "md" | "lg";
}) => (
  <label
    className={clsx(
      appearance === "native" &&
        type !== "radio" &&
        "inline-flex min-h-12 cursor-pointer items-center gap-2 has-disabled:cursor-not-allowed has-disabled:opacity-[0.48]",
      appearance === "native" &&
        type === "radio" &&
        "inline-flex min-h-12 cursor-pointer items-center gap-2 has-disabled:cursor-not-allowed has-disabled:text-[#b7a4a8]",
      className
    )}
  >
    {type === "radio" ? (
      <span
        className={clsx(
          "inline-flex shrink-0 items-center justify-center",
          appearance === "native" && "size-12"
        )}
      >
        <input {...props} type="radio" className="peer sr-only" />
        <span
          aria-hidden="true"
          className={clsx(
            "flex shrink-0 items-center justify-center rounded-full border-[1.6px] border-[#d7c6c9] bg-app-surface after:block after:rounded-full after:bg-app-action-primary after:opacity-0 after:content-[''] peer-checked:border-app-action-primary peer-checked:after:opacity-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-[#ffd4da] peer-disabled:border-[#e6dadd] peer-disabled:bg-[#f4eaec] peer-disabled:after:bg-[#b7a4a8]",
            {
              "size-5 after:size-[11px]": controlSize === "sm",
              "size-6 after:size-[13.2px]": controlSize === "md",
              "size-7 after:size-[15.4px]": controlSize === "lg",
            }
          )}
        />
      </span>
    ) : (
      <input
        {...props}
        type="checkbox"
        className={
          appearance === "compact"
            ? "peer sr-only"
            : "size-6 accent-app-action-primary"
        }
      />
    )}
    {appearance === "compact" && type === "checkbox" && (
      <span
        aria-hidden="true"
        className="flex size-5 shrink-0 items-center justify-center rounded-[5px] border border-app-border bg-app-surface text-transparent peer-checked:border-app-action-primary peer-checked:bg-app-action-primary peer-checked:text-app-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-app-focus peer-disabled:opacity-60"
      >
        <Check size={15} strokeWidth={3} />
      </span>
    )}
    <span className={appearance === "compact" ? "contents" : undefined}>
      {label}
    </span>
  </label>
);
