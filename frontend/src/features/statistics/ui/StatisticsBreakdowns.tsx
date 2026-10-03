"use client";

import * as React from "react";

import {
  formatStatisticsBreakdownFormatCount,
  formatStatisticsBreakdownMatchCount,
  getStatisticsBreakdownModel,
  statisticsBreakdownDimensions,
  statisticsBreakdownGroupings,
} from "@/features/statistics/model/breakdowns";
import {
  formatStatisticsTrendNumber,
  formatStatisticsTrendPoints,
  formatStatisticsTrendRate,
} from "@/features/statistics/model/trend";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "@/components/ui/table";

import type { PersonalStatisticsAnalysisResponse } from "@/features/statistics/api";
import type {
  StatisticsBreakdown,
  StatisticsBreakdownDimension,
  StatisticsBreakdownGroupBy,
} from "@/features/statistics/model/breakdowns";

type FixedBreakdown = Extract<StatisticsBreakdown, { nextCursor: null }>;
type OpponentBreakdown = Extract<
  StatisticsBreakdown,
  { dimension: "opponent" }
>;
type SessionBreakdown = Extract<StatisticsBreakdown, { dimension: "session" }>;

type Props = {
  analysis: PersonalStatisticsAnalysisResponse | null;
  dimension: StatisticsBreakdownDimension;
  groupBy: StatisticsBreakdownGroupBy;
  subjectLabel?: string;
  scopeLabel?: string;
  loadingMore?: boolean;
  onChangeDimension: (dimension: StatisticsBreakdownDimension) => void;
  onChangeGroupBy: (groupBy: StatisticsBreakdownGroupBy) => void;
  onLoadMore: (cursor: string) => void;
};

const gameTypeLabels = {
  sanma: "三麻",
  yonma: "四麻",
} as const;

const formatGameType = (gameType: "sanma" | "yonma") =>
  gameTypeLabels[gameType];

const formatRankCounts = (
  rankCounts: FixedBreakdown["rows"][number]["rankCounts"]
) =>
  rankCounts.length > 0
    ? rankCounts.map(({ rank, count }) => `${rank}位 ${count}回`).join(" / ")
    : "—";

const formatRateWithDenominator = (
  rate: number | null,
  numerator: number | null,
  denominator: number,
  unit: string
) => {
  const rateLabel = formatStatisticsTrendRate(rate);
  const countLabel =
    numerator === null
      ? `分母 ${denominator}${unit}`
      : `${numerator}/${denominator}${unit}`;

  return `${rateLabel}（${countLabel}）`;
};

