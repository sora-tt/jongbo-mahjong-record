import * as React from "react";

import clsx from "clsx";

export const Switch = ({
  label,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "role"> & {
  label: React.ReactNode;
}) => (
  <label
    className={clsx(
      "relative inline-flex min-h-12 cursor-pointer items-center gap-2 has-disabled:cursor-not-allowed has-disabled:opacity-[0.48]",
      className
    )}
  >
    <input
      {...props}
      type="checkbox"
      role="switch"
      className="peer absolute h-6 w-10 opacity-0"
    />
    <span
      className="relative h-6 w-10 rounded-full bg-v2-neutral-300 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-v2-surface after:transition-transform after:duration-150 after:content-[''] peer-checked:bg-v2-action-primary peer-checked:after:translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-v2-focus"
      aria-hidden="true"
    />
    <span>{label}</span>
  </label>
);
