import * as React from "react";

type Variant = keyof typeof variantStyles;
type Size = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
};

// TODO: https://github.com/tatsuyano9/mahjong-record-app/pull/65#discussion_r2680853849
// TODO: https://github.com/tatsuyano9/mahjong-record-app/pull/65#discussion_r2676443355
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
} as const;

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-2.5 text-base rounded-xl",
};

const baseStyles =
  "inline-flex items-center justify-center font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60";

export const Button: React.FC<Props> = ({
  children,
  variant = "brand-primary",
  size = "md",
  fullWidth = false,
  className = "",
  ...props
}) => {
  const variantClass = variantStyles[variant];
  const sizeClass = sizeStyles[size];
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