const FixedBreakdownTable: React.FC<{
  breakdown: FixedBreakdown;
  title: string;
}> = ({ breakdown, title }) => (
  <div
    aria-label={`${title}の表。横にスクロールできます。`}
    className="-mx-2 overflow-x-auto px-2"
    role="region"
    tabIndex={0}
  >
    <Table
      caption={`${title}、形式、対局数、分母、総合ポイント、平均順位、トップ率、平均最終ポイント、順位回数`}
    >
      <TableHead>
        <TableRow>
          <TableHeadCell>対象</TableHeadCell>
          <TableHeadCell>形式</TableHeadCell>
          <TableHeadCell>対局数（分母）</TableHeadCell>
          <TableHeadCell>総合pt</TableHeadCell>
          <TableHeadCell>平均順位</TableHeadCell>
          <TableHeadCell>トップ率（件数/分母）</TableHeadCell>
          <TableHeadCell>平均最終pt</TableHeadCell>
          <TableHeadCell>順位内訳（回）</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {breakdown.rows.map((row) => (
          <TableRow key={`${row.key}-${row.gameType}`}>
            <TableCell>{row.label}</TableCell>
            <TableCell>{formatGameType(row.gameType)}</TableCell>
            <TableCell>{`${formatStatisticsBreakdownMatchCount(row.matchCount)}（分母 ${formatStatisticsBreakdownMatchCount(row.denominator)}）`}</TableCell>
            <TableCell>{`${formatStatisticsTrendPoints(row.totalPoints)} pt`}</TableCell>
            <TableCell>
              {row.averageRank === null
                ? "未算出"
                : `${formatStatisticsTrendNumber(row.averageRank)}位`}
            </TableCell>
            <TableCell>
              {formatRateWithDenominator(
                row.topRate,
                row.rankCounts.find(({ rank }) => rank === 1)?.count ?? null,
                row.denominator,
                "対局"
              )}
            </TableCell>
            <TableCell>{`${formatStatisticsTrendPoints(row.averageFinalPoint)} pt`}</TableCell>
            <TableCell>{formatRankCounts(row.rankCounts)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const OpponentBreakdownTable: React.FC<{
  breakdown: OpponentBreakdown;
}> = ({ breakdown }) => (
  <div
    aria-label="対戦相手別成績の表。横にスクロールできます。"
    className="-mx-2 overflow-x-auto px-2"
    role="region"
    tabIndex={0}
  >
    <Table caption="対戦相手、形式、同卓回数、上位率と分母、同順位回数、累計および平均ポイント差">
      <TableHead>
        <TableRow>
          <TableHeadCell>対戦相手</TableHeadCell>
          <TableHeadCell>形式</TableHeadCell>
          <TableHeadCell>同卓回数（分母）</TableHeadCell>
          <TableHeadCell>相手より上位（率/分母）</TableHeadCell>
          <TableHeadCell>同順位</TableHeadCell>
          <TableHeadCell>累計ポイント差</TableHeadCell>
          <TableHeadCell>平均ポイント差</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {breakdown.rows.map((row) => (
          <TableRow key={`${row.userId}-${row.gameType}`}>
            <TableCell>{row.userName}</TableCell>
            <TableCell>{formatGameType(row.gameType)}</TableCell>
            <TableCell>{`${row.encounterCount}回（分母 ${row.encounterCount}回）`}</TableCell>
            <TableCell>
              {formatRateWithDenominator(
                row.aboveRate,
                null,
                row.encounterCount,
                "回"
              )}
            </TableCell>
            <TableCell>{`${row.tieCount}回`}</TableCell>
            <TableCell>{`${formatStatisticsTrendPoints(row.totalPointDifference)} pt`}</TableCell>
            <TableCell>{`${formatStatisticsTrendPoints(row.averagePointDifference)} pt`}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const SessionBreakdownTable: React.FC<{
  breakdown: SessionBreakdown;
}> = ({ breakdown }) => (
  <div
    aria-label="セッション別成績の表。横にスクロールできます。"
    className="-mx-2 overflow-x-auto px-2"
    role="region"
    tabIndex={0}
  >
    <Table caption="セッション名、形式ごとの平均順位とトップ回数、対局数、総合ポイント">
      <TableHead>
        <TableRow>
          <TableHeadCell>セッション</TableHeadCell>
          <TableHeadCell>形式別成績</TableHeadCell>
          <TableHeadCell>対局数</TableHeadCell>
          <TableHeadCell>総合pt</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {breakdown.rows.map((row) => (
          <TableRow key={row.sessionId}>
            <TableCell>{row.label}</TableCell>
            <TableCell className="min-w-48 text-left">
              <ul className="space-y-1">
                {row.averageRankByGameType.map((format) => {
                  const topCount = row.topCountByGameType.find(
                    ({ gameType }) => gameType === format.gameType
                  )?.count;

                  return (
                    <li key={format.gameType}>
                      {formatStatisticsBreakdownFormatCount(
                        format.gameType,
                        format.matchCount
                      )}
                      : 平均順位{" "}
                      {format.averageRank === null
                        ? "未算出"
                        : `${formatStatisticsTrendNumber(format.averageRank)}位`}
                      {`, トップ ${topCount ?? "未算出"}回`}
                    </li>
                  );
                })}
                {row.averageRankByGameType.length === 0 &&
                row.topCountByGameType.length === 0 ? (
                  <li>形式別成績はありません</li>
                ) : null}
              </ul>
            </TableCell>
            <TableCell>
              {formatStatisticsBreakdownMatchCount(row.matchCount)}
            </TableCell>
            <TableCell>{`${formatStatisticsTrendPoints(row.totalPoints)} pt`}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const BreakdownTable: React.FC<{
  breakdown: StatisticsBreakdown;
  title: string;
}> = ({ breakdown, title }) => {
  if (breakdown.dimension === "opponent") {
    return <OpponentBreakdownTable breakdown={breakdown} />;
  }
  if (breakdown.dimension === "session") {
    return <SessionBreakdownTable breakdown={breakdown} />;
  }
  return <FixedBreakdownTable breakdown={breakdown} title={title} />;
};

export const StatisticsBreakdowns: React.FC<Props> = ({
  analysis,
  dimension,
  groupBy,
  subjectLabel,
  scopeLabel,
  loadingMore = false,
  onChangeDimension,
  onChangeGroupBy,
  onLoadMore,
}) => {
  const model = getStatisticsBreakdownModel({
    analysis,
    dimension,
    groupBy,
    subjectLabel,
    scopeLabel,
  });
  const tableHasRows =
    model.breakdown !== null && model.breakdown.rows.length > 0;

  return (
    <Card title={model.title}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label="切り口"
            value={dimension}
            onChange={(event) =>
              onChangeDimension(
                event.currentTarget.value as StatisticsBreakdownDimension
              )
            }
            className="min-h-11 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            {statisticsBreakdownDimensions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {dimension === "period" ? (
            <Select
              label="期間の単位"
              value={groupBy}
              onChange={(event) =>
                onChangeGroupBy(
                  event.currentTarget.value as StatisticsBreakdownGroupBy
                )
              }
              className="min-h-11 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              {statisticsBreakdownGroupings.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          ) : null}
        </div>

        <p className="text-xs text-text-muted" aria-live="polite">
          表示対象・範囲: {model.contextLabel}
        </p>

        {model.status === "loading" ? (
          <p
            className="rounded-control border border-border bg-surface-muted p-3 text-sm text-text-muted"
            role="status"
          >
            選択した条件の成績を読み込んでいます。
          </p>
        ) : model.status === "uncomputed" ? (
          <p
            className="rounded-control border border-border bg-surface-muted p-3 text-sm text-text-muted"
            role="status"
          >
            この対象範囲の統計はまだ集計されていません。
          </p>
        ) : model.status === "empty" ? (
          <p
            className="rounded-control border border-border bg-surface-muted p-3 text-sm text-text-muted"
            role="status"
          >
            この対象範囲には対局結果がありません。
          </p>
        ) : tableHasRows && model.breakdown ? (
          <BreakdownTable breakdown={model.breakdown} title={model.title} />
        ) : (
          <p
            className="rounded-control border border-border bg-surface-muted p-3 text-sm text-text-muted"
            role="status"
          >
            選択した条件に該当する成績はありません。
          </p>
        )}

        {model.status === "ready" &&
        model.nextCursor !== null &&
        (model.breakdown?.dimension === "opponent" ||
          model.breakdown?.dimension === "session") ? (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            loading={loadingMore}
            onClick={() => onLoadMore(model.nextCursor as string)}
            className="min-h-11"
          >
            さらに読み込む
          </Button>
        ) : null}
      </div>
    </Card>
  );
};
