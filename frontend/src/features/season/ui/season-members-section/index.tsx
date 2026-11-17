import * as React from "react";

import { Panel } from "@/components/ui/panel";

export const SeasonMembersSection = ({
  count,
  children,
}: React.PropsWithChildren<{ count: number }>) => (
  <Panel>
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-app-heading-2 font-bold">参加メンバー</h2>
      <span className="text-app-caption text-app-brand-strong">
        {count}人選択
      </span>
    </div>
    {children}
  </Panel>
);
