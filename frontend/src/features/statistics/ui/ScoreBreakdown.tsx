import * as React from "react";

import {
  formatStatisticsFinalPointValue,
  formatStatisticsPopulationStandardDeviation,
  formatStatisticsRateCount,
  formatStatisticsScoreValue,
  getVisibleStatisticsScoreFormats,
  getVisibleStatisticsScoreRanks,
} from "@/features/statistics/model/score-records";

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
type Props = {
  summary: ComputedSummary;
};

type ScoreMetric = "average" | "maximum" | "minimum" | "median";

const scoreMetricLabels: Record<ScoreMetric, string> = {
  average: "平均",
  maximum: "最高",
  minimum: "最低",
  median: "中央値",
};

const ScoreSummaryCard: React.FC<{
  title: string;
  unit: string;
  matchCount: number;
  values: Record<ScoreMetric, number | null> & {
    populationStandardDeviation: number | null;
  };
  formatValue: (value: number | null) => string;
}> = ({ title, unit, matchCount, values, formatValue }) => (
  <Card title={title} meta={`対象: ${matchCount}対局`}>
    <div className="grid grid-cols-2 gap-4">
      {(Object.keys(scoreMetricLabels) as ScoreMetric[]).map((metric) => (
        <StatisticsMetricCard
          key={metric}
          label={scoreMetricLabels[metric]}
          value={formatValue(values[metric])}
          unit={unit}
          description={`分母: ${matchCount}対局`}
        />
      ))}
      <StatisticsMetricCard
        label={`母標準偏差（${unit}）`}
        value={formatStatisticsPopulationStandardDeviation({
          matchCount,
          populationStandardDeviation: values.populationStandardDeviation,
        })}
        description={
          matchCount < 2
            ? `対象: ${matchCount}対局（2対局未満）`
            : `対象: ${matchCount}対局`
        }
      />
    </div>
  </Card>
);

const SignDistributionCard: React.FC<{
  formats: ComputedSummary["scoreByGameType"];
}> = ({ formats }) => {
  const values = getVisibleStatisticsScoreFormats(formats).flatMap(
    ({ gameType, finalPoint }) =>
      [
        { label: "プラス", ...formatStatisticsRateCount(finalPoint.positive) },
        {
          label: "マイナス",
          ...formatStatisticsRateCount(finalPoint.negative),
        },
        { label: "同点", ...formatStatisticsRateCount(finalPoint.even) },
      ].map((value) => ({ ...value, gameType }))
  );

  return (
    <Card title="最終ポイントの符号別成績">
      <Table caption="最終ポイントのプラス・マイナス・同点の回数と割合">
        <TableHead>
          <TableRow>
            <TableHeadCell>形式</TableHeadCell>
            <TableHeadCell>結果</TableHeadCell>
            <TableHeadCell>回数</TableHeadCell>
            <TableHeadCell>割合</TableHeadCell>
            <TableHeadCell>分母</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {values.map(({ gameType, label, count, rate, denominator }) => (
            <TableRow key={`${gameType}-${label}`}>
              <TableCell>{getGameTypeLabel(gameType)}</TableCell>
              <TableCell>{label}</TableCell>
              <TableCell>{count}</TableCell>
              <TableCell>{rate}</TableCell>
              <TableCell>{denominator.replace("分母: ", "")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

const getGameTypeLabel = (gameType: "sanma" | "yonma") =>
  gameType === "sanma" ? "三麻" : "四麻";

const ScoreByRankCard: React.FC<{ summary: ComputedSummary }> = ({
  summary,
}) => {
  const rows = summary.scoreByRank.flatMap((row) =>
    getVisibleStatisticsScoreRanks(row.gameType, [row])
  );

  return (
    <Card title="順位別の平均スコア">
      {rows.length > 0 ? (
        <Table caption="三麻・四麻の順位別平均素点と平均最終ポイント">
          <TableHead>
            <TableRow>
              <TableHeadCell>形式</TableHeadCell>
              <TableHeadCell>順位</TableHeadCell>
              <TableHeadCell>対局数</TableHeadCell>
              <TableHeadCell>平均素点（点）</TableHeadCell>
              <TableHeadCell>平均最終pt（pt）</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.gameType}-${row.rank}`}>
                <TableCell>{getGameTypeLabel(row.gameType)}</TableCell>
                <TableCell>{row.rank}位</TableCell>
                <TableCell>{row.matchCount}対局</TableCell>
                <TableCell>
                  {formatStatisticsScoreValue(row.averageRawScore)}
                </TableCell>
                <TableCell>
                  {formatStatisticsFinalPointValue(row.averageFinalPoint)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-text-muted">
          順位別スコアを表示できる対局データはありません。
        </p>
      )}
    </Card>
  );
};

export const ScoreBreakdown: React.FC<Props> = ({ summary }) => (
  <section aria-labelledby="statistics-score-heading" className="space-y-4">
    <h2
      id="statistics-score-heading"
      className="text-xl font-bold text-foreground"
    >
      スコア内訳
    </h2>

    {summary.status === "empty" ? (
      <EmptyState
        title="スコア成績はありません"
        description="対象条件に該当する対局結果が登録されていません。"
      />
    ) : (
      <>
        <p className="text-sm text-text-muted">
          形式ごとに、素点と順位点などを含む最終ポイントを別々に集計しています。
        </p>
        <div className="space-y-4">
          {getVisibleStatisticsScoreFormats(summary.scoreByGameType).map(
            (format) => (
              <section
                key={format.gameType}
                aria-labelledby={`statistics-score-${format.gameType}`}
                className="space-y-3"
              >
                <h3
                  id={`statistics-score-${format.gameType}`}
                  className="font-semibold text-foreground"
                >
                  {getGameTypeLabel(format.gameType)}
                </h3>
                <ScoreSummaryCard
                  title={`${getGameTypeLabel(format.gameType)}の素点`}
                  unit="点"
                  matchCount={format.rawScore.matchCount}
                  values={format.rawScore}
                  formatValue={formatStatisticsScoreValue}
                />
                <ScoreSummaryCard
                  title={`${getGameTypeLabel(format.gameType)}の最終ポイント`}
                  unit="pt"
                  matchCount={format.finalPoint.matchCount}
                  values={format.finalPoint}
                  formatValue={formatStatisticsFinalPointValue}
                />
              </section>
            )
          )}
        </div>
        <SignDistributionCard formats={summary.scoreByGameType} />
        <ScoreByRankCard summary={summary} />
      </>
    )}
  </section>
);
