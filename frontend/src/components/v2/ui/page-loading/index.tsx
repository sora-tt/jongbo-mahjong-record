import * as React from "react";

import { LoadingState } from "@/components/v2/ui/loading-state";

export const PageLoading = ({
  label,
  bottomNav = false,
}: {
  label: string;
  bottomNav?: boolean;
}) => (
  <main>
    <LoadingState
      label={label}
      className={
        bottomNav
          ? "min-h-[calc(100dvh-134px-env(safe-area-inset-top)-env(safe-area-inset-bottom))]"
          : "min-h-[calc(100dvh-60px-env(safe-area-inset-top))]"
      }
    />
  </main>
);
