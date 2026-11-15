"use client";

import * as React from "react";

import { useLinkStatus } from "next/link";

import { LoadingIcon } from "@/components/v2/ui/loading-icon";

export const LinkLoadingIndicator = () => {
  const { pending } = useLinkStatus();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!pending) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 250);
    return () => window.clearTimeout(timer);
  }, [pending]);

  return visible ? (
    <span
      role="status"
      className="pointer-events-none absolute right-4 top-4 z-20 rounded-full bg-v2-surface p-1 text-v2-brand-strong"
    >
      <LoadingIcon size={20} />
      <span className="sr-only">読み込み中…</span>
    </span>
  ) : null;
};
