"use client";

import { useParams } from "next/navigation";

import { useRecordMatchPage } from "@/features/match/hooks/use-additional-match";
import { MatchForm } from "@/features/match/ui/match-form";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageLoading } from "@/components/ui/page-loading";

const NewMatchPage = () => {
  const state = useRecordMatchPage();
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
    <AppShell title="対局を追加" backHref={backHref}>
      {state.isLoading ? (
        <PageLoading label="対局記録画面を読み込んでいます…" />
      ) : state.notFound ? (
        <main className="mx-auto max-w-[480px] p-4">
          <EmptyState
            title="Sessionが見つかりません"
            description="シーズン詳細に戻ってSessionを選び直してください。"
          />
        </main>
      ) : state.error && !state.ready ? (
        <main className="mx-auto max-w-[480px] p-4">
          <ErrorState message={state.error} onRetry={state.retry} />
        </main>
      ) : state.ready ? (
        <MatchForm
          mode="additional"
          values={state.values}
          constraint={state.constraint}
          members={state.members}
          chomboPenaltyPoints={state.chomboPenaltyPoints}
          allowOffTableKyotaku={state.allowOffTableKyotaku}
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
export default NewMatchPage;
