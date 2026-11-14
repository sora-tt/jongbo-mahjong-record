import * as React from "react";

import { Crown } from "lucide-react";

import { EmptyState } from "@/components/v2/ui/empty-state";
import { SectionCard } from "@/components/v2/ui/section-card";

import type { useSeasonPage } from "@/features/season/hooks/use-season-page";

export const SeasonTitles = ({
  titles,
}: Pick<ReturnType<typeof useSeasonPage>, "titles">) => (
  <SectionCard title="タイトル">
    {titles.length ? (
      <div className="divide-y divide-v2-border-subtle">
        {titles.map((title) => (
          <div
            key={title.label}
            className="grid grid-cols-3 items-center gap-x-4 px-2 py-3 text-v2-label text-v2-text-secondary"
          >
            <div>{title.label}</div>
            <div className="flex items-center justify-center gap-1">
              <Crown
                size={16}
                className="text-[var(--v2-warning)]"
                aria-hidden="true"
              />
              <span className="font-semibold text-v2-text">
                {title.playerName}
              </span>
            </div>
            <div className="text-right font-semibold text-v2-text">
              {title.value}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState
        title="まだタイトルデータがありません"
        className="!border-0 !bg-transparent p-0"
      />
    )}
  </SectionCard>
);
