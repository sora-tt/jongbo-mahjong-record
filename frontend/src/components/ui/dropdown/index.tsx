import * as React from "react";

import { Option } from "./types";

export interface Props {
  defaultOption: string;
  options: Option[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>, value: string) => void;
}

export const Dropdown: React.FC<Props> = ({
  defaultOption,
  options,
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e, e.target.value);
  };

  return (
    <select
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
