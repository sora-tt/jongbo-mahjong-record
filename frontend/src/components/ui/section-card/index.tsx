import * as React from "react";

import clsx from "clsx";

import { Panel } from "@/components/ui/panel";

export const SectionCard = ({
  title,
  rightText,
  bodyClassName,
  children,
}: React.PropsWithChildren<{
  title: React.ReactNode;
  rightText?: React.ReactNode;
  bodyClassName?: string;
}>) => (
  <Panel>
    <header className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-app-heading-2 font-bold">{title}</h2>
      {rightText && (
        <span className="text-app-caption text-app-brand-strong">
          {rightText}
        </span>
      )}
    </header>
    <div className={clsx(bodyClassName)}>{children}</div>
  </Panel>
);
