import * as React from "react";

import clsx from "clsx";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  description?: string;
  error?: string;
  containerClassName?: string;
};

export const Input: React.FC<InputProps> = ({
  id,
  label,
  description,
  error,
  required,
  className,
  containerClassName,
  ...props
}) => {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={clsx("space-y-1.5", containerClassName)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground"
        >
          {label}
          {required ? (
            <span className="ml-1 text-danger" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {description ? (
        <p id={descriptionId} className="text-xs text-text-muted">
          {description}
        </p>
      ) : null}
      <input
        id={inputId}
        required={required}
        aria-describedby={errorId ?? descriptionId}
        aria-invalid={error ? true : undefined}
        className={clsx(
          "w-full rounded-control border bg-white px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-text-muted",
          "border-border hover:border-brand-400 focus:border-brand-strong focus:outline-none",
          "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
          error && "border-danger focus:border-danger",
          className
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};
