import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { toMatchList } from "@/features/match/model/adapter";
import { toSession } from "@/features/session/model/adapter";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";
import { deleteMatch, fetchMatches } from "@/lib/api/matches";
import { fetchSessionDetail, updateSession } from "@/lib/api/sessions";
import { useAppDispatch } from "@/store/hooks";
import { clearRecordingFlow } from "@/store/slices/recording-flow-slice";

const DEFAULT_ERROR_MESSAGE =
  "Sessionの結果取得に失敗しました。時間をおいて再度お試しください。";
const DEFAULT_DELETE_ERROR_MESSAGE =
  "対局結果の削除に失敗しました。時間をおいて再度お試しください。";
const DEFAULT_END_ERROR_MESSAGE =
  "Sessionの終了に失敗しました。時間をおいて再度お試しください。";

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "未終了";

export const useSessionResultsPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useParams<{
    leagueId: string;
    seasonId: string;
    sessionId: string;
  }>();
  const [session, setSession] = React.useState<ReturnType<
    typeof toSession
  > | null>(null);
  const [matches, setMatches] = React.useState<ReturnType<typeof toMatchList>>(
    []
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEnding, setIsEnding] = React.useState(false);
  const [deletingMatchId, setDeletingMatchId] = React.useState<string | null>(
    null
  );
  const [deleteTargetMatchId, setDeleteTargetMatchId] = React.useState<
    string | null
  >(null);
  const [expandedMatchId, setExpandedMatchId] = React.useState<string | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const load = React.useCallback(
    async (options?: { showLoading?: boolean }) => {
      const { leagueId, seasonId, sessionId } = params;
      if (!leagueId || !seasonId || !sessionId) {
        setError("必要なIDが指定されていません");
        setIsLoading(false);
        return;
      }

      if (options?.showLoading ?? true) setIsLoading(true);
      setError(null);
      try {
        const [sessionDto, matchesDto] = await Promise.all([
          fetchSessionDetail({ leagueId, seasonId, sessionId }),
          fetchMatches({ leagueId, seasonId, sessionId }),
        ]);
        setSession(toSession(sessionDto));
        setMatches(toMatchList(matchesDto));
      } catch (loadError) {
        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
          return;
        }
        setError(getApiErrorMessage(loadError, DEFAULT_ERROR_MESSAGE));
      } finally {
        setIsLoading(false);
      }
    },
    [params, router]
  );

  React.useEffect(() => {
    void load();
  }, [load, retryCount]);

  const handleEndRecord = React.useCallback(async () => {
    const { leagueId, seasonId, sessionId } = params;
    if (!leagueId || !seasonId || !sessionId || !session || session.endedAt) {
      return;
    }

    setIsEnding(true);
    setError(null);
    try {
      await updateSession({
        leagueId,
        seasonId,
        sessionId,
        endedAt: new Date().toISOString(),
      });
      dispatch(clearRecordingFlow());
      await load({ showLoading: false });
    } catch (endError) {
      if (endError instanceof ApiError && endError.status === 401) {
        router.replace("/login");
        return;
      }
      setError(getApiErrorMessage(endError, DEFAULT_END_ERROR_MESSAGE));
    } finally {
      setIsEnding(false);
    }
  }, [dispatch, load, params, router, session]);

  const handleConfirmDeleteMatch = React.useCallback(async () => {
    const { leagueId, seasonId, sessionId } = params;
    if (!leagueId || !seasonId || !sessionId || !deleteTargetMatchId) return;

    setDeletingMatchId(deleteTargetMatchId);
    setError(null);
    try {
      await deleteMatch({
        leagueId,
        seasonId,
        sessionId,
        matchId: deleteTargetMatchId,
      });
      setDeleteTargetMatchId(null);
      await load({ showLoading: false });
    } catch (deleteError) {
      if (deleteError instanceof ApiError && deleteError.status === 401) {
        router.replace("/login");
        return;
      }
      setError(getApiErrorMessage(deleteError, DEFAULT_DELETE_ERROR_MESSAGE));
    } finally {
      setDeletingMatchId(null);
    }
  }, [deleteTargetMatchId, load, params, router]);

  const goToResults = React.useCallback(() => {
    const { leagueId, seasonId, sessionId } = params;
    if (leagueId && seasonId && sessionId) {
      router.push(
        `/league/${leagueId}/season/${seasonId}/sessions/${sessionId}/results`
      );
    }
  }, [params, router]);

  const goToSeason = React.useCallback(() => {
    if (params.leagueId && params.seasonId) {
      router.push(`/league/${params.leagueId}/season/${params.seasonId}`);
    }
  }, [params.leagueId, params.seasonId, router]);

  return {
    session,
    matches,
    isLoading,
    isEnding,
    deletingMatchId,
    deleteTargetMatchId,
    expandedMatchId,
    error,
    retry: () => setRetryCount((count) => count + 1),
    isEnded: Boolean(session?.endedAt),
    formatDate,
    handleAddRecord: () => {
      if (
        session?.endedAt ||
        !params.leagueId ||
        !params.seasonId ||
        !params.sessionId
      )
        return;
      router.push(
        `/league/${params.leagueId}/season/${params.seasonId}/sessions/${params.sessionId}/matches/new`
      );
    },
    handleEditMatch: (matchId: string) => {
      if (!params.leagueId || !params.seasonId || !params.sessionId) return;
      router.push(
        `/league/${params.leagueId}/season/${params.seasonId}/sessions/${params.sessionId}/matches/${matchId}/edit`
      );
    },
    handleEndRecord,
    handleToggleMatch: (matchId: string) =>
      setExpandedMatchId((current) => (current === matchId ? null : matchId)),
    handleRequestDeleteMatch: (matchId: string) =>
      setDeleteTargetMatchId(matchId),
    handleCancelDeleteMatch: () => setDeleteTargetMatchId(null),
    handleConfirmDeleteMatch,
    goToResults,
    goToSeason,
  };
};
