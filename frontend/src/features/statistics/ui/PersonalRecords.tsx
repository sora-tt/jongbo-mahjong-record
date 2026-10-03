import * as React from "react";

import Link from "next/link";

import {
  formatStatisticsFinalPointValue,
  formatStatisticsRecordDate,
  formatStatisticsScoreValue,
  formatStatisticsStreakCount,
  getStatisticsStreak,
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
type RecordValue = NonNullable<ComputedSummary["records"]["highestRawScore"]>;
type StreakType = "top" | "last" | "topTwo" | "positive" | "negative";

const RecordContextValue: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2 text-sm">
    <dt className="text-text-muted">{label}</dt>
    <dd className="break-words font-medium text-foreground">{children}</dd>
  </div>
);

const PersonalRecord: React.FC<{
  label: string;
  value: RecordValue | null;
  isFinalPoint: boolean;
  unit: string;
}> = ({ label, value, isFinalPoint, unit }) => {
  if (value === null) {
    return (
      <article className="rounded-surface border border-border p-3">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <p className="mt-2 text-sm text-text-muted">記録なし</p>
      </article>
    );
  }

  const { match } = value;
  const opponentNames =
    match.opponents.length > 0
      ? match.opponents
          .map(
            ({ userName, rank }) => `${userName || "名前未設定"}（${rank}位）`
          )
          .join("、")
      : "同卓者情報なし";
  const recordValue = isFinalPoint
    ? formatStatisticsFinalPointValue(value.value)
    : formatStatisticsScoreValue(value.value);
  const resultsHref = `/league/${match.leagueId}/season/${match.seasonId}/sessions/${match.sessionId}/results`;

  return (
    <article className="rounded-surface border border-border p-3">
      <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      <p className="mt-2 text-xl font-bold text-brand-strong">
        {recordValue}
        <span className="ml-1 text-sm font-medium text-text-muted">{unit}</span>
      </p>
      <dl className="mt-3 space-y-2">
        <RecordContextValue label="対局日時">
          {formatStatisticsRecordDate(match.playedAt)}（日本時間）
        </RecordContextValue>
        <RecordContextValue label="対象">
          {match.leagueName} / {match.seasonName}
        </RecordContextValue>
        <RecordContextValue label="セッション">
          {match.sessionLabel ?? "名称なし"}
        </RecordContextValue>
        <RecordContextValue label="同卓者">{opponentNames}</RecordContextValue>
      </dl>
      <Link
        href={resultsHref}
        className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-brand-strong underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong"
      >
        このセッションの対局結果を見る
      </Link>
    </article>
  );
};

const RecordCards: React.FC<{ summary: ComputedSummary }> = ({ summary }) => (
  <Card
    title="素点・最終ポイントの自己記録"
    meta={`対象: ${summary.totals.totalMatchCount}対局`}
  >
    <div className="space-y-4">
      <section aria-label="素点の記録" className="space-y-3">
        <h3 className="font-semibold text-foreground">素点（点）</h3>
        <div className="space-y-3">
          <PersonalRecord
            label="最高素点"
            value={summary.records.highestRawScore}
            isFinalPoint={false}
            unit="点"
          />
          <PersonalRecord
            label="最低素点"
            value={summary.records.lowestRawScore}
            isFinalPoint={false}
            unit="点"
          />
        </div>
      </section>
      <section aria-label="最終ポイントの記録" className="space-y-3">
        <h3 className="font-semibold text-foreground">最終ポイント（pt）</h3>
        <div className="space-y-3">
          <PersonalRecord
            label="最高最終ポイント"
            value={summary.records.highestFinalPoint}
            isFinalPoint
            unit="pt"
          />
          <PersonalRecord
            label="最低最終ポイント"
            value={summary.records.lowestFinalPoint}
            isFinalPoint
            unit="pt"
          />
        </div>
      </section>
    </div>
  </Card>
);

const streakDefinitions: Array<{ type: StreakType; label: string }> = [
  { type: "top", label: "連続トップ" },
  { type: "last", label: "連続ラス" },
  { type: "topTwo", label: "連続連対" },
  { type: "positive", label: "連続プラス" },
  { type: "negative", label: "連続マイナス" },
];

const StreaksCard: React.FC<{ summary: ComputedSummary }> = ({ summary }) => (
  <Card title="連続成績" meta={`対象: ${summary.totals.totalMatchCount}対局`}>
    <p className="mb-3 text-sm text-text-muted">
      ラスは各対局の参加人数に応じた最下位として集計しています。
    </p>
    <Table caption="連続トップなどの現在数と過去最長記録">
      <TableHead>
        <TableRow>
          <TableHeadCell>指標</TableHeadCell>
          <TableHeadCell>現在</TableHeadCell>
          <TableHeadCell>最長</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {streakDefinitions.map(({ type, label }) => {
          const streak = getStatisticsStreak(summary.streaks, type);

          return (
            <TableRow key={type}>
              <TableCell>{label}</TableCell>
              <TableCell>
                {formatStatisticsStreakCount(streak?.currentCount ?? null)}
              </TableCell>
              <TableCell>
                {formatStatisticsStreakCount(streak?.longestCount ?? null)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </Card>
);

export const PersonalRecords: React.FC<Props> = ({ summary }) => (
  <section aria-labelledby="statistics-records-heading" className="space-y-4">
    <h2
      id="statistics-records-heading"
      className="text-xl font-bold text-foreground"
    >
      自己記録
    </h2>

    {summary.status === "empty" ? (
      <EmptyState
        title="自己記録はありません"
        description="対象条件に該当する対局結果が登録されていません。"
      />
    ) : (
      <>
        <StatisticsMetricCard
          label="チョンボ回数"
          value={summary.totals.chomboCount}
          unit="回"
          description={`対象: ${summary.totals.totalMatchCount}対局`}
        />
        <RecordCards summary={summary} />
        <StreaksCard summary={summary} />
      </>
    )}
  </section>
);
