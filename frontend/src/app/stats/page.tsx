"use client";

import * as React from "react";

import { StatisticsMetricCard } from "@/features/statistics/ui/StatisticsMetricCard";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "@/components/ui/table";

import { useStatistics } from "./hooks";

const formatDecimal = (value: number | null, digits: number) =>
  value === null ? "未集計" : value.toFixed(digits);

const StatisticsPage: React.FC = () => {
  const {
    userName,
    joiningLeagueSeasons,
    selectedLeagueSeasonId,
    selectedStats,
    isLoading,
    initialError,
    statsError,
    statsStatus,
    isStatsLoading,
    onChangeLeagueSeason,
    onDisplayButtonClick,
    retry,
    retryStats,
  } = useStatistics();

  if (isLoading) {
    return (
      <AppShell mainClassName="min-h-screen bg-background font-jp">
        <LoadingState
          label="個人成績を読み込んでいます…"
          className="min-h-[calc(100vh-4rem)]"
        />
      </AppShell>
    );
  }

  return (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header>
          <p className="text-sm text-text-muted">個人成績</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">
            {userName}さんの成績
          </h1>
        </header>

        {initialError ? (
          <ErrorState message={initialError} onRetry={retry} />
        ) : joiningLeagueSeasons.length === 0 ? (
          <EmptyState
            title="参加中のシーズンがありません"
            description="シーズンに参加すると個人成績を確認できます。"
          />
        ) : (
          <Card title="対象シーズン">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Select
                label="シーズン"
                containerClassName="flex-1"
                value={selectedLeagueSeasonId}
                onChange={onChangeLeagueSeason}
              >
                <option value="">シーズンを選択してください</option>
                {joiningLeagueSeasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.leagueName} - {season.seasonName}
                  </option>
                ))}
              </Select>
              <Button
                onClick={onDisplayButtonClick}
                disabled={!selectedLeagueSeasonId || isStatsLoading}
                loading={isStatsLoading}
              >
                表示
              </Button>
            </div>
          </Card>
        )}

        {statsError ? (
          <ErrorState message={statsError} onRetry={retryStats} />
        ) : null}
        {statsStatus === "loading" ? (
          <LoadingState label="個人成績を読み込んでいます…" />
        ) : statsStatus === "uncomputed" ? (
          <EmptyState
            title="統計がまだ計算されていません"
            description="対局が登録されると、BEで集計された個人成績が表示されます。"
          />
        ) : statsStatus === "idle" && joiningLeagueSeasons.length > 0 ? (
          <EmptyState title="シーズンを選択して成績を表示してください" />
        ) : null}

        {statsStatus === "success" && selectedStats ? (
          <>
            <p className="text-sm text-text-muted">
              {selectedStats.leagueName ?? "リーグ不明"} /{" "}
              {selectedStats.seasonName ?? "シーズン不明"}
            </p>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatisticsMetricCard
                label="総合pt"
                value={formatDecimal(selectedStats.totalPoints, 1)}
                unit="pt"
              />
              <StatisticsMetricCard
                label="対局数"
                value={selectedStats.totalMatchCount}
                unit="局"
              />
              <StatisticsMetricCard
                label="現在順位"
                value={formatDecimal(selectedStats.currentRank, 0)}
                unit={selectedStats.currentRank === null ? undefined : "位"}
              />
              <StatisticsMetricCard
                label="平均順位"
                value={formatDecimal(selectedStats.averageRank, 2)}
                unit="位"
              />
            </div>

            <Card title="順位別成績" bodyClassName="overflow-x-auto">
              <Table caption="順位別成績">
                <TableHead>
                  <TableRow>
                    <TableHeadCell className="text-left">順位</TableHeadCell>
                    <TableHeadCell className="text-left">回数</TableHeadCell>
                    <TableHeadCell className="text-left">割合</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    ["1位", selectedStats.firstCount, selectedStats.firstRate],
                    [
                      "2位",
                      selectedStats.secondCount,
                      selectedStats.secondRate,
                    ],
                    ["3位", selectedStats.thirdCount, selectedStats.thirdRate],
                    [
                      "4位",
                      selectedStats.fourthCount,
                      selectedStats.fourthRate,
                    ],
                  ].map(([label, count, rate]) => (
                    <TableRow key={label}>
                      <TableCell className="text-left">{label}</TableCell>
                      <TableCell className="text-left">
                        {count ?? "-"}
                      </TableCell>
                      <TableCell className="text-left">
                        {typeof rate === "number" ? `${rate.toFixed(2)}%` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        ) : null}
      </div>
    </AppShell>
  );
};

export default StatisticsPage;
