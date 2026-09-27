"use client";

import * as React from "react";

import { MatchList } from "@/features/match/ui/MatchList";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

import { useSessionResultsPage } from "./hooks";

const SessionResultsPage: React.FC = () => {
  const {
    session,
    matches,
    isLoading,
    isEnding,
    deletingMatchId,
    deleteTargetMatchId,
    expandedMatchId,
    error,
    retry,
    isEnded,
    formatDate,
    handleAddRecord,
    handleEditMatch,
    handleEndRecord,
    handleToggleMatch,
    handleRequestDeleteMatch,
    handleCancelDeleteMatch,
    handleConfirmDeleteMatch,
    goToSeason,
  } = useSessionResultsPage();

  return (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <LoadingState
            label="Sessionの結果を読み込んでいます…"
            className="min-h-[calc(100vh-4rem)]"
          />
        ) : error && !session ? (
          <ErrorState message={error} onRetry={retry} />
        ) : session ? (
          <div className="space-y-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-text-muted">Session詳細</p>
                <h1 className="mt-1 text-2xl font-bold text-foreground">
                  {formatDate(session.startedAt)}
                </h1>
                <p className="mt-2 text-sm text-text-muted">
                  {isEnded ? `終了：${formatDate(session.endedAt)}` : "進行中"}
                  {session.tableLabel ? ` / ${session.tableLabel}` : ""}
                </p>
              </div>
              <Button variant="secondary" onClick={goToSeason}>
                シーズンへ戻る
              </Button>
            </header>

            {error ? <ErrorState message={error} onRetry={retry} /> : null}

            <Card
              title="参加者"
              meta={`${session.memberCount}人 / 対局数 ${session.totalMatchCount}`}
            >
              <div className="flex flex-wrap gap-2">
                {session.members.map((member) => (
                  <span
                    key={String(member.userId)}
                    className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-strong"
                  >
                    {member.userName}
                  </span>
                ))}
              </div>
            </Card>

            <Card title="対局結果" meta="順位・pointはBE返却値">
              <MatchList
                matches={matches}
                expandedMatchId={expandedMatchId}
                deletingMatchId={deletingMatchId}
                onToggle={handleToggleMatch}
                onEdit={handleEditMatch}
                onDelete={handleRequestDeleteMatch}
              />
            </Card>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                variant="secondary"
                onClick={handleAddRecord}
                disabled={isEnded || isLoading}
              >
                対局を追加
              </Button>
              <Button
                onClick={handleEndRecord}
                disabled={isEnded || isLoading || isEnding}
                loading={isEnding}
              >
                {isEnded
                  ? "Session終了済み"
                  : isEnding
                    ? "終了中…"
                    : "Sessionを終了"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {deleteTargetMatchId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-surface bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground">
              対局結果を削除しますか？
            </h2>
            <p className="mt-3 text-sm text-text-muted">
              削除後も既存対局のmatchIndexは変更されません。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={handleCancelDeleteMatch}
                disabled={Boolean(deletingMatchId)}
              >
                キャンセル
              </Button>
              <Button
                onClick={() => void handleConfirmDeleteMatch()}
                disabled={Boolean(deletingMatchId)}
                loading={Boolean(deletingMatchId)}
              >
                削除する
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
};

export default SessionResultsPage;
