import * as React from "react";

import {
  formatStatisticsOverviewRate,
  getStatisticsOverviewModel,
  getStatisticsOverviewRateBarWidth,
  getVisibleStatisticsRanks,
} from "@/features/statistics/model/overview";
import { getStatisticsSignedValueTextClass } from "@/features/statistics/model/signed-value";

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

import type { PersonalStatisticsSummaryResponse } from "@/features/statistics/api";

type ComputedSummary = Exclude<
  PersonalStatisticsSummaryResponse,
  { status: "uncomputed" }
>;
type FormatSummary = ComputedSummary["byGameType"][number];

type Props = {
  summary: ComputedSummary;
};

const getGameTypeLabel = (gameType: FormatSummary["gameType"]) =>
  gameType === "sanma" ? "三麻" : "四麻";

const RankDistribution: React.FC<{
  format: FormatSummary;
  showGameType: boolean;
}> = ({ format, showGameType }) => {
  const ranks = getVisibleStatisticsRanks(format.gameType, format.ranks);
  const title = showGameType
    ? `${getGameTypeLabel(format.gameType)}の順位分布`
    : "順位分布";

  return (
    <Card title={title} meta={`${format.matchCount}対局`}>
      {ranks.length > 0 ? (
        <>
          <div className="space-y-3" aria-hidden="true">
            {ranks.map((rank) => {
              const barWidth = getStatisticsOverviewRateBarWidth(rank.rate);
              return (
                <div
                  key={rank.rank}
                  className="grid grid-cols-[2.5rem_minmax(0,1fr)_3.5rem] items-center gap-2"
                >
                  <span className="text-xs font-medium text-text-muted">
                    {rank.rank}位
                  </span>
                  {barWidth !== null ? (
                    <div className="h-3 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-brand-strong"
                        style={{ width: barWidth }}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted">—</span>
                  )}
                  <span className="text-right text-xs font-medium text-foreground">
                    {formatStatisticsOverviewRate(rank.rate)}
                  </span>
                </div>
              );
            })}
          </div>
          <Table caption={`${title}の対局数と割合`}>
            <TableHead>
              <TableRow>
                <TableHeadCell>順位</TableHeadCell>
                <TableHeadCell>回数</TableHeadCell>
                <TableHeadCell>割合</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ranks.map((rank) => (
                <TableRow key={rank.rank}>
                  <TableCell>{rank.rank}位</TableCell>
                  <TableCell>{rank.count}回</TableCell>
                  <TableCell>
                    {formatStatisticsOverviewRate(rank.rate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : (
        <p className="text-sm text-text-muted">順位データはありません。</p>
      )}
    </Card>
  );
};

export const StatisticsOverview: React.FC<Props> = ({ summary }) => {
  const overview = getStatisticsOverviewModel(summary);
  const formats = overview.formatPriorities;
  const totalPoints = summary.totals.totalPoints;
  const matchCount = summary.totals.totalMatchCount;
  const showGameType =
    summary.scope.scopeType === "overall" && summary.scope.gameType === "all";

  if (summary.status === "empty") {
    return (
      <section
        aria-labelledby="statistics-overview-heading"
        className="space-y-4"
      >
        <h2
          id="statistics-overview-heading"
          className="text-xl font-bold text-foreground"
        >
          総合
        </h2>
        <EmptyState
          title="対局結果がありません"
          description="対局結果が登録されると、総合ポイントや順位分布を表示します。"
        />
      </section>
    );
  }

  return (
    <section
      aria-labelledby="statistics-overview-heading"
      className="space-y-4"
    >
      <h2
        id="statistics-overview-heading"
        className="text-xl font-bold text-foreground"
      >
        総合
      </h2>

      <Card title="総合ポイント" meta={`${matchCount}対局`}>
        <p
          className={`text-4xl font-bold leading-tight ${getStatisticsSignedValueTextClass(totalPoints)}`}
        >
          {overview.primaryTotals.find((metric) => metric.id === "total-points")
            ?.value ?? "—"}
          <span className="ml-2 text-base font-semibold text-text-muted">
            pt
          </span>
        </p>
        <p className="mt-2 text-sm text-text-muted">
          全{matchCount}対局の合計ポイント
        </p>
      </Card>

      {overview.formatDetails.map((format) => (
        <RankDistribution
          key={format.gameType}
          format={format}
          showGameType={showGameType}
        />
      ))}

      {formats.length > 0 ? (
        <Card title="順位成績" meta={`${matchCount}対局`}>
          <div className="space-y-4">
            {formats.map((format) => {
              const details = overview.formatDetails.find(
                (detail) => detail.gameType === format.gameType
              );
              return (
                <section
                  key={format.gameType}
                  aria-label={
                    showGameType ? getGameTypeLabel(format.gameType) : undefined
                  }
                  className="space-y-2"
                >
                  {showGameType ? (
                    <h3 className="text-xs font-medium text-text-muted">
                      {getGameTypeLabel(format.gameType)}・{format.matchCount}局
                    </h3>
                  ) : null}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-control bg-surface-muted px-2 py-3">
                      <p className="text-xs text-text-muted">平均順位</p>
                      <p className="mt-1 text-lg font-bold text-foreground">
                        {format.averageRank}
                        <span className="ml-1 text-xs font-medium text-text-muted">
                          位
                        </span>
                      </p>
                    </div>
                    <div className="rounded-control bg-surface-muted px-2 py-3">
                      <p className="text-xs text-text-muted">トップ率</p>
                      <p className="mt-1 text-lg font-bold text-foreground">
                        {format.topRate}
                      </p>
                    </div>
                    <div className="rounded-control bg-surface-muted px-2 py-3">
                      <p className="text-xs text-text-muted">連対率</p>
                      <p className="mt-1 text-lg font-bold text-foreground">
                        {formatStatisticsOverviewRate(
                          details?.topTwoRate ?? null
                        )}
                      </p>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </Card>
      ) : null}
    </section>
  );
};
