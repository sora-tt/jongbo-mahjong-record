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
const DEFAULT_RESUME_ERROR_MESSAGE =
  "記録の再開に失敗しました。時間をおいて再度お試しください。";

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

export const useSessionResultsPage = (routePrefix = "") => {
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
  const [isResuming, setIsResuming] = React.useState(false);
  const resumeInFlight = React.useRef(false);
  const routeKey = JSON.stringify([
    params.leagueId,
    params.seasonId,
    params.sessionId,
  ]);
  const currentRouteKey = React.useRef(routeKey);
  currentRouteKey.current = routeKey;
  const [deletingMatchId, setDeletingMatchId] = React.useState<string | null>(
    null
  );
  const [deleteTargetMatchId, setDeleteTargetMatchId] = React.useState<
    string | null
  >(null);
  const [expandedMatchId] = React.useState<string | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [endError, setEndError] = React.useState<string | null>(null);
  const [resumeError, setResumeError] = React.useState<string | null>(null);
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
      setNotFound(false);
      try {
        const [sessionResult, matchesResult] = await Promise.allSettled([
          fetchSessionDetail({ leagueId, seasonId, sessionId }),
          fetchMatches({ leagueId, seasonId, sessionId }),
        ]);

        if (sessionResult.status === "rejected") {
          throw sessionResult.reason;
        }

        setSession(toSession(sessionResult.value));
        if (matchesResult.status === "fulfilled") {
          setMatches(toMatchList(matchesResult.value));
        } else if (
          matchesResult.reason instanceof ApiError &&
          matchesResult.reason.status === 404
        ) {
          setMatches([]);
        } else {
          throw matchesResult.reason;
        }
      } catch (loadError) {
        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace(`${routePrefix}/login`);
          return;
        }
        if (loadError instanceof ApiError && loadError.status === 404) {
          setSession(null);
          setMatches([]);
          setNotFound(true);
          return;
        }
        setError(getApiErrorMessage(loadError, DEFAULT_ERROR_MESSAGE));
      } finally {
        setIsLoading(false);
      }
    },
    [params, routePrefix, router]
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
    setEndError(null);
    try {
      await updateSession({
        leagueId,
        seasonId,
        sessionId,
        endedAt: new Date().toISOString(),
      });
      dispatch(clearRecordingFlow());
      router.push(`${routePrefix}/league/${leagueId}/season/${seasonId}`);
    } catch (endError) {
      if (endError instanceof ApiError && endError.status === 401) {
        router.replace(`${routePrefix}/login`);
        return;
      }
      setEndError(getApiErrorMessage(endError, DEFAULT_END_ERROR_MESSAGE));
    } finally {
      setIsEnding(false);
    }
  }, [dispatch, params, routePrefix, router, session]);

  const handleResumeRecord = React.useCallback(async () => {
    const { leagueId, seasonId, sessionId } = params;
    if (
      !leagueId ||
      !seasonId ||
      !sessionId ||
      !session?.endedAt ||
      resumeInFlight.current
    ) {
      return;
    }

    resumeInFlight.current = true;
    setIsResuming(true);
    setResumeError(null);
    try {
      const updated = await updateSession({
        leagueId,
        seasonId,
        sessionId,
        endedAt: null,
      });
      if (currentRouteKey.current === routeKey) setSession(toSession(updated));
    } catch (resumeFailure) {
      if (resumeFailure instanceof ApiError && resumeFailure.status === 401) {
        router.replace(`${routePrefix}/login`);
      } else if (currentRouteKey.current === routeKey) {
        setResumeError(
          getApiErrorMessage(resumeFailure, DEFAULT_RESUME_ERROR_MESSAGE)
        );
      }
    } finally {
      resumeInFlight.current = false;
      setIsResuming(false);
    }
  }, [params, routeKey, routePrefix, router, session]);

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
        router.replace(`${routePrefix}/login`);
        return;
      }
      setError(getApiErrorMessage(deleteError, DEFAULT_DELETE_ERROR_MESSAGE));
    } finally {
      setDeletingMatchId(null);
    }
  }, [deleteTargetMatchId, load, params, routePrefix, router]);

  const goToResults = React.useCallback(() => {
    const { leagueId, seasonId, sessionId } = params;
    if (leagueId && seasonId && sessionId) {
      router.push(
        `${routePrefix}/league/${leagueId}/season/${seasonId}/sessions/${sessionId}/results`
      );
    }
  }, [params, routePrefix, router]);

  const goToSeason = React.useCallback(() => {
    if (params.leagueId && params.seasonId) {
      router.push(
        `${routePrefix}/league/${params.leagueId}/season/${params.seasonId}`
      );
    }
  }, [params.leagueId, params.seasonId, routePrefix, router]);

  return {
    session,
    matches,
    isLoading,
    isEnding,
    isResuming,
    deletingMatchId,
    deleteTargetMatchId,
    expandedMatchId,
    notFound,
    error,
    endError,
    resumeError,
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
        `${routePrefix}/league/${params.leagueId}/season/${params.seasonId}/sessions/${params.sessionId}/matches/new`
      );
    },
    handleEditMatch: (matchId: string) => {
      if (!params.leagueId || !params.seasonId || !params.sessionId) return;
      router.push(
        `${routePrefix}/league/${params.leagueId}/season/${params.seasonId}/sessions/${params.sessionId}/matches/${matchId}/edit`
      );
    },
    handleEndRecord,
    handleResumeRecord,
    handleRequestDeleteMatch: (matchId: string) =>
      setDeleteTargetMatchId(matchId),
    handleCancelDeleteMatch: () => setDeleteTargetMatchId(null),
    handleConfirmDeleteMatch,
    goToResults,
    goToSeason,
  };
};
