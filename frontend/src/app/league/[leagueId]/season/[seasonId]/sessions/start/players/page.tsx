"use client";

import { useParams } from "next/navigation";

import { usePlayerSelect } from "@/features/session/hooks/use-player-select";
import { PlayerSelection } from "@/features/session/ui/player-selection";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageLoading } from "@/components/ui/page-loading";

const PlayerSelectPage = () => {
  const state = usePlayerSelect();
  const { leagueId, seasonId } = useParams<{
    leagueId: string;
    seasonId: string;
  }>();
  const backHref =
    leagueId && seasonId ? `/league/${leagueId}/season/${seasonId}` : "/";
  return (
    <AppShell title="プレイヤー選択" backHref={backHref}>
      {state.isLoading ? (
        <PageLoading label="プレイヤー候補を読み込んでいます…" />
      ) : state.notFound ? (
        <main className="mx-auto max-w-[480px] p-4">
          <EmptyState
            title="シーズンが見つかりません"
            description="リーグ詳細からシーズンを選び直してください。"
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
          />
        </main>
      ) : (
        <PlayerSelection {...state} />
      )}
    </AppShell>
  );
};

export default PlayerSelectPage;
