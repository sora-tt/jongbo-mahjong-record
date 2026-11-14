"use client";

import { usePlayerSelect } from "@/features/session/hooks/use-player-select";
import { PlayerSelection } from "@/features/session/ui/v2/player-selection";

import { AppShell } from "@/components/v2/layout/app-shell";
import { Button } from "@/components/v2/ui/button";
import { EmptyState } from "@/components/v2/ui/empty-state";
import { ErrorState } from "@/components/v2/ui/error-state";
import { PageLoading } from "@/components/v2/ui/page-loading";

const PlayerSelectPage = () => {
  const state = usePlayerSelect("/v2");
  return (
    <AppShell>
      {state.isLoading ? (
        <PageLoading label="プレイヤー候補を読み込んでいます…" />
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
      ) : state.error ? (
        <main className="mx-auto max-w-[480px] p-4">
          <ErrorState message={state.error} onRetry={state.retry} />
        </main>
      ) : !state.hasCandidates ? (
        <main className="mx-auto max-w-[480px] p-4">
          <EmptyState
            title="選択できる参加者が不足しています"
            description="Sessionには三麻で3人、四麻で4人の参加者が必要です。"
            action={
              <Button variant="secondary" onClick={state.handleBack}>
                戻る
              </Button>
            }
          />
        </main>
      ) : (
        <PlayerSelection {...state} />
      )}
    </AppShell>
  );
};

export default PlayerSelectPage;
