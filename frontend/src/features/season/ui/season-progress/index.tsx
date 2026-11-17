import * as React from "react";

import { toSeasonProgressionData } from "@/features/season/model/point-progression";
import { PointProgressionChart } from "@/features/statistics/ui/point-progression-chart";

import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";

import type { useSeasonPage } from "@/features/season/hooks/use-season-page";

type State = ReturnType<typeof useSeasonPage>;
type Props = Pick<
  State,
  | "pointProgressionChart"
  | "chartSeries"
  | "visibleUserIds"
  | "handleToggleChartSeries"
>;
export const SeasonProgress = ({
  pointProgressionChart,
  chartSeries,
  visibleUserIds,
  handleToggleChartSeries,
}: Props) => {
  const series = chartSeries.map((item, index) => ({
    ...item,
    strokeColor: `var(--app-chart-${(index % 8) + 1})`,
  }));
  const visibleSeries = series.filter((item) =>
    visibleUserIds.includes(item.userId)
  );
  const progressionData = toSeasonProgressionData({
    ...pointProgressionChart,
    series: visibleSeries,
  });
  return (
    <SectionCard title="総合pt推移" bodyClassName="space-y-3">
      {pointProgressionChart.isUncomputed ? (
        <p className="flex h-[clamp(200px,38vw,280px)] items-center justify-center rounded-app-control bg-app-surface-subtle px-4 text-center text-app-label text-app-text-secondary">
          集計が完了するとポイント推移が表示されます。
        </p>
      ) : pointProgressionChart.isEmpty ? (
        <p className="flex h-[clamp(200px,38vw,280px)] items-center justify-center rounded-app-control bg-app-surface-subtle px-4 text-center text-app-label text-app-text-secondary">
          まだ対局データがないため、グラフを表示できません
        </p>
      ) : visibleSeries.length && progressionData.length ? (
        <>
          <PointProgressionChart
            data={progressionData}
            series={visibleSeries}
            lineType="linear"
          />
          <p className="text-right text-app-caption text-app-text-secondary">
            対局数
          </p>
        </>
      ) : visibleSeries.length ? (
        <p className="flex h-[clamp(200px,38vw,280px)] items-center justify-center rounded-app-control bg-app-surface-subtle px-4 text-center text-app-label text-app-text-secondary">
          選択したプレイヤーの対局データがありません
        </p>
      ) : (
        <p className="flex h-[clamp(200px,38vw,280px)] items-center justify-center rounded-app-control bg-app-surface-subtle px-4 text-center text-app-label text-app-text-secondary">
          凡例からプレイヤーを選択するとデータを表示できます
        </p>
      )}
      <div className="flex flex-wrap gap-2 text-app-caption">
        {series.map((item) => (
          <Button
            key={item.userId}
            type="button"
            variant="tertiary"
            size="sm"
            aria-pressed={visibleUserIds.includes(item.userId)}
            className={`!h-8 !gap-1 !rounded !border-0 !bg-transparent !px-1 !font-normal !text-app-text-secondary ${visibleUserIds.includes(item.userId) ? "opacity-100" : "opacity-40"}`}
            onClick={() => handleToggleChartSeries(item.userId)}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: item.strokeColor }}
              aria-hidden="true"
            />
            {item.userName}
          </Button>
        ))}
      </div>
      <p className="text-app-caption text-app-text-secondary">
        ※プレイヤー名をタップするとデータを非表示にできます
      </p>
    </SectionCard>
  );
};
