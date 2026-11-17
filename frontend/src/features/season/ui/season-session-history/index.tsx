import * as React from "react";

import { SessionHistory } from "@/features/session/ui/session-history";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { SectionCard } from "@/components/ui/section-card";

import type { useSeasonPage } from "@/features/season/hooks/use-season-page";

type Props = Pick<
  ReturnType<typeof useSeasonPage>,
  | "leagueId"
  | "seasonId"
  | "sessions"
  | "sessionsLoading"
  | "sessionsError"
  | "retrySessions"
>;
export const SeasonSessionHistory = ({
  leagueId,
  seasonId,
  sessions,
  sessionsLoading,
  sessionsError,
  retrySessions,
}: Props) => (
  <SectionCard title="対局履歴">
    {sessionsLoading ? (
      <LoadingState label="対局履歴を読み込んでいます…" />
    ) : sessionsError ? (
      <ErrorState message={sessionsError} onRetry={retrySessions} />
    ) : sessions.length === 0 ? (
      <EmptyState
        title="対局履歴がありません"
        className="!border-0 !bg-transparent p-0"
      />
    ) : (
      <SessionHistory
        sessions={sessions}
        leagueId={leagueId}
        seasonId={seasonId}
      />
    )}
  </SectionCard>
);
