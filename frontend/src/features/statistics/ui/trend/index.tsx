"use client";
import * as React from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getChartDomainIncludingZero } from "@/features/statistics/model/chart";
import { formatStatisticsTrendPoints } from "@/features/statistics/model/trend";

import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { Table } from "@/components/ui/table";

import type { PersonalStatisticsAnalysisResponse } from "@/features/statistics/api";
import type { LabelProps } from "recharts";

export const StatisticsTrend = ({
  analysis,
}: {
  analysis: PersonalStatisticsAnalysisResponse;
  scopeLabel?: string;
}) => {
  const rows =
    analysis.status === "ready" && analysis.breakdown.dimension === "period"
      ? analysis.breakdown.rows
      : [];
  const grouped = new Map<
    string,
    { key: string; label: string; points: number; count: number }
  >();
  rows.forEach((row) => {
    const current = grouped.get(row.key) ?? {
      key: row.key,
      label: row.label,
      points: 0,
      count: 0,
    };
    current.points += row.totalPoints;
    current.count += row.matchCount;
    grouped.set(row.key, current);
  });
  let total = 0;
  const months = [...grouped.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((row) => {
      total += row.points;
      return { ...row, cumulative: total };
    });
  if (!months.length)
    return (
      <EmptyState
        title="月別の成績がありません"
        description="対局結果が登録されると表示されます。"
      />
    );
  const axis = { fill: "var(--app-text-secondary)", fontSize: 10 };
  const chartMinWidth = Math.max(280, months.length * 54 + 50);
  const monthlyPointLabel = ({ value, viewBox }: LabelProps) => {
    if (
      typeof value !== "number" ||
      !viewBox ||
      !("x" in viewBox) ||
      !("y" in viewBox) ||
      !("width" in viewBox) ||
      typeof viewBox.x !== "number" ||
      typeof viewBox.y !== "number" ||
      typeof viewBox.width !== "number"
    )
      return null;
    return (
      <text
        x={viewBox.x + viewBox.width / 2}
        y={viewBox.y - 6}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill="var(--app-text)"
      >
        {formatStatisticsTrendPoints(value)}
      </text>
    );
  };
  const latestPointLabel = ({ index, value, viewBox }: LabelProps) => {
    if (
      index !== months.length - 1 ||
      typeof value !== "number" ||
      !viewBox ||
      !("x" in viewBox) ||
      !("y" in viewBox) ||
      typeof viewBox.x !== "number" ||
      typeof viewBox.y !== "number"
    )
      return null;
    return (
      <text
        x={viewBox.x - 4}
        y={viewBox.y - 8}
        textAnchor="end"
        fontSize={10}
        fontWeight={600}
        fill="var(--app-action-primary)"
      >
        {formatStatisticsTrendPoints(value)}
      </text>
    );
  };
  return (
    <section className="space-y-4" aria-label="成績推移">
      <Panel>
        <h2 className="text-app-label font-bold">月別の成績</h2>
        <p className="mt-1 text-app-caption text-app-text-secondary">
          月間ポイント
        </p>
        <div
          className="mt-3 overflow-x-auto"
          role="img"
          aria-label="月別の総合ポイントを示す棒グラフ"
        >
          <div className="h-48" style={{ minWidth: chartMinWidth }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={months}
                margin={{ top: 20, right: 5, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="var(--app-border-subtle)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={axis}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={axis}
                  width={35}
                  tickLine={false}
                  axisLine={false}
                  domain={getChartDomainIncludingZero(
                    months.map((month) => month.points)
                  )}
                />
                <ReferenceLine y={0} stroke="var(--app-border)" />
                <Tooltip
                  formatter={(value) =>
                    `${formatStatisticsTrendPoints(Number(value))} pt`
                  }
                />
                <Bar
                  dataKey="points"
                  isAnimationActive={false}
                  name="月間ポイント"
                  fill="var(--app-action-primary)"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={40}
                >
                  <LabelList dataKey="points" content={monthlyPointLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Panel>
      <Panel>
        <h2 className="text-app-label font-bold">累計ポイントの推移</h2>
        <p className="mt-1 text-app-caption text-app-text-secondary">
          月別の累計ポイント
        </p>
        <div
          className="mt-3 overflow-x-auto"
          role="img"
          aria-label="累計ポイントの折れ線グラフ"
        >
          <div className="h-48" style={{ minWidth: chartMinWidth }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={months}
                margin={{ top: 20, right: 5, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="var(--app-border-subtle)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={axis}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={axis}
                  width={35}
                  tickLine={false}
                  axisLine={false}
                  domain={getChartDomainIncludingZero(
                    months.map((month) => month.cumulative)
                  )}
                />
                <ReferenceLine y={0} stroke="var(--app-border)" />
                <Tooltip
                  formatter={(value) =>
                    `${formatStatisticsTrendPoints(Number(value))} pt`
                  }
                />
                <Line
                  dataKey="cumulative"
                  isAnimationActive={false}
                  name="累計ポイント"
                  stroke="var(--app-action-primary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                >
                  <LabelList dataKey="cumulative" content={latestPointLabel} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Panel>
      <Panel>
        <h2 className="text-app-heading-2 font-bold">月別実績</h2>
        <div className="mt-3 overflow-x-auto">
          <Table
            plain
            className="w-full min-w-[280px] text-left text-app-caption"
          >
            <thead className="text-app-text-secondary">
              <tr>
                <th className="pb-2">月</th>
                <th>対局</th>
                <th>月間pt</th>
                <th>累計pt</th>
              </tr>
            </thead>
            <tbody>
              {[...months].reverse().map((month) => (
                <tr
                  key={month.key}
                  className="border-b border-app-border-subtle last:border-0"
                >
                  <td className="py-3">{month.label}</td>
                  <td>{month.count}</td>
                  <td
                    className={
                      month.points > 0
                        ? "text-blue-600"
                        : month.points < 0
                          ? "text-app-danger"
                          : ""
                    }
                  >
                    {formatStatisticsTrendPoints(month.points)}
                  </td>
                  <td>{formatStatisticsTrendPoints(month.cumulative)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Panel>
    </section>
  );
};
