"use client";

import * as React from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getStatisticsSignedValueTextClass } from "@/features/statistics/model/signed-value";
import {
  formatStatisticsTrendPoints,
  getStatisticsTrendContext,
} from "@/features/statistics/model/trend";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
type TemporalBreakdown = ReadyAnalysis["breakdown"] & {
  rows: Array<{
    key: string;
    label: string;
    totalPoints: number;
    matchCount: number;
    averageFinalPoint: number | null;
  }>;
};
type PeriodBreakdown = TemporalBreakdown & { dimension: "period" };

type Props = {
  analysis: PersonalStatisticsAnalysisResponse;
  scopeLabel?: string;
};

type MonthValue = {
  key: string;
  label: string;
  totalPoints: number;
  matchCount: number;
  cumulativePoints: number;
};

const getPeriodBreakdown = (
  analysis: PersonalStatisticsAnalysisResponse
): PeriodBreakdown | null => {
  if (
    analysis.status !== "ready" ||
    analysis.breakdown.dimension !== "period"
  ) {
    return null;
  }
  return analysis.breakdown as PeriodBreakdown;
};

const toMonthlyValues = (breakdown: PeriodBreakdown | null): MonthValue[] => {
  const grouped = new Map<string, Omit<MonthValue, "cumulativePoints">>();
  breakdown?.rows.forEach((row) => {
    const value = grouped.get(row.key) ?? {
      key: row.key,
      label: row.label,
      totalPoints: 0,
      matchCount: 0,
    };
    value.totalPoints += row.totalPoints;
    value.matchCount += row.matchCount;
    grouped.set(row.key, value);
  });

  let cumulativePoints = 0;
  return [...grouped.values()]
    .sort((left, right) => left.key.localeCompare(right.key))
    .map((month) => {
      cumulativePoints += month.totalPoints;
      return { ...month, cumulativePoints };
    });
};

const MonthlyCharts: React.FC<{ breakdown: PeriodBreakdown | null }> = ({
  breakdown,
}) => {
  const months = toMonthlyValues(breakdown);
  const cumulativeTone =
    (months.at(-1)?.cumulativePoints ?? 0) >= 0 ? "#3b82f6" : "#ef4444";

  return (
    <Card title="月別の成績">
      {months.length === 0 ? (
        <EmptyState
          title="月別の成績がありません"
          description="対局結果が登録されると、月ごとのポイント推移を表示します。"
          className="!border-0 !bg-transparent p-0"
        />
      ) : (
        <div className="space-y-5">
          <section aria-labelledby="statistics-monthly-points-heading">
            <h3
              id="statistics-monthly-points-heading"
              className="mb-2 text-sm font-semibold text-foreground"
            >
              月ごとの最終ポイント
            </h3>
            <div
              className="h-52 w-full"
              role="img"
              aria-label="月別の総合ポイントを示す棒グラフ"
            >
              <ResponsiveContainer>
                <BarChart
                  data={months}
                  margin={{ top: 8, right: 8, bottom: 16, left: 2 }}
                >
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    interval="preserveStartEnd"
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={(value: number) => `${value}pt`}
                    tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
                  />
                  <ReferenceLine y={0} stroke="var(--color-text-muted)" />
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
                    labelFormatter={(label) => String(label)}
                    contentStyle={{
                      borderColor: "var(--color-brand-300)",
                      borderRadius: "var(--radius-control)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="totalPoints"
                    name="月間ポイント"
                    fill="var(--color-brand-strong)"
                    radius={[4, 4, 0, 0]}
                  >
                    {months.map((month) => (
                      <Cell
                        key={month.key}
                        fill={
                          month.totalPoints > 0
                            ? "#3b82f6"
                            : month.totalPoints < 0
                              ? "#ef4444"
                              : "var(--color-text-muted)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section aria-labelledby="statistics-cumulative-points-heading">
            <h3
              id="statistics-cumulative-points-heading"
              className="mb-2 text-sm font-semibold text-foreground"
            >
              累計ポイント
            </h3>
            <div
              className="h-52 w-full"
              role="img"
              aria-label="月別ポイントを積み上げた累計ポイントの折れ線グラフ"
            >
              <ResponsiveContainer>
                <LineChart
                  data={months}
                  margin={{ top: 8, right: 8, bottom: 16, left: 2 }}
                >
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    interval="preserveStartEnd"
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={(value: number) => `${value}pt`}
                    tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
                  />
                  <ReferenceLine y={0} stroke="var(--color-text-muted)" />
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
                    labelFormatter={(label) => String(label)}
                    contentStyle={{
                      borderColor: "var(--color-brand-300)",
                      borderRadius: "var(--radius-control)",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    dataKey="cumulativePoints"
                    name="累計ポイント"
                    type="monotone"
                    stroke={cumulativeTone}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <Table caption="月ごとの対局数、総合ポイント、累計ポイント">
            <TableHead>
              <TableRow>
                <TableHeadCell>月</TableHeadCell>
                <TableHeadCell>対局</TableHeadCell>
                <TableHeadCell>月間pt</TableHeadCell>
                <TableHeadCell>累計pt</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {months.map((month) => (
                <TableRow key={month.key}>
                  <TableCell>{month.label}</TableCell>
                  <TableCell>{month.matchCount}</TableCell>
                  <TableCell>
                    <span
                      className={getStatisticsSignedValueTextClass(
                        month.totalPoints
                      )}
                    >
                      {formatStatisticsTrendPoints(month.totalPoints)} pt
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={getStatisticsSignedValueTextClass(
                        month.cumulativePoints
                      )}
                    >
                      {formatStatisticsTrendPoints(month.cumulativePoints)} pt
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};

export const StatisticsTrend: React.FC<Props> = ({ analysis, scopeLabel }) => {
  const periodBreakdown = getPeriodBreakdown(analysis);
  const contextLabel = getStatisticsTrendContext({
    scope: analysis.scope,
    scopeLabel,
  });

  return (
    <section aria-labelledby="statistics-trend-heading" className="space-y-4">
      <header className="space-y-1">
        <h2
          id="statistics-trend-heading"
          className="text-xl font-bold text-foreground"
        >
          成績推移
        </h2>
        <p className="text-sm text-text-muted">{contextLabel}</p>
      </header>

      {analysis.status === "uncomputed" ? (
        <EmptyState
          title="推移はまだ集計されていません"
          description="統計の再計算が完了すると、月別の成績推移を表示します。"
        />
      ) : analysis.status === "empty" ? (
        <EmptyState
          title="対局結果がありません"
          description="月別の成績は対局結果が登録されると表示されます。"
        />
      ) : (
        <MonthlyCharts breakdown={periodBreakdown} />
      )}
    </section>
  );
};
