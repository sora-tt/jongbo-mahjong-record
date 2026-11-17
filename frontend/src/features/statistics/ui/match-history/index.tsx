"use client";
import * as React from "react";

import { ChevronDown } from "lucide-react";

import {
  getStatisticsMatchHistoryModel,
  type StatisticsMatchHistoryUiStatus,
  type StatisticsMatchHistoryView,
} from "@/features/statistics/model/match-history";
import {
  formatStatisticsFinalPointValue,
  formatStatisticsScoreValue,
} from "@/features/statistics/model/score-records";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

type Props = {
  history: StatisticsMatchHistoryView | null;
  status: StatisticsMatchHistoryUiStatus;
  subjectLabel: string;
  scopeLabel?: string;
  startingPointsByLeagueId?: Readonly<Record<string, number>>;
  historyError?: string | null;
  isLoadingMore?: boolean;
  onLoadMore: (cursor: string) => void;
  onRetry?: () => void;
};
const winds = { east: "東", south: "南", west: "西", north: "北" } as const;
const formatDate = (value: string) => {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("month")}月${get("day")}日（${get("weekday")}）`;
};
export const MatchHistory = ({
  history,
  status,
  subjectLabel,
  historyError,
  isLoadingMore = false,
  onLoadMore,
  onRetry,
}: Props) => {
  const model = getStatisticsMatchHistoryModel({ status, history });
  if (status === "idle" || status === "loading")
    return (
      <LoadingState label="対局履歴を読み込んでいます" className="min-h-40" />
    );
  if (status === "error")
    return (
      <ErrorState
        message={historyError ?? "対局履歴を取得できませんでした。"}
        onRetry={onRetry}
      />
    );
  if (status === "uncomputed")
    return (
      <EmptyState
        title="統計がまだ計算されていません"
        description="集計が完了すると履歴を表示します。"
      />
    );
  if (!model.items.length && !model.nextCursor && !historyError)
    return (
      <EmptyState
        title="対局履歴がありません"
        description="選択した範囲に対局結果はありません。"
      />
    );
  return (
    <section aria-label={`${subjectLabel}の対局履歴`} className="space-y-4">
      <ol className="space-y-4">
        {model.items.map((item) => (
          <li key={item.match.matchId}>
            <Card as="article" size="auto">
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-app-label font-bold">
                      {formatDate(item.match.playedAt)}
                    </span>
                    <span
                      className={`text-app-label font-bold ${item.finalPoint > 0 ? "text-blue-600" : item.finalPoint < 0 ? "text-app-danger" : "text-app-text-secondary"}`}
                    >
                      {item.rank}位・
                      {formatStatisticsFinalPointValue(item.finalPoint)} pt
                    </span>
                  </span>
                  <span className="mt-2 block text-app-caption text-app-text-secondary">
                    {item.match.leagueName} / {item.match.seasonName}
                  </span>
                  <span className="mt-3 flex items-center justify-between gap-2 border-t border-app-border-subtle pt-3 text-app-caption">
                    <span>
                      {winds[item.wind]}家・
                      {formatStatisticsScoreValue(item.rawScore)}点
                    </span>
                    <span className="inline-flex items-center gap-1 text-app-brand-strong">
                      詳細を見る
                      <ChevronDown
                        size={16}
                        className="transition-transform group-open:rotate-180"
                      />
                    </span>
                  </span>
                  {item.yakumanLabels.length > 0 && (
                    <span className="mt-2 block">
                      <Chip size="sm" variant="selected">
                        役満・{item.yakumanLabels.join("、")}
                      </Chip>
                    </span>
                  )}
                </summary>
                <div className="mt-4 space-y-3 border-t border-app-border-subtle pt-3 text-app-caption">
                  <p>対局日時：{item.playedAtLabel}</p>
                  <div>
                    <p className="font-bold">同卓者</p>
                    {item.opponents.length ? (
                      <ul className="mt-2 grid grid-cols-3 gap-2">
                        {item.opponents.map((opponent) => (
                          <li key={opponent.userId} className="min-w-0">
                            <p className="break-words font-semibold">
                              {opponent.userName || "名前未設定"}
                            </p>
                            <p className="text-app-text-secondary">
                              {opponent.rank}位・
                              {formatStatisticsFinalPointValue(
                                opponent.finalPoint
                              )}{" "}
                              pt
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>同卓者情報がありません。</p>
                    )}
                  </div>
                </div>
              </details>
            </Card>
          </li>
        ))}
      </ol>
      {historyError ? (
        <ErrorState
          message={historyError}
          onRetry={
            model.nextCursor ? () => onLoadMore(model.nextCursor!) : onRetry
          }
        />
      ) : (
        model.nextCursor && (
          <Button
            variant="secondary"
            fullWidth
            loading={isLoadingMore}
            onClick={() => onLoadMore(model.nextCursor!)}
          >
            さらに読み込む
          </Button>
        )
      )}
      <p className="text-center text-app-caption text-app-text-secondary">
        {model.items.length}件の対局を表示
      </p>
    </section>
  );
};
