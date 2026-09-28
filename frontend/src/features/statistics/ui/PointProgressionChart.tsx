"use client";

import * as React from "react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { toPointProgressionChart } from "@/features/statistics/model/adapter";

type ChartData = ReturnType<typeof toPointProgressionChart>["data"];
type ChartSeries = ReturnType<
  typeof toPointProgressionChart
>["series"][number] & {
  colorClassName: string;
  strokeColor: string;
};

type Props = {
  data: ChartData;
  series: ReadonlyArray<ChartSeries>;
  height?: number | string;
};

const formatPoint = (value: number | null | undefined) =>
  typeof value === "number" ? `${value.toFixed(1)}pt` : "-";

const formatTooltipValue: NonNullable<
  React.ComponentProps<typeof Tooltip>["formatter"]
> = (value) => {
  const singleValue = Array.isArray(value) ? value[0] : value;
  const numericValue =
    typeof singleValue === "number" ? singleValue : Number(singleValue);

  return Number.isFinite(numericValue) ? formatPoint(numericValue) : "-";
};

export const PointProgressionChart: React.FC<Props> = ({
  data,
  series,
  height = "clamp(200px, 38vw, 280px)",
}) => (
  <div style={{ width: "100%", height }}>
    <ResponsiveContainer>
      <LineChart
        data={data}
        margin={{ top: 16, right: 20, left: 8, bottom: 4 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis
          dataKey="matchIndex"
          tickLine={false}
          axisLine={{ stroke: "var(--color-brand-300)" }}
          tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
          tickFormatter={(value: number) => formatPoint(value)}
        />
        <ReferenceLine
          y={0}
          stroke="var(--color-text-muted)"
          strokeDasharray="4 4"
        />
        <Tooltip
          contentStyle={{
            borderColor: "var(--color-brand-300)",
            borderRadius: "var(--radius-control)",
            fontSize: "12px",
          }}
          formatter={formatTooltipValue}
          labelFormatter={(label) => `対局 ${label}`}
        />
        {series.map((item) => (
          <Line
            key={String(item.userId)}
            type="monotone"
            dataKey={String(item.userId)}
            name={item.userName}
            stroke={item.strokeColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </div>
);
