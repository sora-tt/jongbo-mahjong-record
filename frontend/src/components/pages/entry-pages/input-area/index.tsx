import * as React from "react";

import { Spacer } from "@/components/common/ui/spacer";

type InputAreaProps = {
  label: string;
  name?: string;
  type?: string;
  value?: string;
  placeholder?: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
};

export const InputArea = ({
  label,
  name,
  type,
  value,
  placeholder,
  onChange,
}: InputAreaProps) => {
  return (
    <Spacer>
      <label className="text-sm">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full border border-gray-300 rounded px-2 py-1"
      />
    </Spacer>
  );
};
