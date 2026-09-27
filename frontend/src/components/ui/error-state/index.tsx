import * as React from "react";

import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "データの取得に失敗しました。",
  onRetry,
}) => (
  <div
    className="space-y-3 rounded-surface border border-error-border bg-error-bg p-5 text-center"
    role="alert"
  >
    <p className="text-sm text-error-text">{message}</p>
    {onRetry ? (
      <Button variant="secondary" size="sm" onClick={onRetry}>
        再試行
      </Button>
    ) : null}
  </div>
);
