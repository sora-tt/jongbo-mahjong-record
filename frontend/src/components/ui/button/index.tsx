import * as React from "react";

import { LoadingIcon } from "@/components/ui/loading-icon";

import { buttonStyles, type ButtonSize, type ButtonVariant } from "./styles";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  selected?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
};

export const Button = ({
  variant = "primary",
  size = "md",
  fullWidth,
  loading,
  selected,
  leadingIcon,
  trailingIcon,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) => (
  <button
    {...props}
    className={buttonStyles({ variant, size, selected, fullWidth, className })}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    aria-pressed={selected ?? props["aria-pressed"]}
  >
    {loading ? <LoadingIcon size={16} /> : leadingIcon}
    {children}
    {!loading && trailingIcon}
  </button>
);
