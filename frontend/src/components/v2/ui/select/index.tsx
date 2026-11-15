import * as React from "react";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";

import { fieldStyles } from "@/components/v2/ui/field/styles";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  labelClassName?: string;
  containerClassName?: string;
};
export const Select = ({
  label,
  error,
  labelClassName,
  containerClassName,
  id,
  className,
  ...props
}: SelectProps) => {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  return (
    <div className={clsx(fieldStyles.wrapper, containerClassName)}>
      <label
        className={clsx(fieldStyles.label, labelClassName)}
        htmlFor={inputId}
      >
        {label}
      </label>
      <div className="relative">
        <select
          {...props}
          id={inputId}
          className={clsx(
            fieldStyles.control,
            "h-11 appearance-none pr-10",
            className
          )}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={
            [props["aria-describedby"], error ? `${inputId}-error` : undefined]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        <ChevronDown
          aria-hidden="true"
          size={18}
          className={clsx(
            "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-v2-text-secondary",
            props.disabled && "opacity-[0.48]"
          )}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className={fieldStyles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
