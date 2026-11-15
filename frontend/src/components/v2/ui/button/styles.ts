import clsx from "clsx";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "danger"
  | "selection";
export type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-v2-action-primary text-v2-on-primary",
  secondary: "border-v2-border bg-v2-surface text-v2-brand-strong",
  tertiary: "bg-transparent text-v2-brand-strong",
  danger: "bg-v2-danger text-v2-on-primary",
  selection: "border-v2-border bg-v2-surface-subtle text-v2-brand-strong",
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
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-transparent px-5 font-[inherit] text-v2-label font-semibold disabled:cursor-not-allowed disabled:opacity-[0.48]",
    variantStyles[variant],
    selected && "!border-v2-border !bg-v2-brand-soft",
    sizeStyles[size],
    fullWidth && "w-full",
    className
  );
