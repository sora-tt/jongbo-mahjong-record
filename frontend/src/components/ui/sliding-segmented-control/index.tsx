import * as React from "react";

import clsx from "clsx";

export const SlidingSegmentedControl = ({
  label,
  role,
  selectedIndex,
  count,
  children,
  className,
}: React.PropsWithChildren<{
  label: string;
  role: "group" | "tablist";
  selectedIndex: number;
  count: number;
  className?: string;
}>) => {
  const safeCount = Math.max(1, count);
  const index = Math.max(0, Math.min(selectedIndex, safeCount - 1));
  return (
    <div
      role={role}
      aria-label={label}
      aria-orientation={role === "tablist" ? "horizontal" : undefined}
      className={clsx(
        "relative grid gap-1 rounded-app-control bg-[var(--app-neutral-200)] p-1",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${safeCount}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-1 left-1 rounded-app-control bg-app-surface shadow-app-card transition-transform duration-200 motion-reduce:transition-none"
        style={{
          width: `calc(${100 / safeCount}% - ${((safeCount + 1) * 0.25) / safeCount}rem)`,
          transform: `translateX(calc(${index * 100}% + ${index * 0.25}rem))`,
        }}
      />
      {children}
    </div>
  );
};

export const SlidingSegmentedControlButton = ({
  selected,
  size = "md",
  role = "button",
  className,
  ...props
}: React.ComponentPropsWithRef<"button"> & {
  selected: boolean;
  size?: "sm" | "md";
  role?: "button" | "tab";
}) => (
  <button
    {...props}
    type={props.type ?? "button"}
    role={role}
    aria-selected={role === "tab" ? selected : undefined}
    aria-pressed={role === "button" ? selected : undefined}
    className={clsx(
      "relative cursor-pointer rounded-app-control px-1 text-app-caption font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-focus",
      size === "sm" ? "h-9 min-w-16" : "h-11",
      selected ? "text-app-brand-strong" : "text-app-text-secondary",
      className
    )}
  />
);
