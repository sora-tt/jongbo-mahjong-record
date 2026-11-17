"use client";

import { useParams } from "next/navigation";

import { useEditMatchPage } from "@/features/match/hooks/use-edit-match";
import { MatchForm } from "@/features/match/ui/match-form";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageLoading } from "@/components/ui/page-loading";

const EditMatchPage = () => {
  const state = useEditMatchPage();
  const { leagueId, seasonId, sessionId } = useParams<{
    leagueId: string;
    seasonId: string;
    sessionId: string;
  }>();
  const backHref =
    leagueId && seasonId && sessionId
      ? `/league/${leagueId}/season/${seasonId}/sessions/${sessionId}/results`
      : "/";
  return (
    <AppShell title="対局編集" backHref={backHref}>
      {state.isLoading ? (
        <PageLoading label="対局編集画面を読み込んでいます…" />
      ) : state.notFound ? (
        <main className="mx-auto max-w-[480px] p-4">
          <EmptyState
            title="対局が見つかりません"
            description="Sessionの結果画面に戻って対局を選び直してください。"
          />
        </main>
      ) : state.error && !state.values ? (
        <main className="mx-auto max-w-[480px] p-4">
          <ErrorState message={state.error} onRetry={state.retry} />
        </main>
      ) : state.values ? (
        <MatchForm
          mode="edit"
          values={state.values}
          constraint={state.constraint}
          members={state.members}
          chomboPenaltyPoints={state.chomboPenaltyPoints}
          allowOffTableKyotaku={state.allowOffTableKyotaku}
          matchIndex={state.matchIndex}
          onMatchIndexChange={state.setMatchIndex}
          error={state.error}
          yakumanErrors={state.yakumanErrors}
          isSubmitting={state.isSubmitting}
          onChange={state.onValuesChange}
          onSubmit={() => void state.handleSubmit()}
        />
      ) : null}
    </AppShell>
  );
};
export default EditMatchPage;
