import * as React from "react";

import clsx from "clsx";

import { Button, type ButtonProps } from "@/components/ui/button";

export const IconButton = ({
  size = "md",
  className,
  ...props
}: ButtonProps) => (
  <Button
    {...props}
    size={size}
    className={clsx("aspect-square !p-0", className)}
  />
);
