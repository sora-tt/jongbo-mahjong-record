"use client";

import * as React from "react";

import clsx from "clsx";
import { Calendar, Crown } from "lucide-react";

import Header from "@/components/common/container/header";
import { LeagueRankingTable } from "@/components/pages/league/league-ranking-table";
import { SeasonPointProgressionChart } from "@/components/pages/league/season-point-progression-chart";
import { Button } from "@/components/ui/button";
import { HeaderCard } from "@/components/ui/header-card";
import { SectionCard } from "@/components/ui/section-card";

import { useSeasonPage } from "./hooks";

const formatDate = (value: string | null) => {
  if (!value) {
    return "未記録";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
};

const CHART_STROKE_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#ec4899",
  "#f97316",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#84cc16",
  "#14b8a6",
  "#06b6d4",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#f43f5e",
  "#db2777",
  "#a16207",
  "#78716c",
  "#6b7280",
  "#111827",
];

const SeasonPage: React.FC = () => {
  const {
    season,
    titles,
    pointProgressionChart,
    loading,
    error,
    handleStartRecording,
  } = useSeasonPage();

  const chartSeries = React.useMemo(
    () =>
      pointProgressionChart.series.map((item, index) => ({
        userId: item.userId,
        userName: item.userName,
        colorClassName: item.colorClassName,
        strokeColor:
          CHART_STROKE_COLORS[index % CHART_STROKE_COLORS.length] ?? "#111827",
      })),
    [pointProgressionChart.series]
  );

  const [visibleUserIds, setVisibleUserIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    setVisibleUserIds(chartSeries.map((item) => item.userId));
  }, [chartSeries]);

  const visibleSeries = React.useMemo(
    () =>
      chartSeries.filter((item) =>
        visibleUserIds.some((userId) => userId === item.userId)
      ),
    [chartSeries, visibleUserIds]
  );

  const handleToggleSeries = React.useCallback((userId: string) => {
    setVisibleUserIds((prev) => {
      if (prev.some((id) => id === userId)) {
        return prev.filter((id) => id !== userId);
      }

      return [...prev, userId];
    });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 bg-white min-h-full font-jp">
        <Header />
        <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 text-center text-text-muted">
          シーズン情報を読み込んでいます...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-white min-h-full font-jp">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-error-bg border-2 border-error-border rounded-lg p-4">
            <p className="text-error-text text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!season) return null;

  return (
    <div className="flex-1 bg-white min-h-full font-jp">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-6">
          <HeaderCard title={season.name} align="center">
            <span className="inline-flex items-center gap-1">
              <Calendar size={14} className="text-white" />
              <span>
                {formatDate(season.createdAt)} 〜{" "}
                {formatDate(season.latestPlayedAt)}
              </span>
            </span>
          </HeaderCard>
        </section>

        <section className="mb-6">
          <div className="flex gap-3">
            <Button variant="brand-primary">更新する</Button>
            <Button variant="brand-secondary" onClick={handleStartRecording}>
              記録する
            </Button>
          </div>
        </section>

        <section className="mb-8">
          <SectionCard
            title="順位表"
            rightText={`総対局数：${season.totalMatchCount}`}
            bodyClassName="p-4 overflow-x-auto"
          >
            <LeagueRankingTable members={season.standings} />
          </SectionCard>
        </section>

        <section className="mb-8">
          <SectionCard title="総合pt推移" bodyClassName="p-4">
            {pointProgressionChart.isChartEmpty ? (
              <div className="mb-3 flex h-[clamp(200px,38vw,280px)] w-full items-center justify-center rounded-md bg-gray-50 px-4 text-center text-sm text-text-muted">
                まだ対局データがないため、グラフを表示できません
              </div>
            ) : visibleSeries.length > 0 ? (
              <SeasonPointProgressionChart
                data={pointProgressionChart.chartData}
                series={visibleSeries}
              />
            ) : (
              <div className="mb-3 flex h-[clamp(200px,38vw,280px)] w-full items-center justify-center rounded-md bg-gray-50 px-4 text-center text-sm text-text-muted">
                凡例からプレイヤーを選択するとグラフを表示できます
              </div>
            )}
            <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs sm:gap-x-4 sm:gap-y-1">
              {chartSeries.map((item) => (
                <button
                  key={item.userId}
                  type="button"
                  className={clsx(
                    "flex min-h-7 items-center gap-1 rounded px-1 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300",
                    visibleUserIds.some((userId) => userId === item.userId)
                      ? "opacity-100"
                      : "opacity-40"
                  )}
                  onClick={() => handleToggleSeries(item.userId)}
                >
                  <span
                    className={clsx(
                      "inline-block w-2 h-2 rounded-full",
                      item.colorClassName
                    )}
                  />
                  <span className="text-text-muted">{item.userName}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-text-muted sm:text-[10px]">
              ※プレイヤー名をタップするとデータを非表示にできます
            </p>
          </SectionCard>
        </section>

        <section className="mb-8">
          <SectionCard title="タイトル" bodyClassName="p-4">
            <div>
              {titles.length > 0 ? (
                titles.map((t) => (
                  <div
                    key={t.label}
                    className="grid grid-cols-3 gap-x-4 px-4 py-2 text-sm border-b border-pink-200 last:border-b-0 items-center text-text-muted"
                  >
                    <div className="text-left">{t.label}</div>
                    <div className="flex items-center justify-center gap-1">
                      <Crown size={16} className="text-yellow-400" />
                      <span className="font-semibold">{t.playerName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{t.value}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div>No title</div>
              )}
            </div>
          </SectionCard>
        </section>
      </div>
    </div>
  );
};

export default SeasonPage;
