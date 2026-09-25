import * as React from "react";

import clsx from "clsx";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  description?: string;
  error?: string;
  containerClassName?: string;
};

export const Select: React.FC<SelectProps> = ({
  id,
  label,
  description,
  error,
  required,
  className,
  containerClassName,
  children,
  ...props
}) => {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;
  const descriptionId = description ? `${selectId}-description` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className={clsx("space-y-1.5", containerClassName)}>
      {label ? (
        <label
          htmlFor={selectId}
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
      <select
        id={selectId}
        required={required}
        aria-describedby={errorId ?? descriptionId}
        aria-invalid={error ? true : undefined}
        className={clsx(
          "w-full rounded-control border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm",
          "hover:border-brand-400 focus:border-brand-strong focus:outline-none",
          "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
          error && "border-danger focus:border-danger",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p id={errorId} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};
