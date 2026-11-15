import * as React from "react";

import { Card } from "@/components/v2/ui/card";

export const Panel = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => (
  <Card as="section" size="auto" {...props} className={className} />
);
