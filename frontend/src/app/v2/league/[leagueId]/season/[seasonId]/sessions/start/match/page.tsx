"use client";

import { useRecordMatchPage } from "@/features/match/hooks/use-initial-match";
import { MatchForm } from "@/features/match/ui/v2/match-form";

import { AppShell } from "@/components/v2/layout/app-shell";
import { Button } from "@/components/v2/ui/button";
import { EmptyState } from "@/components/v2/ui/empty-state";
import { ErrorState } from "@/components/v2/ui/error-state";
import { PageLoading } from "@/components/v2/ui/page-loading";

const NewMatchPage = () => {
  const state = useRecordMatchPage("/v2");
  return (
    <AppShell>
      {state.isLoading ? (
        <PageLoading label="対局記録画面を読み込んでいます…" />
      ) : state.notFound ? (
        <main className="mx-auto max-w-[480px] p-4">
          <EmptyState
            title="シーズンが見つかりません"
            description="リーグ詳細からシーズンを選び直してください。"
            action={
              <Button variant="secondary" onClick={state.handleBack}>
                戻る
              </Button>
            }
          />
        </main>
      ) : state.error && state.members.length === 0 ? (
        <main className="mx-auto max-w-[480px] p-4">
          <ErrorState message={state.error} onRetry={state.retry} />
          <Button
            variant="tertiary"
            className="mt-3"
            onClick={state.handleBack}
          >
            戻る
          </Button>
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
          onBack={state.handleBack}
        />
      )}
    </AppShell>
  );
};
export default NewMatchPage;
