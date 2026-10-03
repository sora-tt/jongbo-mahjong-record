"use client";

import * as React from "react";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatStatisticsTrendNumber,
  formatStatisticsTrendPoints,
  formatStatisticsTrendRate,
  getStatisticsTrendModel,
} from "@/features/statistics/model/trend";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "@/components/ui/table";

import { StatisticsMetricCard } from "./StatisticsMetricCard";

import type {
  PersonalStatisticsAnalysisResponse,
  PersonalStatisticsSummaryResponse,
} from "@/features/statistics/api";

type TrendWindowSize = 10 | 20 | 50;
type GroupBy = "day" | "month" | "year";
type AnalysisBreakdown = Exclude<
  PersonalStatisticsAnalysisResponse,
  { status: "uncomputed" }
>["breakdown"];
type TemporalBreakdown = Extract<AnalysisBreakdown, { nextCursor: null }>;
type PeriodBreakdown = TemporalBreakdown & { dimension: "period" };
type CalendarBreakdown = TemporalBreakdown & {
  dimension: "weekday" | "timeOfDay";
};

type Props = {
  analysis: PersonalStatisticsAnalysisResponse;
  summary: PersonalStatisticsSummaryResponse | null;
  windowSize: TrendWindowSize;
  groupBy: GroupBy;
  scopeLabel?: string;
  onChangeWindowSize: (windowSize: TrendWindowSize) => void;
};

const formatGameType = (gameType: "sanma" | "yonma") =>
  gameType === "sanma" ? "三麻" : "四麻";

const formatTooltipValue: NonNullable<
  React.ComponentProps<typeof Tooltip>["formatter"]
> = (value) => {
  const singleValue = Array.isArray(value) ? value[0] : value;
  const numericValue =
    typeof singleValue === "number" ? singleValue : Number(singleValue);

  return Number.isFinite(numericValue)
    ? `${formatStatisticsTrendPoints(numericValue)} pt`
    : "未算出";
};

const formatGroupByLabel = (groupBy: GroupBy) => {
  if (groupBy === "month") return "月別";
  if (groupBy === "year") return "年別";
  return "日別";
};

