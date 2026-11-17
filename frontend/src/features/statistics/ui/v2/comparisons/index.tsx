import * as React from "react";

import {
  formatStatisticsTrendPoints,
  formatStatisticsTrendRate,
} from "@/features/statistics/model/trend";

import { Button } from "@/components/v2/ui/button";
import { EmptyState } from "@/components/v2/ui/empty-state";
import { ErrorState } from "@/components/v2/ui/error-state";
import { IconContainer } from "@/components/v2/ui/icon-container";
import { Panel } from "@/components/v2/ui/panel";

import type { PersonalStatisticsAnalysisResponse } from "@/features/statistics/api";

const winds = [
  { key: "east", label: "東", color: "var(--v2-rank-first)" },
  { key: "south", label: "南", color: "var(--v2-rank-second)" },
  { key: "west", label: "西", color: "var(--v2-rank-third)" },
  { key: "north", label: "北", color: "var(--v2-coral-800)" },
] as const;

const pointColor = (value: number | null) =>
  value === null || value === 0
    ? "text-v2-text"
    : value > 0
      ? "text-blue-600"
      : "text-v2-danger";

const PointValue = ({ value }: { value: number | null }) => (
  <span
    className={`shrink-0 whitespace-nowrap text-v2-label font-semibold ${pointColor(value)}`}
  >
    {value === null ? "—" : `${formatStatisticsTrendPoints(value)} pt`}
  </span>
);

export const StatisticsComparisons = ({
  opponentAnalysis,
  seatAnalysis,
  isLoadingMore,
  loadMoreError,
  onLoadMore,
}: {
  opponentAnalysis: PersonalStatisticsAnalysisResponse;
  seatAnalysis: PersonalStatisticsAnalysisResponse | null;
  subjectLabel: string;
  scopeLabel: string;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  onLoadMore: (cursor: string) => void;
}) => {
  const opponent =
    opponentAnalysis.status === "ready" &&
    opponentAnalysis.breakdown.dimension === "opponent"
      ? opponentAnalysis.breakdown
      : null;
  const seat =
    seatAnalysis?.status === "ready" &&
    seatAnalysis.breakdown.dimension === "seat"
      ? seatAnalysis.breakdown
      : null;
  const showType =
    opponentAnalysis.scope.scopeType === "overall" &&
    opponentAnalysis.scope.gameType === "all";
  const mixedSeatFormats =
    new Set(
      seat?.rows.filter((row) => row.matchCount > 0).map((row) => row.gameType)
    ).size > 1;

  return (
    <section className="space-y-4" aria-label="相手・席別成績">
      <Panel>
        <h2 className="text-v2-heading-2 font-bold">対戦相手別</h2>
        {opponent?.rows.length ? (
          <>
            <ul className="mt-2" aria-label="対戦相手別成績">
              {opponent.rows.map((row) => (
                <li
                  key={`${row.userId}-${row.gameType}`}
                  className="flex items-center gap-3 border-b border-v2-border-subtle py-3 last:border-0"
                >
                  <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span
                      className="max-w-[4em] truncate text-v2-label font-bold"
                      title={row.userName || "名前未設定"}
                    >
                      {row.userName || "名前未設定"}
                    </span>
                    <span className="text-v2-caption text-v2-text-secondary">
                      {showType &&
                        `${row.gameType === "sanma" ? "三麻" : "四麻"}・`}
                      {row.encounterCount}局・上位率{" "}
                      {row.aboveRate === null
                        ? "—"
                        : formatStatisticsTrendRate(row.aboveRate)}
                    </span>
                  </div>
                  <PointValue value={row.averagePointDifference} />
                </li>
              ))}
            </ul>
            {loadMoreError && <ErrorState message={loadMoreError} />}
            {opponent.nextCursor && (
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                className="mt-4"
                loading={isLoadingMore}
                onClick={() => onLoadMore(opponent.nextCursor!)}
              >
                さらに表示
              </Button>
            )}
          </>
        ) : (
          <EmptyState title="対戦相手別成績がありません" />
        )}
      </Panel>
      <Panel>
        <h2 className="text-v2-heading-2 font-bold">席別成績</h2>
        <ul className="mt-2" aria-label="席別成績">
          {winds.map((wind) => {
            const rows =
              seat?.rows.filter(
                (row) => row.key === wind.key && row.matchCount > 0
              ) ?? [];
            const formatLabels = ["sanma", "yonma"]
              .filter((type) => rows.some((row) => row.gameType === type))
              .map((type) => (type === "sanma" ? "三麻" : "四麻"))
              .join("・");
            const count = rows.reduce((sum, row) => sum + row.matchCount, 0);
            const topCount = rows.reduce(
              (sum, row) =>
                sum +
                (row.rankCounts.find((rank) => rank.rank === 1)?.count ?? 0),
              0
            );
            const totalPoints = rows.reduce(
              (sum, row) => sum + row.totalPoints,
              0
            );
            const average = count ? totalPoints / count : null;
            const topRate = count ? topCount / count : null;
            return (
              <li
                key={wind.key}
                className="flex items-center gap-3 border-b border-v2-border-subtle py-3 last:border-0"
              >
                <IconContainer
                  circle
                  className="!text-v2-on-primary font-bold"
                  style={{ backgroundColor: wind.color }}
                >
                  {wind.label}
                </IconContainer>
                <div className="min-w-0 flex-1 text-v2-caption text-v2-text-secondary">
                  {mixedSeatFormats && formatLabels && `${formatLabels}・`}
                  {count ? `${count}局` : "—"}・トップ率{" "}
                  {topRate === null ? "—" : formatStatisticsTrendRate(topRate)}
                </div>
                <PointValue value={average} />
              </li>
            );
          })}
        </ul>
      </Panel>
    </section>
  );
};
