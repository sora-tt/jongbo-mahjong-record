"use client";

import * as React from "react";

import { CalendarDays } from "lucide-react";

import { DeleteMatchDialog } from "@/features/match/ui/v2/delete-match-dialog";
import { MatchList } from "@/features/match/ui/v2/match-list";
import { useSessionResultsPage } from "@/features/session/hooks/use-session-results";

import { AppShell } from "@/components/v2/layout/app-shell";
import { Button } from "@/components/v2/ui/button";
import { EmptyState } from "@/components/v2/ui/empty-state";
import { ErrorState } from "@/components/v2/ui/error-state";
import { PageLoading } from "@/components/v2/ui/page-loading";

const formatSessionDate = (value: string) => {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}年${get("month")}月${get("day")}日（${get("weekday")}）`;
};

const SessionResultsPage = () => {
  const state = useSessionResultsPage("/v2");
  return (
    <AppShell>
      {state.isLoading ? (
        <PageLoading label="Sessionの結果を読み込んでいます" />
      ) : (
        <div className="mx-auto max-w-[414px] px-3 pb-8 pt-6">
          {state.notFound ? (
            <EmptyState
              title="Sessionが見つかりません"
              description="シーズン詳細に戻ってSessionを選び直してください。"
              action={
                <Button variant="secondary" onClick={state.goToSeason}>
                  シーズン詳細へ戻る
                </Button>
              }
            />
          ) : state.error && !state.session ? (
            <ErrorState message={state.error} onRetry={state.retry} />
          ) : state.session ? (
            <div className="space-y-4">
              <header>
                <h1 className="text-center text-v2-display font-bold">
                  本日の成績
                </h1>
                <p className="mt-4 flex items-center gap-2 text-v2-caption text-v2-text-secondary">
                  <CalendarDays size={18} aria-hidden="true" />
                  {formatSessionDate(state.session.startedAt)}
                </p>
              </header>
              {state.error && !state.deleteTargetMatchId && (
                <ErrorState message={state.error} onRetry={state.retry} />
              )}
              {state.endError && (
                <ErrorState
                  message={state.endError}
                  onRetry={state.handleEndRecord}
                />
              )}
              <MatchList
                players={state.session.members}
                matches={state.matches}
                deletingMatchId={state.deletingMatchId}
                onEdit={state.handleEditMatch}
                onDelete={state.handleRequestDeleteMatch}
              />
              <div className="mx-auto flex max-w-[310px] flex-col gap-4 pt-2">
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={state.handleAddRecord}
                  disabled={state.isEnded}
                >
                  記録を追加
                </Button>
                <Button
                  size="lg"
                  fullWidth
                  onClick={state.handleEndRecord}
                  disabled={state.isEnded}
                  loading={state.isEnding}
                >
                  {state.isEnded ? "記録終了済み" : "記録を終了"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
      <DeleteMatchDialog
        open={Boolean(state.deleteTargetMatchId)}
        loading={Boolean(state.deletingMatchId)}
        error={state.error}
        onCancel={state.handleCancelDeleteMatch}
        onConfirm={() => void state.handleConfirmDeleteMatch()}
      />
    </AppShell>
  );
};
export default SessionResultsPage;
