import * as React from "react";

import { Option } from "./types";

export interface Props {
  defaultOption: string;
  options: Option[];
  value?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>, value: string) => void;
}

export const Dropdown: React.FC<Props> = ({
  defaultOption,
  options,
  value,
  disabled = false,
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
      style={{ marginLeft: "10px", padding: "5px" }}
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
