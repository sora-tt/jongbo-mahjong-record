import * as React from "react";

import clsx from "clsx";

import { fieldStyles } from "@/components/ui/field/styles";

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  description?: string;
  error?: string;
  containerClassName?: string;
  size?: "sm" | "md" | "lg";
};
const sizeStyles = { sm: "h-9", md: "h-11", lg: "h-[52px]" };

export const Input = ({
  label,
  description,
  error,
  size = "md",
  id,
  className,
  containerClassName,
  ...props
}: InputProps) => {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const hintId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className={clsx(fieldStyles.wrapper, containerClassName)}>
      {label && (
        <label className={fieldStyles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        className={clsx(fieldStyles.control, sizeStyles[size], className)}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={
          Array.from(
            new Set(
              [
                ...(props["aria-describedby"]?.split(/\s+/) ?? []),
                hintId,
                errorId,
              ].filter(Boolean)
            )
          ).join(" ") || undefined
        }
      />
      {description && (
        <p className={fieldStyles.label} id={hintId}>
          {description}
        </p>
      )}
      {error && (
        <p className={fieldStyles.error} id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