const ProgressionChart: React.FC<{
  points: ReturnType<typeof getStatisticsTrendModel>["progression"];
  windowSize: TrendWindowSize;
}> = ({ points, windowSize }) => {
  const chartData = points.map((point) => ({
    displayOrder: point.displayOrder,
    cumulativePoint: point.cumulativePoint,
  }));

  return (
    <Card
      title="累計最終ポイントの推移"
      meta={`単位: pt / 直近${windowSize}戦の範囲`}
    >
      <p className="mb-3 text-xs text-text-muted">
        横軸は表示順、縦軸は対象期間の開始からの累計最終ポイントです。グラフ上でポイントを移動すると値を確認できます。
      </p>
      <div className="mb-3 flex items-center gap-2 text-xs text-text-muted">
        <span aria-hidden="true" className="h-0.5 w-5 bg-brand-strong" />
        <span>累計最終ポイント（pt）</span>
      </div>
      <div
        aria-label="累計最終ポイントの推移グラフ。キーボードでも各対局の値を確認できます。"
        className="h-[240px] w-full"
        role="region"
        tabIndex={0}
      >
        <ResponsiveContainer>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 12, right: 16, left: 4, bottom: 4 }}
          >
            <CartesianGrid
              stroke="var(--color-border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="displayOrder"
              tickFormatter={(value: number) => `${value}`}
              tickLine={false}
              axisLine={{ stroke: "var(--color-brand-300)" }}
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) =>
                `${formatStatisticsTrendNumber(value)}pt`
              }
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
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
              labelFormatter={(label) => `表示順 ${label}`}
            />
            <Legend />
            <Line
              dataKey="cumulativePoint"
              name="累計最終ポイント"
              type="linear"
              stroke="var(--color-brand-strong)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--color-brand-strong)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div
        aria-label="累計最終ポイントの数値一覧"
        className="mt-4"
        role="region"
        tabIndex={0}
      >
        <Table caption="表示順ごとの日時、セッション内対局順、最終ポイントと累計最終ポイント">
          <TableHead>
            <TableRow>
              <TableHeadCell>表示順</TableHeadCell>
              <TableHeadCell>日時（日本時間）</TableHeadCell>
              <TableHeadCell>セッション内順</TableHeadCell>
              <TableHeadCell>当該対局pt</TableHeadCell>
              <TableHeadCell>累計pt</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {points.map((point) => (
              <TableRow key={point.matchId}>
                <TableCell>{point.displayOrder}</TableCell>
                <TableCell>{point.playedAtLabel}</TableCell>
                <TableCell>{point.matchIndex}</TableCell>
                <TableCell>
                  {formatStatisticsTrendPoints(point.point)} pt
                </TableCell>
                <TableCell>
                  {formatStatisticsTrendPoints(point.cumulativePoint)} pt
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

const RecentResultCard: React.FC<{
  summary: PersonalStatisticsSummaryResponse | null;
  windowSize: TrendWindowSize;
}> = ({ summary, windowSize }) => {
  const result =
    summary && summary.status !== "uncomputed"
      ? summary.recentResults.find((item) => item.windowSize === windowSize)
      : null;
  const isUncomputed = !summary || summary.status === "uncomputed";

  return (
    <Card
      title={`直近${windowSize}戦の成績`}
      meta={result ? `${result.matchCount}/${windowSize}対局` : "集計なし"}
    >
      <p className="mb-3 text-xs text-text-muted">
        全体成績とは別に、選択条件内の新しい側から最大{windowSize}
        対局を集計しています。
      </p>
      {isUncomputed ? (
        <p className="text-sm text-text-muted">
          統計の集計が完了すると、直近成績を表示します。
        </p>
      ) : result ? (
        result.matchCount > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatisticsMetricCard
                label="対象対局数"
                value={result.matchCount}
                unit="局"
                description={`直近${windowSize}局の範囲`}
              />
              <StatisticsMetricCard
                label="総合ポイント"
                value={formatStatisticsTrendPoints(result.totalPoints)}
                unit="pt"
                description={`直近${windowSize}局の合計`}
              />
            </div>
            {result.byGameType.length > 0 ? (
              <div className="mt-4 space-y-3">
                {result.byGameType.map((format) => (
                  <dl
                    key={format.gameType}
                    className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-control border border-border p-3 text-sm"
                  >
                    <dt className="col-span-2 font-semibold text-foreground">
                      {formatGameType(format.gameType)}
                    </dt>
                    <dt className="text-text-muted">平均順位</dt>
                    <dd className="text-right text-foreground">
                      {format.averageRank === null
                        ? "未算出"
                        : `${formatStatisticsTrendNumber(format.averageRank)}位`}
                    </dd>
                    <dt className="text-text-muted">トップ率</dt>
                    <dd className="text-right text-foreground">
                      {formatStatisticsTrendRate(format.topRate)}
                    </dd>
                  </dl>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-text-muted">
            この対象範囲には対局結果がありません。
          </p>
        )
      ) : (
        <p className="text-sm text-text-muted">
          この対象範囲の直近成績はありません。
        </p>
      )}
    </Card>
  );
};

const formatRankCounts = (
  rankCounts: ReadonlyArray<{ rank: number; count: number }>
) =>
  rankCounts.length > 0
    ? rankCounts.map(({ rank, count }) => `${rank}位 ${count}回`).join(" / ")
    : "—";

const PeriodBreakdownCard: React.FC<{
  breakdown: PeriodBreakdown;
  groupBy: GroupBy;
}> = ({ breakdown, groupBy }) => (
  <Card title={`${formatGroupByLabel(groupBy)}の成績`}>
    {breakdown.rows.length > 0 ? (
      <div
        aria-label={`${formatGroupByLabel(groupBy)}成績の表。横にスクロールできます。`}
        className="-mx-2 overflow-x-auto px-2"
        role="region"
        tabIndex={0}
      >
        <Table
          caption={`${formatGroupByLabel(groupBy)}、ゲーム形式別の対局数、総ポイント、平均順位、トップ率と順位回数`}
        >
          <TableHead>
            <TableRow>
              <TableHeadCell>{formatGroupByLabel(groupBy)}</TableHeadCell>
              <TableHeadCell>形式</TableHeadCell>
              <TableHeadCell>対局数（分母）</TableHeadCell>
              <TableHeadCell>総合pt</TableHeadCell>
              <TableHeadCell>平均順位</TableHeadCell>
              <TableHeadCell>トップ率</TableHeadCell>
              <TableHeadCell>順位内訳（回）</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {breakdown.rows.map((row) => (
              <TableRow key={`${row.key}-${row.gameType}`}>
                <TableCell>{row.label}</TableCell>
                <TableCell>{formatGameType(row.gameType)}</TableCell>
                <TableCell>{`${row.matchCount}局（${row.denominator}局）`}</TableCell>
                <TableCell>
                  {formatStatisticsTrendPoints(row.totalPoints)} pt
                </TableCell>
                <TableCell>
                  {row.averageRank === null
                    ? "未算出"
                    : `${formatStatisticsTrendNumber(row.averageRank)}位`}
                </TableCell>
                <TableCell>{formatStatisticsTrendRate(row.topRate)}</TableCell>
                <TableCell>{formatRankCounts(row.rankCounts)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    ) : (
      <p className="text-sm text-text-muted">
        選択した条件に該当する期間成績はありません。
      </p>
    )}
  </Card>
);

const CalendarBreakdownCard: React.FC<{
  breakdown: CalendarBreakdown;
}> = ({ breakdown }) => {
  const title =
    breakdown.dimension === "weekday" ? "曜日別成績" : "時間帯別成績";

  return (
    <Card title={title}>
      {breakdown.rows.length > 0 ? (
        <div
          aria-label={`${title}の表。横にスクロールできます。`}
          className="-mx-2 overflow-x-auto px-2"
          role="region"
          tabIndex={0}
        >
          <Table
            caption={`${title}、ゲーム形式別の対局数、総ポイント、平均順位とトップ率`}
          >
            <TableHead>
              <TableRow>
                <TableHeadCell>
                  {breakdown.dimension === "weekday" ? "曜日" : "時間帯"}
                </TableHeadCell>
                <TableHeadCell>形式</TableHeadCell>
                <TableHeadCell>対局数（分母）</TableHeadCell>
                <TableHeadCell>総合pt</TableHeadCell>
                <TableHeadCell>平均順位</TableHeadCell>
                <TableHeadCell>トップ率</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {breakdown.rows.map((row) => (
                <TableRow key={`${row.key}-${row.gameType}`}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell>{formatGameType(row.gameType)}</TableCell>
                  <TableCell>{`${row.matchCount}局（${row.denominator}局）`}</TableCell>
                  <TableCell>
                    {formatStatisticsTrendPoints(row.totalPoints)} pt
                  </TableCell>
                  <TableCell>
                    {row.averageRank === null
                      ? "未算出"
                      : `${formatStatisticsTrendNumber(row.averageRank)}位`}
                  </TableCell>
                  <TableCell>
                    {formatStatisticsTrendRate(row.topRate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-text-muted">
          選択した条件に該当する{title}はありません。
        </p>
      )}
    </Card>
  );
};

const SelectedCalendarBreakdown: React.FC<{
  breakdown: ReturnType<typeof getStatisticsTrendModel>["breakdown"];
  groupBy: GroupBy;
}> = ({ breakdown, groupBy }) => {
  if (!breakdown) return null;
  if (breakdown.dimension === "period") {
    return (
      <PeriodBreakdownCard
        breakdown={{ ...breakdown, dimension: "period" }}
        groupBy={groupBy}
      />
    );
  }
  if (
    breakdown.dimension === "weekday" ||
    breakdown.dimension === "timeOfDay"
  ) {
    return (
      <CalendarBreakdownCard
        breakdown={{ ...breakdown, dimension: breakdown.dimension }}
      />
    );
  }
  return null;
};

const toTrendWindowSize = (value: string): TrendWindowSize | null => {
  if (value === "10") return 10;
  if (value === "20") return 20;
  if (value === "50") return 50;
  return null;
};

export const StatisticsTrend: React.FC<Props> = ({
  analysis,
  summary,
  windowSize,
  groupBy,
  scopeLabel,
  onChangeWindowSize,
}) => {
  const model = getStatisticsTrendModel({
    analysis,
    summary,
    windowSize,
    scopeLabel,
  });
  return (
    <section aria-labelledby="statistics-trend-heading" className="space-y-4">
      <h2
        id="statistics-trend-heading"
        className="text-xl font-bold text-foreground"
      >
        成績推移
      </h2>
      <p className="text-sm text-text-muted">対象条件: {model.contextLabel}</p>
      <Select
        label="推移・直近成績の表示範囲"
        aria-label="推移・直近成績の表示範囲"
        value={String(windowSize)}
        onChange={(event) => {
          const value = toTrendWindowSize(event.target.value);
          if (value !== null) onChangeWindowSize(value);
        }}
        className="min-h-11 focus-visible:ring-2 focus-visible:ring-focus"
      >
        <option value="10">直近10戦</option>
        <option value="20">直近20戦</option>
        <option value="50">直近50戦</option>
      </Select>

      {analysis.status === "uncomputed" ? (
        <EmptyState
          title="推移はまだ集計されていません"
          description="統計の再計算が完了すると、対局順のポイント推移を表示します。"
        />
      ) : model.displayMode === "chart" ? (
        <ProgressionChart points={model.progression} windowSize={windowSize} />
      ) : (
        <Card title="ポイント推移の概要" meta={`直近${windowSize}戦`}>
          <p className="mb-3 text-sm text-text-muted">
            グラフ表示には4対局分の推移が必要です。現在の範囲は
            {model.progression.length}対局のため、数値の概要を表示します。
          </p>
          {!summary || summary.status === "uncomputed" ? (
            <p className="text-sm text-text-muted">
              統計の集計が完了すると、ポイントの概要を表示します。
            </p>
          ) : model.selectedRecentResult &&
            model.selectedRecentResult.matchCount > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              <StatisticsMetricCard
                label="対象対局数"
                value={model.selectedRecentResult.matchCount}
                unit="局"
              />
              <StatisticsMetricCard
                label="総合ポイント"
                value={formatStatisticsTrendPoints(
                  model.selectedRecentResult.totalPoints
                )}
                unit="pt"
              />
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              この条件に該当する対局結果はありません。
            </p>
          )}
        </Card>
      )}

      <RecentResultCard summary={summary} windowSize={windowSize} />
      <SelectedCalendarBreakdown
        breakdown={model.breakdown}
        groupBy={groupBy}
      />
    </section>
  );
};
