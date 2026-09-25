"use client";

import * as React from "react";

import { AppShell } from "@/components/layout/app-shell";
import { AverageRankCard } from "@/components/pages/personal-record/average-rank-card";
import { TopTwoRateCard } from "@/components/pages/personal-record/top-two-rate-card";
import { TotalMatchCard } from "@/components/pages/personal-record/total-match-card";
import { TotalPointCard } from "@/components/pages/personal-record/total-point-card";
import { Button } from "@/components/ui/button";
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

import { usePersonalRecord } from "./hooks";

const PersonalRecordPage: React.FC = () => {
  const {
    userName,
    joiningLeagueSeasons,
    selectedLeagueSeasonId,
    selectedStats,
    isLoading,
    isStatsLoading,
    error,
    onChangeLeagueSeason,
    onDisplayButtonClick,
  } = usePersonalRecord();

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
      <div className="flex flex-col max-w-7xl gap-4 mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-2xl font-bold text-text-dark">
          {userName}さんの個人記録
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-xl font-bold text-text-muted">シーズン選択</div>
          <div className="flex flex-row gap-2">
            <Select
              containerClassName="flex-1"
              value={selectedLeagueSeasonId}
              onChange={onChangeLeagueSeason}
            >
              <option value="">シーズンを選択してください</option>
              {joiningLeagueSeasons &&
                joiningLeagueSeasons.map((leagueSeason) => (
                  <option key={leagueSeason.id} value={leagueSeason.id}>
                    {leagueSeason.name}
                  </option>
                ))}
            </Select>
            <div className="flex">
              <Button
                className="min-w-16"
                onClick={onDisplayButtonClick}
                disabled={!selectedLeagueSeasonId || isStatsLoading}
                loading={isStatsLoading}
              >
                表示
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1">
          <TotalMatchCard selectedStats={selectedStats} />
          <TotalPointCard selectedStats={selectedStats} />
          <AverageRankCard selectedStats={selectedStats} />
          <TopTwoRateCard selectedStats={selectedStats} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xl font-bold text-text-muted">各順位回数</div>
          <div className="overflow-hidden rounded-surface border border-border bg-white">
            <Table
              caption="各順位の回数"
              className="text-base font-bold text-foreground"
            >
              <TableHead>
                <TableRow>
                  <TableHeadCell className="text-left">順位</TableHeadCell>
                  <TableHeadCell className="text-left">回数</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell className="text-left">1位</TableCell>
                  <TableCell className="text-left">
                    {selectedStats?.numberOfEachOrder.first ?? "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left">2位</TableCell>
                  <TableCell className="text-left">
                    {selectedStats?.numberOfEachOrder.second ?? "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left">3位</TableCell>
                  <TableCell className="text-left">
                    {selectedStats?.numberOfEachOrder.third ?? "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-left">4位</TableCell>
                  <TableCell className="text-left">
                    {selectedStats?.numberOfEachOrder.fourth ?? "-"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {error ? <ErrorState message={error} /> : null}
      </div>
    </AppShell>
  );
};

export default PersonalRecordPage;
