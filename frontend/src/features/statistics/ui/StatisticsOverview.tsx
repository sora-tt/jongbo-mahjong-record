import * as React from "react";

import {
  formatStatisticsOverviewNumber,
  formatStatisticsOverviewPoints,
  formatStatisticsOverviewRate,
  getStatisticsOverviewModel,
  getStatisticsOverviewRateBarWidth,
  getStatisticsStandingSourceLabel,
  getVisibleStatisticsRanks,
} from "@/features/statistics/model/overview";

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

import { StatisticsMetricCard } from "./StatisticsMetricCard";

import type { PersonalStatisticsSummaryResponse } from "@/features/statistics/api";

type ComputedSummary = Exclude<
  PersonalStatisticsSummaryResponse,
  { status: "uncomputed" }
>;
type FormatSummary = ComputedSummary["byGameType"][number];
type CurrentStanding = NonNullable<ComputedSummary["currentStanding"]>;

type Props = {
  summary: ComputedSummary;
};

const getGameTypeLabel = (gameType: FormatSummary["gameType"]) =>
  gameType === "sanma" ? "三麻" : "四麻";

const getScopeLabel = (scopeType: ComputedSummary["scope"]["scopeType"]) => {
  if (scopeType === "league") return "リーグ";
  if (scopeType === "season") return "シーズン";
  return "全体";
};

const RankDistribution: React.FC<{ format: FormatSummary }> = ({ format }) => {
  const ranks = getVisibleStatisticsRanks(format.gameType, format.ranks);
  const gameTypeLabel = getGameTypeLabel(format.gameType);

  return (
    <Card
      title={`${gameTypeLabel}の順位別成績`}
      meta={`割合の分母: ${format.matchCount}対局`}
    >
      {ranks.length > 0 ? (
        <>
          <div aria-hidden="true" className="space-y-3">
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
                  <span className="text-right text-xs text-text-muted">
                    {formatStatisticsOverviewRate(rank.rate)}
                  </span>
                </div>
              );
            })}
          </div>
          <Table caption={`${gameTypeLabel}の順位別成績`}>
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
        <p className="text-sm text-text-muted">
          この形式の順位データはありません。
        </p>
      )}
    </Card>
  );
};

const FormatSummaryCard: React.FC<{ format: FormatSummary }> = ({ format }) => {
  const gameTypeLabel = getGameTypeLabel(format.gameType);
  const denominatorDescription = `分母: ${format.matchCount}対局`;

  return (
    <section
      aria-label={`${gameTypeLabel}の追加順位指標`}
      className="space-y-4"
    >
      <h3 className="font-semibold text-foreground">
        {gameTypeLabel}の追加順位指標
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <StatisticsMetricCard
          label="連対率"
          value={formatStatisticsOverviewRate(format.topTwoRate)}
          description={denominatorDescription}
        />
        {format.gameType === "yonma" ? (
          <StatisticsMetricCard
            label="3着以内率"
            value={formatStatisticsOverviewRate(format.topThreeRate)}
            description={denominatorDescription}
          />
        ) : null}
        <StatisticsMetricCard
          label="ラス率"
          value={formatStatisticsOverviewRate(format.lastRate)}
          description={denominatorDescription}
        />
        <StatisticsMetricCard
          label="ラス回避率"
          value={formatStatisticsOverviewRate(format.lastAvoidanceRate)}
          description={denominatorDescription}
        />
      </div>
    </section>
  );
};

const StandingValue: React.FC<{
  label: string;
  value: React.ReactNode;
}> = ({ label, value }) => (
  <div>
    <dt className="text-sm text-text-muted">{label}</dt>
    <dd className="mt-1 font-semibold text-foreground">{value}</dd>
  </div>
);

const CurrentStandingCard: React.FC<{ standing: CurrentStanding }> = ({
  standing,
}) => {
  const sourceLabel = getStatisticsStandingSourceLabel(standing.source);

  return (
    <Card title="スコープ順位" meta={sourceLabel}>
      <dl className="grid grid-cols-2 gap-4">
        <StandingValue label="順位" value={`${standing.rank}位`} />
        <StandingValue
          label="総合ポイント"
          value={`${formatStatisticsOverviewPoints(standing.totalPoints)} pt`}
        />
        <StandingValue
          label="直上との差"
          value={
            standing.pointsBehindAbove === null
              ? "—"
              : `${formatStatisticsOverviewNumber(standing.pointsBehindAbove)} pt`
          }
        />
        <StandingValue
          label="直下との差"
          value={
            standing.pointsAheadBelow === null
              ? "—"
              : `${formatStatisticsOverviewNumber(standing.pointsAheadBelow)} pt`
          }
        />
      </dl>
      <p className="mt-3 text-xs text-text-muted">
        {sourceLabel}
        の総合ランキングです。期間・形式フィルターは適用されません。
      </p>
    </Card>
  );
};

export const StatisticsOverview: React.FC<Props> = ({ summary }) => {
  const overview = getStatisticsOverviewModel(summary);

  return (
    <section
      aria-labelledby="statistics-overview-heading"
      className="space-y-4"
    >
      <h2
        id="statistics-overview-heading"
        className="text-xl font-bold text-foreground"
      >
        概要
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {overview.primaryTotals.map((metric) => (
          <StatisticsMetricCard
            key={metric.id}
            label={metric.label}
            value={metric.value}
            unit={metric.unit}
            description={metric.description}
          />
        ))}
      </div>

      {overview.formatPriorities.length > 0 ? (
        <div className="space-y-4">
          {overview.formatPriorities.map((format) => (
            <section
              key={format.gameType}
              aria-label={`${getGameTypeLabel(format.gameType)}の主要成績`}
              className="space-y-3"
            >
              <h3 className="font-semibold text-foreground">
                {getGameTypeLabel(format.gameType)}の主要成績（
                {format.matchCount}対局）
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <StatisticsMetricCard
                  label="平均順位"
                  value={format.averageRank}
                  unit="位"
                  description={`分母: ${format.matchCount}対局`}
                />
                <StatisticsMetricCard
                  label="トップ率"
                  value={format.topRate}
                  description={`分母: ${format.matchCount}対局`}
                />
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="順位成績はありません"
          description="対象条件に該当する対局結果が登録されていません。"
        />
      )}

      {overview.formatDetails.map((format) => (
        <RankDistribution key={format.gameType} format={format} />
      ))}

      <section aria-label="その他の基本成績" className="space-y-3">
        <h3 className="font-semibold text-foreground">その他の基本成績</h3>
        <div className="grid grid-cols-2 gap-4">
          {overview.secondaryTotals.map((metric) => (
            <StatisticsMetricCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              unit={metric.unit}
              description={metric.description}
            />
          ))}
        </div>
      </section>

      {overview.formatDetails.map((format) => (
        <FormatSummaryCard key={format.gameType} format={format} />
      ))}

      {summary.currentStanding ? (
        <CurrentStandingCard standing={summary.currentStanding} />
      ) : summary.scope.scopeType === "overall" ? (
        <Card title={`${getScopeLabel(summary.scope.scopeType)}の順位`}>
          <p className="text-sm text-text-muted">
            全体成績にはリーグ・シーズン順位はありません。
          </p>
        </Card>
      ) : (
        <Card title={`${getScopeLabel(summary.scope.scopeType)}順位`}>
          <p className="text-sm text-text-muted">
            このスコープの順位データはありません。
          </p>
        </Card>
      )}
    </section>
  );
};
