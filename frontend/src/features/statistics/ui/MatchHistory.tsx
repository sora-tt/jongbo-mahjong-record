"use client";

import * as React from "react";

import {
  getStatisticsMatchHistoryModel,
  type StatisticsMatchHistoryUiStatus,
  type StatisticsMatchHistoryView,
} from "@/features/statistics/model/match-history";
import {
  formatStatisticsFinalPointValue,
  formatStatisticsScoreValue,
} from "@/features/statistics/model/score-records";
import { getStatisticsTrendContext } from "@/features/statistics/model/trend";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "@/components/ui/table";

type Props = {
  history: StatisticsMatchHistoryView | null;
  status: StatisticsMatchHistoryUiStatus;
  subjectLabel: string;
  scopeLabel?: string;
  historyError?: string | null;
  isLoadingMore?: boolean;
  onLoadMore: (cursor: string) => void;
  onRetry?: () => void;
};

const gameTypeLabels = {
  sanma: "三麻",
  yonma: "四麻",
} as const;

const windLabels = {
  east: "東",
  south: "南",
  west: "西",
  north: "北",
} as const;

const formatOpponentPoint = (value: number) =>
  `${formatStatisticsFinalPointValue(value)} pt`;

const MatchDetail: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 text-sm">
    <dt className="text-text-muted">{label}</dt>
    <dd className="break-words font-medium text-foreground">{children}</dd>
  </div>
);

const MatchHistoryItem: React.FC<{
  item: ReturnType<typeof getStatisticsMatchHistoryModel>["items"][number];
  subjectLabel: string;
}> = ({ item, subjectLabel }) => {
  const { match } = item;
  const format = gameTypeLabels[item.gameType];
  const wind = windLabels[item.wind];

  return (
    <li>
      <article className="space-y-3 rounded-surface border border-border p-3">
        <header className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground">
            {item.playedAtLabel}
            <span className="ml-1 text-xs font-normal text-text-muted">
              日本時間
            </span>
          </h3>
          <span className="rounded-full bg-surface-muted px-2 py-1 text-xs font-medium text-text-muted">
            {format}
          </span>
        </header>

        <dl className="space-y-2">
          <MatchDetail label="リーグ / シーズン">
            {match.leagueName} / {match.seasonName}
          </MatchDetail>
          <MatchDetail label="セッション">
            {match.sessionLabel ?? "名称なし"}
          </MatchDetail>
          <MatchDetail label="表示対象者">
            {subjectLabel}（{item.rank}位・{wind}家）
          </MatchDetail>
          <MatchDetail label="素点">
            {formatStatisticsScoreValue(item.rawScore)} 点
          </MatchDetail>
          <MatchDetail label="最終ポイント">
            {formatOpponentPoint(item.finalPoint)}
          </MatchDetail>
        </dl>

        <section aria-label={`${match.matchId}の同卓者`} className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">同卓者</h4>
          {item.opponents.length === 0 ? (
            <p className="text-sm text-text-muted">同卓者情報がありません。</p>
          ) : (
            <div
              aria-label={`${match.matchId}の同卓者一覧。横にスクロールできます。`}
              className="overflow-x-auto rounded-control border border-border"
              role="region"
              tabIndex={0}
            >
              <Table
                caption={`${format}、${match.leagueName} ${match.seasonName}、${item.playedAtLabel}の同卓者名、順位、最終ポイント`}
                className="min-w-[17rem]"
              >
                <TableHead>
                  <TableRow>
                    <TableHeadCell className="text-left">名前</TableHeadCell>
                    <TableHeadCell>順位</TableHeadCell>
                    <TableHeadCell>最終pt</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {item.opponents.map((opponent) => (
                    <TableRow key={opponent.userId}>
                      <TableCell className="max-w-28 break-words text-left">
                        {opponent.userName || "名前未設定"}
                      </TableCell>
                      <TableCell>{opponent.rank}位</TableCell>
                      <TableCell>
                        {formatOpponentPoint(opponent.finalPoint)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </article>
    </li>
  );
};

export const MatchHistory: React.FC<Props> = ({
  history,
  status,
  subjectLabel,
  scopeLabel,
  historyError,
  isLoadingMore = false,
  onLoadMore,
  onRetry,
}) => {
  const model = getStatisticsMatchHistoryModel({ status, history });
  const nextCursor = model.nextCursor;
  const contextLabel =
    scopeLabel ??
    (history
      ? getStatisticsTrendContext({ scope: history.scope })
      : "選択中の対象範囲");

  return (
    <Card
      title="対局履歴"
      meta={`${subjectLabel} / ${contextLabel}`}
      aria-label={`${subjectLabel}の対局履歴`}
    >
      {status === "idle" || status === "loading" ? (
        <LoadingState label="対局履歴を読み込んでいます…" className="p-4" />
      ) : status === "uncomputed" ? (
        <EmptyState
          title="統計がまだ計算されていません"
          description="集計が完了すると、この対象範囲の対局履歴を表示します。"
          className="p-5"
        />
      ) : status === "empty" ? (
        <EmptyState
          title="対局履歴がありません"
          description="選択中の対象範囲に登録済みの対局結果はありません。"
          className="p-5"
        />
      ) : status === "error" ? (
        <ErrorState message={historyError ?? undefined} onRetry={onRetry} />
      ) : (
        <div className="space-y-4">
          {model.items.length > 0 ? (
            <ol
              aria-label={`${subjectLabel}の対局履歴。新しい対局から順に表示`}
              className="space-y-3"
            >
              {model.items.map((item) => (
                <MatchHistoryItem
                  key={item.match.matchId}
                  item={item}
                  subjectLabel={subjectLabel}
                />
              ))}
            </ol>
          ) : (
            <EmptyState
              title="対局履歴がありません"
              description="選択中の対象範囲に登録済みの対局結果はありません。"
              className="p-5"
            />
          )}

          {historyError ? (
            <ErrorState
              message={historyError}
              onRetry={
                nextCursor === null ? onRetry : () => onLoadMore(nextCursor)
              }
            />
          ) : nextCursor !== null ? (
            <Button
              type="button"
              variant="secondary"
              fullWidth
              className="min-h-11"
              loading={isLoadingMore}
              onClick={() => onLoadMore(nextCursor)}
              aria-label={`${subjectLabel}の対局履歴をさらに読み込む`}
            >
              さらに読み込む
            </Button>
          ) : null}
        </div>
      )}
    </Card>
  );
};
