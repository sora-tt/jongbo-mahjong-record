"use client";

import * as React from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getStatisticsSignedValueTextClass } from "@/features/statistics/model/signed-value";
import {
  formatStatisticsTrendNumber,
  formatStatisticsTrendPoints,
  formatStatisticsTrendRate,
} from "@/features/statistics/model/trend";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "@/components/ui/table";

import type { PersonalStatisticsAnalysisResponse } from "@/features/statistics/api";

type ReadyAnalysis = Exclude<
  PersonalStatisticsAnalysisResponse,
  { status: "uncomputed" }
>;
type FixedBreakdown = Extract<
  ReadyAnalysis["breakdown"],
  { dimension: "period" | "weekday" | "timeOfDay" | "seat" }
>;
type SeatBreakdown = FixedBreakdown & { dimension: "seat" };
type OpponentBreakdown = Extract<
  ReadyAnalysis["breakdown"],
  { dimension: "opponent" }
>;

type Props = {
  opponentAnalysis: PersonalStatisticsAnalysisResponse;
  seatAnalysis: PersonalStatisticsAnalysisResponse | null;
  subjectLabel: string;
  scopeLabel: string;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  onLoadMore: (cursor: string) => void;
};

const formatGameType = (gameType: "sanma" | "yonma") =>
  gameType === "sanma" ? "三麻" : "四麻";

const getSeatBreakdown = (
  analysis: PersonalStatisticsAnalysisResponse | null
): SeatBreakdown | null => {
  if (!analysis || analysis.status !== "ready") return null;
  return analysis.breakdown.dimension === "seat"
    ? (analysis.breakdown as SeatBreakdown)
    : null;
};

const getOpponentBreakdown = (
  analysis: PersonalStatisticsAnalysisResponse
): OpponentBreakdown | null => {
  if (analysis.status !== "ready") return null;
  return analysis.breakdown.dimension === "opponent"
    ? (analysis.breakdown as OpponentBreakdown)
    : null;
};

