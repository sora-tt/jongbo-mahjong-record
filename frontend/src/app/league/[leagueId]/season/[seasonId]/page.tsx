"use client";

import * as React from "react";

import clsx from "clsx";
import { Calendar, Crown } from "lucide-react";

import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { LeagueRankingTable } from "@/components/pages/league/league-ranking-table";
import { SeasonPointProgressionChart } from "@/components/pages/league/season-point-progression-chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

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

const SeasonPage: React.FC = () => {
  const {
    leagueId,
    seasonId,
    season,
    titles,
    pointProgressionChart,
    chartSeries,
    visibleSeries,
    visibleUserIds,
    loading,
    error,
    handleStartRecording,
    handleToggleChartSeries,
  } = useSeasonPage();

  if (loading) {
    return (
      <AppShell mainClassName="min-h-screen bg-background font-jp">
        <LoadingState
          label="シーズン情報を読み込んでいます…"
          className="min-h-[calc(100vh-4rem)]"
        />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell mainClassName="min-h-screen bg-background font-jp">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ErrorState message={error} />
        </div>
      </AppShell>
    );
  }

  if (!season) {
    return null;
  }

  return (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-text-muted">シーズン詳細</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              {season.name}
            </h1>
            <p className="mt-2 inline-flex items-center gap-1 text-sm text-text-muted">
              <Calendar size={14} aria-hidden="true" />
              <span>
                {formatDate(season.createdAt)} 〜{" "}
                {formatDate(season.latestPlayedAt)}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/league/${leagueId}/season/${seasonId}/edit`}>
              <Button variant="secondary">更新する</Button>
            </Link>
            <Button onClick={handleStartRecording}>記録する</Button>
          </div>
        </header>

        <Card
          title="順位表"
          meta={`総対局数：${season.totalMatchCount}`}
          bodyClassName="overflow-x-auto"
        >
          {season.standings.length > 0 ? (
            <LeagueRankingTable members={season.standings} />
          ) : (
            <EmptyState title="まだ順位データがありません" />
          )}
        </Card>

        <Card title="総合pt推移" bodyClassName="space-y-3">
          {pointProgressionChart.isChartEmpty ? (
            <EmptyState
              title="グラフを表示できません"
              description="まだ対局データがありません。"
            />
          ) : visibleSeries.length > 0 ? (
            <SeasonPointProgressionChart
              data={pointProgressionChart.chartData}
              series={visibleSeries}
            />
          ) : (
            <EmptyState
              title="表示するプレイヤーを選択してください"
              description="下の凡例からプレイヤーを選択できます。"
            />
          )}
          <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs sm:gap-x-4 sm:gap-y-1">
            {chartSeries.map((item) => (
              <button
                key={item.userId}
                type="button"
                aria-pressed={visibleUserIds.includes(item.userId)}
                className={clsx(
                  "flex min-h-7 items-center gap-1 rounded px-1 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                  visibleUserIds.some((userId) => userId === item.userId)
                    ? "opacity-100"
                    : "opacity-40"
                )}
                onClick={() => handleToggleChartSeries(item.userId)}
              >
                <span
                  className={clsx(
                    "inline-block h-2 w-2 rounded-full",
                    item.strokeColor
                  )}
                />
                <span className="text-text-muted">{item.userName}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-text-muted">
            ※プレイヤー名をタップするとデータを非表示にできます
          </p>
        </Card>

        <Card title="タイトル">
          {titles.length > 0 ? (
            <div className="divide-y divide-border">
              {titles.map((title) => (
                <div
                  key={title.label}
                  className="grid grid-cols-3 items-center gap-x-4 px-2 py-3 text-sm text-text-muted"
                >
                  <div>{title.label}</div>
                  <div className="flex items-center justify-center gap-1">
                    <Crown
                      size={16}
                      className="text-warning"
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-foreground">
                      {title.playerName}
                    </span>
                  </div>
                  <div className="text-right font-semibold text-foreground">
                    {title.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="まだタイトルデータがありません" />
          )}
        </Card>
      </div>
    </AppShell>
  );
};

export default SeasonPage;
