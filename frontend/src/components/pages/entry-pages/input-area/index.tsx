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

export const InputArea: React.FC<InputAreaProps> = ({
  label,
  name,
  type,
  value,
  placeholder,
  onChange,
}) => {
  const inputId = React.useId();

  return (
    <Spacer>
      <label htmlFor={inputId} className="text-sm text-foreground">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full rounded-control border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-text-muted focus:border-brand-strong focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
    </Spacer>
  );
};
