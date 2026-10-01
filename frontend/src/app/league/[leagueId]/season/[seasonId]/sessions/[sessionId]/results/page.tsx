"use client";

import * as React from "react";

import { CalendarDays } from "lucide-react";

import { MatchList } from "@/features/match/ui/MatchList";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { HeaderCard } from "@/components/ui/header-card";
import { LoadingState } from "@/components/ui/loading-state";
import { SectionCard } from "@/components/ui/section-card";

import { useSessionResultsPage } from "./hooks";

const SessionResultsPage: React.FC = () => {
  const {
    session,
    matches,
    isLoading,
    isEnding,
    deletingMatchId,
    deleteTargetMatchId,
    error,
    retry,
    isEnded,
    handleAddRecord,
    handleEditMatch,
    handleEndRecord,
    handleRequestDeleteMatch,
    handleCancelDeleteMatch,
    handleConfirmDeleteMatch,
  } = useSessionResultsPage();

  const formatSessionDate = (value: string) =>
    new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));

  return (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      <div className="mx-auto max-w-[390px] px-3 py-5">
        {isLoading ? (
          <LoadingState
            label="Sessionの結果を読み込んでいます…"
            className="min-h-[calc(100vh-4rem)]"
          />
        ) : error && !session ? (
          <ErrorState message={error} onRetry={retry} />
        ) : session ? (
          <div className="space-y-6">
            <HeaderCard title="本日の成績">
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={14} aria-hidden="true" />
                {formatSessionDate(session.startedAt)}
              </span>
            </HeaderCard>

            {error ? <ErrorState message={error} onRetry={retry} /> : null}

            <SectionCard title="成績表" bodyClassName="overflow-hidden">
              <MatchList
                players={session.members}
                matches={matches}
                deletingMatchId={deletingMatchId}
                onEdit={handleEditMatch}
                onDelete={handleRequestDeleteMatch}
              />
            </SectionCard>

            <div className="flex flex-col items-center gap-3 pt-4">
              <Button
                variant="brand-secondary"
                onClick={handleAddRecord}
                disabled={isEnded || isLoading}
                className="w-40"
              >
                記録を追加
              </Button>
              <Button
                variant="brand-primary"
                onClick={handleEndRecord}
                disabled={isEnded || isLoading || isEnding}
                loading={isEnding}
                className="w-40"
              >
                {isEnded ? "記録終了済み" : isEnding ? "終了中…" : "記録を終了"}
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
