import * as React from "react";

import clsx from "clsx";

import { Option } from "./types";

export interface Props {
  defaultOption: string;
  options: Option[];
  value?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>, value: string) => void;
}

export const Dropdown: React.FC<Props> = ({
  defaultOption,
  options,
  value,
  disabled = false,
  className,
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e, e.target.value);
  };

  return (
    <select
      value={value ?? ""}
      disabled={disabled}
      onChange={handleChange}
      aria-label={defaultOption}
      className={clsx(
        "rounded-control border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-brand-strong focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      <option value="">{defaultOption}</option>
      {options.map((option, index) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
