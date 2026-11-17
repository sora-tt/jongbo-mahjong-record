import clsx from "clsx";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "danger"
  | "selection";
export type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-app-action-primary text-app-on-primary",
  secondary: "border-app-border bg-app-surface text-app-brand-strong",
  tertiary: "bg-transparent text-app-brand-strong",
  danger: "bg-app-danger text-app-on-primary",
  selection: "border-app-border bg-app-surface-subtle text-app-brand-strong",
};
const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9",
  md: "h-11",
  lg: "h-[52px]",
};

export const buttonStyles = ({
  variant = "primary",
  size = "md",
  selected,
  fullWidth,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  selected?: boolean;
  fullWidth?: boolean;
  className?: string;
} = {}) =>
  clsx(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-transparent px-5 font-[inherit] text-app-label font-semibold disabled:cursor-not-allowed disabled:opacity-[0.48]",
    variantStyles[variant],
    selected && "!border-app-border !bg-app-brand-soft",
    sizeStyles[size],
    fullWidth && "w-full",
    className
  );
