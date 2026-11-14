import * as React from "react";

import {
  formatStatisticsTrendNumber,
  formatStatisticsTrendPoints,
  formatStatisticsTrendRate,
} from "@/features/statistics/model/trend";

import { Button } from "@/components/v2/ui/button";
import { EmptyState } from "@/components/v2/ui/empty-state";
import { ErrorState } from "@/components/v2/ui/error-state";
import { IconContainer } from "@/components/v2/ui/icon-container";
import { Panel } from "@/components/v2/ui/panel";
import { Table } from "@/components/v2/ui/table";

import type { PersonalStatisticsAnalysisResponse } from "@/features/statistics/api";

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
  const windColors: Record<string, string> = {
    東: "var(--v2-rank-first)",
    南: "var(--v2-rank-second)",
    西: "var(--v2-rank-third)",
    北: "var(--v2-coral-800)",
  };
  return (
    <section className="space-y-4" aria-label="相手・席別成績">
      <Panel>
        <h2 className="text-v2-heading-2 font-bold">対戦相手別</h2>
        <p className="mt-1 text-v2-caption text-v2-text-secondary">
          同卓した相手とのポイント差
        </p>
        {opponent?.rows.length ? (
          <>
            <div className="mt-3 overflow-x-auto">
              <Table plain className="min-w-[280px] text-left text-v2-caption">
                <thead className="bg-v2-brand-soft text-v2-text-secondary">
                  <tr>
                    <th className="p-2">相手</th>
                    <th>対局数</th>
                    <th>平均差</th>
                  </tr>
                </thead>
                <tbody>
                  {opponent.rows.map((row) => (
                    <tr
                      key={`${row.userId}-${row.gameType}`}
                      className="border-b border-v2-border-subtle"
                    >
                      <td className="py-3">
                        <span className="font-bold text-v2-label">
                          {row.userName || "名前未設定"}
                        </span>
                        {showType && (
                          <span className="ml-1">
                            {row.gameType === "sanma" ? "三麻" : "四麻"}
                          </span>
                        )}
                        <details className="mt-1 text-v2-text-secondary">
                          <summary className="cursor-pointer">詳細</summary>
                          <p>
                            上位率 {formatStatisticsTrendRate(row.aboveRate)}
                            ・同順位 {row.tieCount}回
                          </p>
                          <p>
                            累計差{" "}
                            {formatStatisticsTrendPoints(
                              row.totalPointDifference
                            )}{" "}
                            pt
                          </p>
                        </details>
                      </td>
                      <td>{row.encounterCount}局</td>
                      <td className="font-semibold">
                        {formatStatisticsTrendPoints(
                          row.averagePointDifference
                        )}{" "}
                        pt
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
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
        <p className="mt-1 text-v2-caption text-v2-text-secondary">
          東南西北ごとの成績
        </p>
        {seat?.rows.some((row) => row.matchCount > 0) ? (
          <ul className="mt-2">
            {seat.rows
              .filter((row) => row.matchCount > 0)
              .map((row) => (
                <li
                  key={`${row.key}-${row.gameType}`}
                  className="flex items-center gap-3 border-b border-v2-border-subtle py-3 last:border-0"
                >
                  <IconContainer
                    circle
                    className="!text-v2-on-primary font-bold"
                    style={{
                      backgroundColor:
                        windColors[row.label.replace("家", "")] ??
                        "var(--v2-text-secondary)",
                    }}
                  >
                    {row.label.replace("家", "")}
                  </IconContainer>
                  <div className="min-w-0 flex-1 text-v2-caption">
                    <p>
                      {showType &&
                        `${row.gameType === "sanma" ? "三麻" : "四麻"}・`}
                      {row.averageRank === null
                        ? "—"
                        : `${formatStatisticsTrendNumber(row.averageRank)}位`}
                    </p>
                    <p className="text-v2-text-secondary">
                      {row.matchCount}局・トップ率{" "}
                      {formatStatisticsTrendRate(row.topRate)}
                    </p>
                  </div>
                  <span
                    className={`text-v2-label font-semibold ${(row.averageFinalPoint ?? 0) > 0 ? "text-blue-600" : (row.averageFinalPoint ?? 0) < 0 ? "text-v2-danger" : ""}`}
                  >
                    {row.averageFinalPoint === null
                      ? "—"
                      : `${formatStatisticsTrendPoints(row.averageFinalPoint)} pt`}
                  </span>
                </li>
              ))}
          </ul>
        ) : (
          <EmptyState title="席別成績がありません" />
        )}
      </Panel>
    </section>
  );
};
