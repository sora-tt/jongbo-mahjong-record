import * as React from "react";

import {
  formatStatisticsOverviewNumber,
  formatStatisticsOverviewRate,
  getStatisticsOverviewModel,
  getStatisticsOverviewRateBarWidth,
  getVisibleStatisticsRanks,
} from "@/features/statistics/model/overview";
import {
  formatStatisticsFinalPointValue,
  formatStatisticsScoreValue,
  getStatisticsStreak,
} from "@/features/statistics/model/score-records";
import { PersonalRecords } from "@/features/statistics/ui/v2/personal-records";
import { ScoreBreakdown } from "@/features/statistics/ui/v2/score-breakdown";

import { Card } from "@/components/v2/ui/card";
import { Panel } from "@/components/v2/ui/panel";

import type { PersonalStatisticsSummaryResponse } from "@/features/statistics/api";

type Summary = Exclude<
  PersonalStatisticsSummaryResponse,
  { status: "uncomputed" }
>;
const Metric = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) => (
  <Card size="auto" className="min-h-[84px]">
    <p className="text-v2-caption text-v2-text-secondary">{label}</p>
    <p className={`mt-2 text-v2-data font-bold ${tone ?? "text-v2-text"}`}>
      {value}
    </p>
  </Card>
);
const signedColor = (value: number) =>
  value > 0 ? "text-blue-600" : value < 0 ? "text-v2-danger" : "text-v2-text";
export const StatisticsOverview = ({
  summary,
  startingPoints,
  startingPointsByLeagueId,
}: {
  summary: Summary;
  startingPoints: number | null;
  startingPointsByLeagueId: Readonly<Record<string, number>>;
}) => {
  const overview = getStatisticsOverviewModel(summary);
  const showFormats =
    summary.scope.gameType === "all" && overview.formatDetails.length > 1;
  const records = summary.records;
  return (
    <section aria-label="成績の概要" className="space-y-4">
      {overview.formatDetails.map((format) => {
        const ranks = getVisibleStatisticsRanks(format.gameType, format.ranks);
        return (
          <div key={format.gameType} className="space-y-4">
            {showFormats && (
              <h2 className="text-v2-label font-bold">
                {format.gameType === "sanma" ? "三麻" : "四麻"}
              </h2>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Metric
                label="総合ポイント"
                value={`${formatStatisticsFinalPointValue(format.totalPoints)} pt`}
                tone={signedColor(format.totalPoints)}
              />
              <Metric
                label="平均順位"
                value={`${formatStatisticsOverviewNumber(format.averageRank)} 位`}
              />
              <Metric
                label="トップ率"
                value={formatStatisticsOverviewRate(format.topRate)}
                tone="text-v2-danger"
              />
              <Metric
                label="連対率"
                value={formatStatisticsOverviewRate(format.topTwoRate)}
                tone="text-v2-danger"
              />
            </div>
            <Panel>
              <h2 className="text-v2-label font-bold">順位成績</h2>
              <p className="mt-1 text-v2-caption text-v2-text-secondary">
                {format.matchCount}対局・順位別の割合
              </p>
              <ul className="mt-4 space-y-3">
                {ranks.map((rank) => (
                  <li
                    key={rank.rank}
                    className="grid grid-cols-[32px_1fr_48px] items-center gap-3 text-v2-caption"
                  >
                    <span>{rank.rank}位</span>
                    <span className="h-2 overflow-hidden rounded-full bg-v2-brand-soft">
                      <span
                        className="block h-full rounded-full bg-v2-action-primary"
                        style={{
                          width:
                            getStatisticsOverviewRateBarWidth(rank.rate) ??
                            "0%",
                          opacity: rank.rank === 1 ? 1 : 0.55,
                        }}
                      />
                    </span>
                    <span className="text-right font-semibold">
                      {formatStatisticsOverviewRate(rank.rate)}
                    </span>
                    <span className="sr-only">{rank.count}回</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        );
      })}
      <Panel>
        <h2 className="text-v2-heading-2 font-bold">スコア詳細</h2>
        <dl className="mt-2 divide-y divide-v2-border-subtle text-v2-label">
          <div className="flex justify-between gap-3 py-3">
            <dt className="text-v2-text-secondary">素点合計</dt>
            <dd className="font-semibold">—</dd>
          </div>
          <div className="flex justify-between gap-3 py-3">
            <dt className="text-v2-text-secondary">順位点・オカ</dt>
            <dd className="font-semibold">—</dd>
          </div>
        </dl>
        <p className="text-v2-caption text-v2-text-secondary">
          内訳の集計には未対応です。
        </p>
      </Panel>
      <Panel>
        <h2 className="text-v2-heading-2 font-bold">個人記録</h2>
        <dl className="mt-2 divide-y divide-v2-border-subtle text-v2-label">
          <div className="flex justify-between gap-3 py-3">
            <dt className="text-v2-text-secondary">最高得点</dt>
            <dd className="font-semibold">
              {records.highestRawScore
                ? `${formatStatisticsScoreValue(records.highestRawScore.value)} 点`
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 py-3">
            <dt className="text-v2-text-secondary">連続トップ（最長）</dt>
            <dd className="font-semibold">
              {getStatisticsStreak(summary.streaks, "top")?.longestCount ?? "—"}{" "}
              対局
            </dd>
          </div>
          <div className="flex justify-between gap-3 py-3">
            <dt className="text-v2-text-secondary">最多役満</dt>
            <dd className="font-semibold">—</dd>
          </div>
          <div className="flex justify-between gap-3 py-3">
            <dt className="text-v2-text-secondary">チョンボ</dt>
            <dd className="font-semibold">{summary.totals.chomboCount} 回</dd>
          </div>
        </dl>
        <p className="text-v2-caption text-v2-text-secondary">
          役満の集計には未対応です。
        </p>
      </Panel>
      <Card as="details" size="auto">
        <summary className="cursor-pointer text-v2-label font-semibold">
          さらに詳しい成績
        </summary>
        <div className="mt-4 space-y-4">
          <ScoreBreakdown summary={summary} startingPoints={startingPoints} />
          <PersonalRecords
            summary={summary}
            startingPointsByLeagueId={startingPointsByLeagueId}
          />
        </div>
      </Card>
    </section>
  );
};
