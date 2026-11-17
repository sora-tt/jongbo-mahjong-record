"use client";

import { useParams } from "next/navigation";

import { useRecordMatchPage } from "@/features/match/hooks/use-initial-match";
import { MatchForm } from "@/features/match/ui/v2/match-form";

import { AppShell } from "@/components/v2/layout/app-shell";
import { EmptyState } from "@/components/v2/ui/empty-state";
import { ErrorState } from "@/components/v2/ui/error-state";
import { PageLoading } from "@/components/v2/ui/page-loading";

const NewMatchPage = () => {
  const state = useRecordMatchPage("/v2");
  const { leagueId, seasonId } = useParams<{
    leagueId: string;
    seasonId: string;
  }>();
  const backHref =
    leagueId && seasonId
      ? `/v2/league/${leagueId}/season/${seasonId}/sessions/start/players`
      : "/v2";
  return (
    <AppShell title="対局記録" backHref={backHref}>
      {state.isLoading ? (
        <PageLoading label="対局記録画面を読み込んでいます…" />
      ) : state.notFound ? (
        <main className="mx-auto max-w-[480px] p-4">
          <EmptyState
            title="シーズンが見つかりません"
            description="リーグ詳細からシーズンを選び直してください。"
          />
        </main>
      ) : state.error && state.members.length === 0 ? (
        <main className="mx-auto max-w-[480px] p-4">
          <ErrorState message={state.error} onRetry={state.retry} />
        </main>
      ) : (
        <MatchForm
          mode="initial"
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
      )}
    </AppShell>
  );
};
export default NewMatchPage;
