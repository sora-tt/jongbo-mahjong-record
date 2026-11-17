import * as React from "react";

import { Button } from "@/components/ui/button";
import { LoadingIcon } from "@/components/ui/loading-icon";

export const Status = ({
  message,
  onRetry,
  loading = false,
}: {
  message: string;
  onRetry?: () => void;
  loading?: boolean;
}) => (
  <div
    className="rounded-app-panel bg-app-surface p-4 text-app-label text-app-text-secondary"
    role={loading ? "status" : "alert"}
  >
    <p className={loading ? "flex items-center gap-2" : undefined}>
      {loading && <LoadingIcon size={20} className="text-app-brand-strong" />}
      <span className={loading ? "sr-only" : undefined}>{message}</span>
    </p>
    {onRetry && (
      <Button className="mt-3" variant="secondary" size="sm" onClick={onRetry}>
        再試行
      </Button>
    )}
  </div>
);
