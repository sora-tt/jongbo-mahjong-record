import clsx from "clsx";

import { ButtonLink, type ButtonLinkProps } from "@/components/ui/button-link";

export const IconButtonLink = ({
  size = "md",
  className,
  ...props
}: ButtonLinkProps) => (
  <ButtonLink
    {...props}
    size={size}
    className={clsx("aspect-square !p-0", className)}
  />
);
