import * as React from "react";

import { Option } from "./types";

export interface Props {
  defaultOption: string;
  options: Option[];
  label: string; // プルダウンのラベル
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>, value: string) => void;
}

const Dropdown: React.FC<Props> = ({
  defaultOption,
  options,
  label,
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e, e.target.value);
  };

  return (
    <div style={{ marginBottom: "10px" }}>
      <label>
        {label}
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
      </label>
    </div>
  );
};

export default Dropdown;
