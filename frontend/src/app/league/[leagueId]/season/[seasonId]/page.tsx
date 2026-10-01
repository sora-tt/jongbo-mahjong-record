"use client";

import * as React from "react";

import clsx from "clsx";
import { Calendar, Crown } from "lucide-react";

import Link from "next/link";

import { PointProgressionChart } from "@/features/statistics/ui/PointProgressionChart";
import { StandingsTable } from "@/features/statistics/ui/StandingsTable";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { HeaderCard } from "@/components/ui/header-card";
import { LoadingState } from "@/components/ui/loading-state";
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

const SeasonPage: React.FC = () => {
  const {
    leagueId,
    seasonId,
    season,
    sessions,
    titles,
    pointProgressionChart,
    chartSeries,
    visibleSeries,
    visibleUserIds,
    loading,
    sessionsLoading,
    sessionsError,
    error,
    retry,
    retrySessions,
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
          <ErrorState message={error} onRetry={retry} />
        </div>
      </AppShell>
    );
  }

  if (!season) {
    return null;
  }

  return (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6">
          <HeaderCard title={season.name} align="center">
            <span className="inline-flex items-center gap-1">
              <Calendar size={14} className="text-white" aria-hidden="true" />
              <span>
                {formatDate(season.createdAt)} 〜{" "}
                {formatDate(season.latestPlayedAt)}
              </span>
            </span>
          </HeaderCard>
        </section>

        <section className="mb-8">
          <Button variant="brand-primary" onClick={handleStartRecording}>
            記録する
          </Button>
        </section>

        <section className="mb-8">
          <SectionCard
            title="順位表"
            rightText={`総対局数：${season.totalMatchCount}`}
            bodyClassName="overflow-x-auto p-4"
          >
            <StandingsTable rows={season.standings} />
          </SectionCard>
        </section>

        <section className="mb-8">
          <SectionCard title="総合pt推移" bodyClassName="space-y-3 p-4">
            {pointProgressionChart.isUncomputed ? (
              <div className="flex h-[clamp(200px,38vw,280px)] w-full items-center justify-center rounded-md bg-gray-50 px-4 text-center text-sm text-text-muted">
                集計が完了するとポイント推移が表示されます。
              </div>
            ) : pointProgressionChart.isEmpty ? (
              <div className="flex h-[clamp(200px,38vw,280px)] w-full items-center justify-center rounded-md bg-gray-50 px-4 text-center text-sm text-text-muted">
                まだ対局データがないため、グラフを表示できません
              </div>
            ) : visibleSeries.length > 0 ? (
              <PointProgressionChart
                data={pointProgressionChart.data}
                series={visibleSeries}
              />
            ) : (
              <div className="flex h-[clamp(200px,38vw,280px)] w-full items-center justify-center rounded-md bg-gray-50 px-4 text-center text-sm text-text-muted">
                凡例からプレイヤーを選択するとデータを表示できます
              </div>
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
                      item.colorClassName
                    )}
                  />
                  <span className="text-text-muted">{item.userName}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted">
              ※プレイヤー名をタップするとデータを非表示にできます
            </p>
          </SectionCard>
        </section>

        <section className="mb-8">
          <SectionCard title="タイトル" bodyClassName="p-4">
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
              <EmptyState
                title="まだタイトルデータがありません"
                className="!border-0 !bg-transparent p-0"
              />
            )}
          </SectionCard>
        </section>

        <section className="mb-8">
          <SectionCard
            title="Session一覧"
            rightText={
              <Link
                className="font-medium text-white hover:underline"
                href={`/league/${leagueId}/season/${seasonId}/sessions/start/players`}
              >
                新しいSessionを開始
              </Link>
            }
            bodyClassName="p-4"
          >
            {sessionsLoading ? (
              <LoadingState label="Session一覧を読み込んでいます…" />
            ) : sessionsError ? (
              <ErrorState message={sessionsError} onRetry={retrySessions} />
            ) : sessions.length === 0 ? (
              <EmptyState
                title="Sessionがありません"
                className="!border-0 !bg-transparent p-0"
              />
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <Link
                    key={String(session.id)}
                    href={`/league/${leagueId}/season/${seasonId}/sessions/${session.id}/results`}
                    className="block rounded-control border border-border p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {formatDate(session.startedAt)}
                        </p>
                        <p className="mt-1 text-sm text-text-muted">
                          {session.members
                            .map((member) => member.userName)
                            .join("・")}
                        </p>
                      </div>
                      <span className="rounded-full bg-surface-muted px-3 py-1 text-xs text-text-muted">
                        {session.endedAt ? "終了" : "進行中"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span>参加者 {session.memberCount}人</span>
                      <span>対局 {session.totalMatchCount}局</span>
                      {session.tableLabel ? (
                        <span>卓 {session.tableLabel}</span>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
};

export default SeasonPage;
