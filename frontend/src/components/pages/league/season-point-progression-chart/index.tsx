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

type SeasonPointProgressionChartSeries = {
  userId: string;
  userName: string;
  strokeColor: string;
};

type SeasonPointProgressionChartData = {
  matchIndex: number;
  [userId: string]: number;
};

type Props = {
  data: SeasonPointProgressionChartData[];
  series: SeasonPointProgressionChartSeries[];
  height?: number | string;
};

const formatPoint = (value: number) => `${value.toFixed(1)}pt`;

const formatTooltipValue: NonNullable<
  React.ComponentProps<typeof Tooltip>["formatter"]
> = (value) => {
  const singleValue = Array.isArray(value) ? value[0] : value;
  const numericValue =
    typeof singleValue === "number" ? singleValue : Number(singleValue);

  return Number.isFinite(numericValue) ? formatPoint(numericValue) : "-";
};

export const SeasonPointProgressionChart: React.FC<Props> = ({
  data,
  series,
  height = "clamp(200px, 38vw, 280px)",
}) => {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 16, right: 20, left: 8, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f6b6c4"
            vertical={false}
          />
          <XAxis
            dataKey="matchIndex"
            tickLine={false}
            axisLine={{ stroke: "#f2a5b6" }}
            tick={{ fill: "#6b7280", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickFormatter={(value: number) => formatPoint(value)}
          />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />
          <Tooltip
            contentStyle={{
              borderColor: "#f2a5b6",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={formatTooltipValue}
            labelFormatter={(label) => `対局 ${label}`}
          />

          {series.map((item) => (
            <Line
              key={item.userId}
              type="monotone"
              dataKey={item.userId}
              name={item.userName}
              stroke={item.strokeColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
