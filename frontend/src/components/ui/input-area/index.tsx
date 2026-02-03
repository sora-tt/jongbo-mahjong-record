import * as React from "react";

import clsx from "clsx";

import { Spacer } from "@/components/common/ui/spacer";

type InputAreaProps = {
  label: string;
  icon?: React.ReactNode;
  name?: string;
  type?: string;
  value?: string;
  placeholder?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;

  /** class extensions */
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
};

export const InputArea = ({
  label,
  icon,
  name,
  type = "text",
  value,
  placeholder,
  onChange,

  containerClassName,
  labelClassName,
  inputClassName,
}: InputAreaProps) => {
  return (
    <Spacer className={clsx("space-y-1", containerClassName)}>
      <label
        className={clsx("flex items-center gap-2 text-sm", labelClassName)}
      >
        {icon}
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className={clsx(
          "w-full border border-gray-300 rounded px-2 py-1",
          inputClassName
        )}
      />
    </Spacer>
  );
};
