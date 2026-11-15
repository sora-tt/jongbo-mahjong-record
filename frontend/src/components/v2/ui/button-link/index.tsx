import * as React from "react";

import Link from "next/link";

import {
  buttonStyles,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/v2/ui/button/styles";

export type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
};

export const ButtonLink = ({
  variant = "primary",
  size = "md",
  fullWidth,
  leadingIcon,
  trailingIcon,
  className,
  children,
  ...props
}: ButtonLinkProps) => (
  <Link
    {...props}
    className={buttonStyles({ variant, size, fullWidth, className })}
  >
    {leadingIcon}
    {children}
    {trailingIcon}
  </Link>
);
