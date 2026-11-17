"use client";

import { Plus } from "lucide-react";

import { useSeasonPage } from "@/features/season/hooks/use-season-page";
import { SeasonProgress } from "@/features/season/ui/v2/season-progress";
import { SeasonSessionHistory } from "@/features/season/ui/v2/season-session-history";
import { SeasonStandings } from "@/features/season/ui/v2/season-standings";
import { SeasonTitles } from "@/features/season/ui/v2/season-titles";
import { formatDetailTitle } from "@/lib/name-suffix";

import { AppShell } from "@/components/v2/layout/app-shell";
import { Button } from "@/components/v2/ui/button";
import { ButtonLink } from "@/components/v2/ui/button-link";
import { EmptyState } from "@/components/v2/ui/empty-state";
import { ErrorState } from "@/components/v2/ui/error-state";
import { PageLoading } from "@/components/v2/ui/page-loading";

const SeasonPage = () => {
  const state = useSeasonPage("/v2");
  const { leagueId, seasonId, leagueName, season } = state;
  return (
    <AppShell
      title={state.loading ? "" : formatDetailTitle(season?.name, "シーズン")}
      backHref={`/v2/league/${leagueId}`}
      settingsHref={`/v2/league/${leagueId}/season/${seasonId}/edit`}
    >
      {state.loading ? (
        <PageLoading label="シーズン情報を読み込んでいます…" />
      ) : state.error ? (
        <main className="mx-auto max-w-[480px] p-4">
          <ErrorState message={state.error} onRetry={state.retry} />
        </main>
      ) : !season ? (
        <main className="mx-auto max-w-[480px] p-4">
          <EmptyState
            title={
              state.seasonNotFound
                ? "シーズンが見つかりません"
                : "シーズン情報がありません"
            }
            description="リーグ詳細からシーズンを選び直してください。"
            action={
              <ButtonLink href={`/v2/league/${leagueId}`} variant="secondary">
                リーグ詳細へ戻る
              </ButtonLink>
            }
          />
        </main>
      ) : (
        <>
          <main className="mx-auto flex max-w-[480px] flex-col gap-4 px-4 pb-[calc(84px+env(safe-area-inset-bottom))] pt-4">
            <SeasonStandings
              season={season}
              leagueId={leagueId}
              seasonId={seasonId}
              leagueName={leagueName}
            />
            <SeasonProgress {...state} />
            <SeasonTitles season={season} />
            <SeasonSessionHistory {...state} />
          </main>
          <footer className="pointer-events-none fixed inset-x-0 bottom-[calc(16px+env(safe-area-inset-bottom))] z-30 flex justify-center px-4">
            <Button
              size="lg"
              onClick={state.handleStartRecording}
              leadingIcon={<Plus size={20} aria-hidden="true" />}
              className="pointer-events-auto w-[148px] shadow-[0_4px_14px_rgba(109,79,82,0.17)]"
            >
              記録する
            </Button>
          </footer>
        </>
      )}
    </AppShell>
  );
};
export default SeasonPage;
