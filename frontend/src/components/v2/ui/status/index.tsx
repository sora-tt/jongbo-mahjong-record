import * as React from "react";

import { Button } from "@/components/v2/ui/button";
import { LoadingIcon } from "@/components/v2/ui/loading-icon";

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
    className="rounded-v2-panel bg-v2-surface p-4 text-v2-label text-v2-text-secondary"
    role={loading ? "status" : "alert"}
  >
    <p className={loading ? "flex items-center gap-2" : undefined}>
      {loading && <LoadingIcon size={20} className="text-v2-brand-strong" />}
      <span className={loading ? "sr-only" : undefined}>{message}</span>
    </p>
    {onRetry && (
      <Button className="mt-3" variant="secondary" size="sm" onClick={onRetry}>
        再試行
      </Button>
    )}
  </div>
);
