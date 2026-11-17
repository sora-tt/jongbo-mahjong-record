import * as React from "react";

import { Status } from "@/components/ui/status";

export const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => <Status message={message} onRetry={onRetry} />;
