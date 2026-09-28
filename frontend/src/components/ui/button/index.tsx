import * as React from "react";

import clsx from "clsx";

type Variant = keyof typeof variantStyles;
type Size = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
};

const variantStyles = {
  "blue-fill": "bg-blue-500 text-white",
  "yellow-outline":
    "border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white",
  "gray-disabled": "bg-gray-300 text-gray-700 cursor-not-allowed",
  "purple-gradient":
    "bg-gradient-to-r from-purple-400 to-purple-600 text-white hover:from-purple-600 hover:to-purple-400",

  // 色と枠線に責務を絞る
  "brand-primary": "bg-brand-500 hover:bg-brand-600 text-white",
  "brand-secondary":
    "border-2 border-brand-500 text-brand-600 hover:bg-brand-50",
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-strong disabled:hover:bg-brand-600",
  secondary:
    "border border-brand-300 bg-white text-brand-strong hover:bg-brand-50 disabled:hover:bg-white",
  ghost: "text-brand-strong hover:bg-brand-50 disabled:hover:bg-transparent",
  danger: "bg-danger text-white hover:bg-red-700 disabled:hover:bg-danger",
} as const;

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-2.5 text-base rounded-xl",
};

const baseStyles =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60";

export const Button: React.FC<Props> = ({
  children,
  variant = "brand-primary",
  size = "md",
  fullWidth = false,
  loading = false,
  className = "",
  disabled,
  ...props
}) => {
  const variantClass = variantStyles[variant];
  const sizeClass = sizeStyles[size];
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={clsx(
        baseStyles,
        variantClass,
        sizeClass,
        widthClass,
        className
      )}
      aria-busy={loading || undefined}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : null}
      <span>{children}</span>
    </button>
  );
};