const SeatPerformance: React.FC<{
  breakdown: SeatBreakdown | null;
  showGameType: boolean;
}> = ({ breakdown, showGameType }) => {
  const rows = breakdown?.rows.filter((row) => row.matchCount > 0) ?? [];
  const chartData = rows.map((row) => ({
    seat: showGameType
      ? `${formatGameType(row.gameType)} ${row.label}`
      : row.label,
    averagePoint: row.averageFinalPoint ?? 0,
    averageRank: row.averageRank,
    matchCount: row.matchCount,
  }));

  return (
    <Card
      title="席別成績"
      meta={breakdown && showGameType ? "形式ごと" : undefined}
    >
      {rows.length === 0 ? (
        <EmptyState
          title="席別成績がありません"
          description="対局結果が集計されると、席ごとの成績を比較できます。"
          className="!border-0 !bg-transparent p-0"
        />
      ) : (
        <>
          <p className="mb-3 text-xs text-text-muted">
            席ごとの1対局あたりの平均最終ptです。
          </p>
          <div
            className="h-56 w-full"
            role="img"
            aria-label="席別の平均最終ポイントを比較する棒グラフ"
          >
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 12, bottom: 4, left: 8 }}
              >
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-border)" }}
                  tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                  tickFormatter={(value: number) => `${value}pt`}
                />
                <YAxis
                  type="category"
                  dataKey="seat"
                  width={38}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                />
                <ReferenceLine x={0} stroke="var(--color-text-muted)" />
                <Tooltip
                  formatter={(value) => {
                    const points = Number(value);
                    return (
                      <span
                        className={getStatisticsSignedValueTextClass(points)}
                      >
                        {formatStatisticsTrendPoints(points)} pt
                      </span>
                    );
                  }}
                  labelFormatter={(label) => `${label}家`}
                  contentStyle={{
                    borderColor: "var(--color-brand-300)",
                    borderRadius: "var(--radius-control)",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="averagePoint"
                  name="平均最終pt"
                  fill="var(--color-brand-strong)"
                  radius={[0, 4, 4, 0]}
                >
                  {chartData.map((row, index) => (
                    <Cell
                      key={`${row.seat}-${index}`}
                      fill={
                        row.averagePoint > 0
                          ? "#3b82f6"
                          : row.averagePoint < 0
                            ? "#ef4444"
                            : "var(--color-text-muted)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div
            aria-label="席別成績の表。横にスクロールできます。"
            className="-mx-2 overflow-x-auto px-2"
            role="region"
            tabIndex={0}
          >
            <Table caption="席別の対局数、平均順位、トップ率、平均最終ポイント">
              <TableHead>
                <TableRow>
                  {showGameType ? <TableHeadCell>形式</TableHeadCell> : null}
                  <TableHeadCell>席</TableHeadCell>
                  <TableHeadCell>対局</TableHeadCell>
                  <TableHeadCell>平均順位</TableHeadCell>
                  <TableHeadCell>トップ率</TableHeadCell>
                  <TableHeadCell>平均pt</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={`${row.key}-${row.gameType}`}>
                    {showGameType ? (
                      <TableCell>{formatGameType(row.gameType)}</TableCell>
                    ) : null}
                    <TableCell>{row.label}家</TableCell>
                    <TableCell>{row.matchCount}</TableCell>
                    <TableCell>
                      {row.averageRank === null
                        ? "—"
                        : `${formatStatisticsTrendNumber(row.averageRank)}位`}
                    </TableCell>
                    <TableCell>
                      {formatStatisticsTrendRate(row.topRate)}
                    </TableCell>
                    <TableCell
                      className={getStatisticsSignedValueTextClass(
                        row.averageFinalPoint
                      )}
                    >
                      {row.averageFinalPoint === null
                        ? "—"
                        : `${formatStatisticsTrendPoints(row.averageFinalPoint)} pt`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </Card>
  );
};

const OpponentPerformance: React.FC<{
  breakdown: OpponentBreakdown | null;
  showGameType: boolean;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  onLoadMore: (cursor: string) => void;
}> = ({
  breakdown,
  showGameType,
  isLoadingMore,
  loadMoreError,
  onLoadMore,
}) => (
  <Card
    title="対戦相手別"
    meta={breakdown ? `${breakdown.rows.length}人` : undefined}
  >
    {!breakdown || breakdown.rows.length === 0 ? (
      <EmptyState
        title="対戦相手別成績がありません"
        description="同卓者との対局結果が集計されると、比較を表示します。"
        className="!border-0 !bg-transparent p-0"
      />
    ) : (
      <div className="space-y-3">
        <ul className="divide-y divide-border" aria-label="対戦相手別成績">
          {breakdown.rows.map((row) => (
            <li
              key={`${row.userId}-${row.gameType}`}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {row.userName || "名前未設定"}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {showGameType ? `${formatGameType(row.gameType)}・` : ""}
                  {row.encounterCount}回対戦・同順位 {row.tieCount}回
                </p>
                <p
                  className={`mt-1 text-xs ${getStatisticsSignedValueTextClass(row.totalPointDifference)}`}
                >
                  累計差 {formatStatisticsTrendPoints(row.totalPointDifference)}{" "}
                  pt
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={`font-semibold ${getStatisticsSignedValueTextClass(row.averagePointDifference)}`}
                >
                  {formatStatisticsTrendPoints(row.averagePointDifference)} pt
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  平均差 / 上位率 {formatStatisticsTrendRate(row.aboveRate)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {loadMoreError ? <ErrorState message={loadMoreError} /> : null}
        {breakdown.nextCursor ? (
          <Button
            type="button"
            variant="secondary"
            fullWidth
            className="min-h-11"
            loading={isLoadingMore}
            onClick={() => onLoadMore(breakdown.nextCursor as string)}
          >
            さらに表示
          </Button>
        ) : null}
      </div>
    )}
  </Card>
);

export const StatisticsComparisons: React.FC<Props> = ({
  opponentAnalysis,
  seatAnalysis,
  subjectLabel,
  scopeLabel,
  isLoadingMore,
  loadMoreError,
  onLoadMore,
}) => {
  const seatBreakdown = getSeatBreakdown(seatAnalysis);
  const opponentBreakdown = getOpponentBreakdown(opponentAnalysis);
  const showGameType =
    opponentAnalysis.scope.scopeType === "overall" &&
    opponentAnalysis.scope.gameType === "all";

  return (
    <section
      aria-labelledby="statistics-comparisons-heading"
      className="space-y-4"
    >
      <h2
        id="statistics-comparisons-heading"
        className="text-xl font-bold text-foreground"
      >
        相手・席
      </h2>
      <p className="text-sm text-text-muted">
        {subjectLabel} / {scopeLabel}
      </p>
      <SeatPerformance breakdown={seatBreakdown} showGameType={showGameType} />
      <OpponentPerformance
        breakdown={opponentBreakdown}
        showGameType={showGameType}
        isLoadingMore={isLoadingMore}
        loadMoreError={loadMoreError}
        onLoadMore={onLoadMore}
      />
    </section>
  );
};
