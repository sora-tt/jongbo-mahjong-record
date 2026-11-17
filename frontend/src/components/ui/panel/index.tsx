import * as React from "react";

import { Card } from "@/components/ui/card";

export const Panel = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => (
  <Card as="section" size="auto" {...props} className={className} />
);
