import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { fetchLeagueDetail } from "@/features/league/api";
import { toLeagueDetail } from "@/features/league/model/adapter";
import { fetchSeasonDetail } from "@/features/season/api";
import { toSeasonDetail } from "@/features/season/model/adapter";
import { deleteSession, listSessions } from "@/features/session/api";
import { toSessionList } from "@/features/session/model/adapter";
import { toPointProgressionChart } from "@/features/statistics/model/adapter";
import { CHART_SERIES } from "@/features/statistics/model/chart";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";

const DEFAULT_ERROR_MESSAGE =
  "シーズン詳細の取得に失敗しました。時間をおいて再度お試しください。";
const DEFAULT_DELETE_SESSION_ERROR_MESSAGE =
  "Sessionの削除に失敗しました。時間をおいて再度お試しください。";

type SeasonDetail = ReturnType<typeof toSeasonDetail>;
type SessionSummary = ReturnType<typeof toSessionList>[number];
type ChartSeriesItem = ReturnType<
  typeof toPointProgressionChart
>["series"][number] & {
  colorClassName: string;
  strokeColor: string;
};

type Title = {
  label: string;
  playerName: string;
  value: string;
};

type SessionDeleteContext = {
  routeKey: string;
  sessionId: string;
};

type SessionDeleteTarget = {
  routeKey: string;
  session: SessionSummary;
};

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

export const useSeasonPage = () => {
  const router = useRouter();
  const params = useParams<{ leagueId: string; seasonId: string }>();
  const routeKey = JSON.stringify([params.leagueId, params.seasonId]);
  const currentRouteKeyRef = React.useRef(routeKey);
  currentRouteKeyRef.current = routeKey;
  const [leagueName, setLeagueName] = React.useState("");
  const [season, setSeason] = React.useState<SeasonDetail | null>(null);
  const [sessions, setSessions] = React.useState<SessionSummary[]>([]);
  const [loadedRouteKey, setLoadedRouteKey] = React.useState<string | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [sessionsLoading, setSessionsLoading] = React.useState(true);
  const [sessionsError, setSessionsError] = React.useState<string | null>(null);
  const [seasonNotFound, setSeasonNotFound] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<SessionDeleteTarget | null>(null);
  const deleteTargetSession =
    deleteTarget?.routeKey === routeKey ? deleteTarget.session : null;
  const [deletingSession, setDeletingSession] =
    React.useState<SessionDeleteContext | null>(null);
  const deletingSessionId =
    deletingSession?.routeKey === routeKey ? deletingSession.sessionId : null;
  const [sessionDeleteError, setSessionDeleteError] = React.useState<
    string | null
  >(null);
  const [sessionDeleteRetryAllowed, setSessionDeleteRetryAllowed] =
    React.useState(false);
  const [isRefreshingSessionDelete, setIsRefreshingSessionDelete] =
    React.useState(false);
  const [
    sessionDeleteVerificationPending,
    setSessionDeleteVerificationPending,
  ] = React.useState(false);
  const deletingSessionIdRef = React.useRef<SessionDeleteContext | null>(null);
  const sessionDeleteRefreshTargetRef =
    React.useRef<SessionDeleteContext | null>(null);
  const sessionDeleteRefreshLockRef = React.useRef(false);
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    setDeleteTarget((target) =>
      target?.routeKey === routeKey ? target : null
    );
    const refreshTarget = sessionDeleteRefreshTargetRef.current;
    if (refreshTarget && refreshTarget.routeKey !== routeKey) {
      sessionDeleteRefreshTargetRef.current = null;
      sessionDeleteRefreshLockRef.current = false;
      setSessionDeleteVerificationPending(false);
      setSessionDeleteRetryAllowed(false);
      setSessionDeleteError(null);
      setIsRefreshingSessionDelete(false);
    }
  }, [routeKey]);

  React.useEffect(() => {
    let isActive = true;

    const leagueId = params.leagueId;
    const seasonId = params.seasonId;

    if (!leagueId || !seasonId) {
      setError("leagueId または seasonId が指定されていません");
      setLoadedRouteKey(routeKey);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      setLeagueName("");
      setSeasonNotFound(false);

      setSessionsLoading(true);
      setSessionsError(null);

      const [seasonResult, sessionsResult, leagueResult] =
        await Promise.allSettled([
          fetchSeasonDetail(leagueId, seasonId),
          listSessions(leagueId, seasonId),
          fetchLeagueDetail(leagueId),
        ]);

      if (!isActive) return;

      if (seasonResult.status === "fulfilled") {
        setSeason(toSeasonDetail(seasonResult.value));
        setSeasonNotFound(false);
        setError(null);
      } else if (
        seasonResult.reason instanceof ApiError &&
        seasonResult.reason.status === 401
      ) {
        router.replace("/login");
      } else if (
        seasonResult.reason instanceof ApiError &&
        seasonResult.reason.status === 404
      ) {
        setSeason(null);
        setSeasonNotFound(true);
        setDeleteTarget(null);
        setSessionDeleteRetryAllowed(false);
        sessionDeleteRefreshTargetRef.current = null;
        sessionDeleteRefreshLockRef.current = false;
        setSessionDeleteVerificationPending(false);
        setIsRefreshingSessionDelete(false);
        setError(null);
      } else {
        setError(
          getApiErrorMessage(seasonResult.reason, DEFAULT_ERROR_MESSAGE)
        );
      }
      let refreshedSessions: SessionSummary[] | null = null;
      if (sessionsResult.status === "fulfilled") {
        refreshedSessions = toSessionList(sessionsResult.value);
        setSessions(refreshedSessions);
      } else if (
        sessionsResult.reason instanceof ApiError &&
        sessionsResult.reason.status === 401
      ) {
        router.replace("/login");
      } else if (
        sessionsResult.reason instanceof ApiError &&
        sessionsResult.reason.status === 404
      ) {
        refreshedSessions = [];
        setSessions([]);
        setSessionsError(null);
      } else {
        setSessionsError(
          getApiErrorMessage(
            sessionsResult.reason,
            "Session一覧の取得に失敗しました。"
          )
        );
      }
      setSessionsLoading(false);

      if (leagueResult.status === "fulfilled") {
        setLeagueName(toLeagueDetail(leagueResult.value).name);
      } else if (
        leagueResult.reason instanceof ApiError &&
        leagueResult.reason.status === 401
      ) {
        router.replace("/login");
      }

      const refreshTarget = sessionDeleteRefreshTargetRef.current;
      if (refreshTarget?.routeKey === routeKey) {
        const targetExists = refreshedSessions?.some(
          (session) => String(session.id) === refreshTarget.sessionId
        );
        const verificationCompleted =
          refreshedSessions !== null && seasonResult.status === "fulfilled";
        if (verificationCompleted && !targetExists) {
          setDeleteTarget((target) =>
            target?.routeKey === routeKey &&
            String(target.session.id) === refreshTarget.sessionId
              ? null
              : target
          );
          setSessionDeleteRetryAllowed(false);
          sessionDeleteRefreshTargetRef.current = null;
          setSessionDeleteVerificationPending(false);
        } else if (verificationCompleted && targetExists) {
          setSessionDeleteRetryAllowed(true);
          sessionDeleteRefreshTargetRef.current = null;
          setSessionDeleteVerificationPending(false);
        } else {
          setSessionDeleteRetryAllowed(false);
          setSessionDeleteVerificationPending(true);
        }
        sessionDeleteRefreshLockRef.current = false;
        setIsRefreshingSessionDelete(false);
      }

      setLoadedRouteKey(routeKey);
      setLoading(false);
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [params.leagueId, params.seasonId, retryCount, routeKey, router]);

  const retry = React.useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  React.useEffect(() => {
    if (
      deleteTargetSession &&
      !sessions.some((session) => session.id === deleteTargetSession.id)
    ) {
      setDeleteTarget(null);
    }
  }, [deleteTargetSession, sessions]);

  const handleRequestDeleteSession = React.useCallback(
    (session: SessionSummary) => {
      const currentSession = sessions.find(
        (item) => String(item.id) === String(session.id)
      );
      if (
        loadedRouteKey !== routeKey ||
        loading ||
        sessionsLoading ||
        !currentSession ||
        deletingSessionIdRef.current ||
        sessionDeleteRefreshLockRef.current ||
        sessionDeleteVerificationPending ||
        sessionDeleteRefreshTargetRef.current
      ) {
        return;
      }
      setSessionDeleteError(null);
      setSessionDeleteRetryAllowed(true);
      setDeleteTarget({ routeKey, session: currentSession });
    },
    [
      loadedRouteKey,
      loading,
      routeKey,
      sessions,
      sessionsLoading,
      sessionDeleteVerificationPending,
    ]
  );

  const handleCancelDeleteSession = React.useCallback(() => {
    if (deletingSessionIdRef.current || sessionDeleteRefreshLockRef.current) {
      return;
    }
    setDeleteTarget(null);
    setSessionDeleteRetryAllowed(false);
    setSessionDeleteError(null);
  }, []);

  const handleRetrySessionDeleteStatus = React.useCallback(() => {
    const refreshTarget = sessionDeleteRefreshTargetRef.current;
    if (
      !refreshTarget ||
      refreshTarget.routeKey !== routeKey ||
      sessionDeleteRefreshLockRef.current
    ) {
      return;
    }

    sessionDeleteRefreshLockRef.current = true;
    setSessionDeleteVerificationPending(true);
    setIsRefreshingSessionDelete(true);
    retry();
  }, [routeKey, retry]);

  const handleConfirmDeleteSession = React.useCallback(async () => {
    const { leagueId, seasonId } = params;
    const requestRouteKey = routeKey;
    if (
      !leagueId ||
      !seasonId ||
      !deleteTargetSession ||
      deleteTarget?.routeKey !== requestRouteKey ||
      deletingSessionIdRef.current ||
      sessionDeleteRefreshLockRef.current ||
      sessionDeleteVerificationPending ||
      !sessionDeleteRetryAllowed
    ) {
      return;
    }

    const sessionId = String(deleteTargetSession.id);
    const request = { routeKey: requestRouteKey, sessionId };
    deletingSessionIdRef.current = request;
    setDeletingSession(request);
    setSessionDeleteError(null);

    try {
      await deleteSession({ leagueId, seasonId, sessionId });
      if (currentRouteKeyRef.current !== requestRouteKey) return;
      sessionDeleteRefreshTargetRef.current = request;
      sessionDeleteRefreshLockRef.current = true;
      setSessionDeleteRetryAllowed(false);
      setSessionDeleteVerificationPending(true);
      setIsRefreshingSessionDelete(true);
      setDeleteTarget(null);
      setSessionDeleteError(null);
    } catch (deleteError) {
      if (deleteError instanceof ApiError && deleteError.status === 401) {
        router.replace("/login");
        return;
      }

      if (currentRouteKeyRef.current !== requestRouteKey) return;

      setSessionDeleteError(
        getApiErrorMessage(deleteError, DEFAULT_DELETE_SESSION_ERROR_MESSAGE)
      );
      sessionDeleteRefreshTargetRef.current = request;
      sessionDeleteRefreshLockRef.current = true;
      setSessionDeleteRetryAllowed(false);
      setSessionDeleteVerificationPending(true);
      setIsRefreshingSessionDelete(true);
    } finally {
      if (deletingSessionIdRef.current === request) {
        deletingSessionIdRef.current = null;
      }
      setDeletingSession((deleting) =>
        deleting?.routeKey === requestRouteKey &&
        deleting.sessionId === sessionId
          ? null
          : deleting
      );
    }

    if (currentRouteKeyRef.current === requestRouteKey) retry();
  }, [
    currentRouteKeyRef,
    deleteTarget,
    deleteTargetSession,
    params,
    retry,
    routeKey,
    router,
    sessionDeleteRetryAllowed,
    sessionDeleteVerificationPending,
  ]);

  const titles: Title[] = React.useMemo(() => {
    if (!season) {
      return [];
    }

    return [
      season.seasonRecords?.highestScore
        ? {
            label: "最高スコア",
            playerName: season.seasonRecords.highestScore.userName,
            value: `${season.seasonRecords.highestScore.value.toLocaleString("ja-JP")}pt`,
          }
        : null,
      season.seasonRecords?.avoidLastRate
        ? {
            label: "ラス回避率",
            playerName: season.seasonRecords.avoidLastRate.userName,
            value: formatPercent(season.seasonRecords.avoidLastRate.value),
          }
        : null,
      season.seasonRecords?.top2Rate
        ? {
            label: "連対率",
            playerName: season.seasonRecords.top2Rate.userName,
            value: formatPercent(season.seasonRecords.top2Rate.value),
          }
        : null,
    ].filter((title): title is Title => title !== null);
  }, [season]);

  const pointProgressionChart = React.useMemo(() => {
    if (!season) {
      return {
        series: [],
        data: [],
        isEmpty: true,
        isUncomputed: false,
      };
    }

    return toPointProgressionChart(
      season.pointProgressions,
      season.totalMatchCount
    );
  }, [season]);

  const chartSeries = React.useMemo(
    () =>
      pointProgressionChart.series.map((item, index) => ({
        userId: item.userId,
        userName: item.userName,
        colorClassName: CHART_SERIES[index % CHART_SERIES.length].className,
        strokeColor: CHART_SERIES[index % CHART_SERIES.length].stroke,
      })),
    [pointProgressionChart.series]
  );

  const [visibleUserIds, setVisibleUserIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    setVisibleUserIds(chartSeries.map((item) => item.userId));
  }, [chartSeries]);

  const visibleSeries: ChartSeriesItem[] = React.useMemo(
    () =>
      chartSeries.filter((item) =>
        visibleUserIds.some((userId) => userId === item.userId)
      ),
    [chartSeries, visibleUserIds]
  );

  const handleToggleChartSeries = React.useCallback((userId: string) => {
    setVisibleUserIds((prev) => {
      if (prev.some((id) => id === userId)) {
        return prev.filter((id) => id !== userId);
      }

      return [...prev, userId];
    });
  }, []);

  const handleStartRecording = React.useCallback(() => {
    const leagueId = params.leagueId;
    const seasonId = params.seasonId;

    if (!leagueId || !seasonId) {
      setError("leagueId または seasonId が指定されていません");
      return;
    }
    router.push(
      `/league/${leagueId}/season/${seasonId}/sessions/start/players`
    );
  }, [params.leagueId, params.seasonId, router]);

  return {
    leagueId: params.leagueId,
    seasonId: params.seasonId,
    leagueName,
    season,
    sessions,
    seasonNotFound,
    titles,
    pointProgressionChart,
    chartSeries,
    visibleSeries,
    visibleUserIds,
    loading: loading || loadedRouteKey !== routeKey,
    sessionsLoading,
    sessionsError,
    error,
    deleteTargetSession,
    deletingSessionId,
    isSessionDeleteRequestInFlight: deletingSession !== null,
    sessionDeleteError,
    sessionDeleteRetryAllowed,
    sessionDeleteVerificationPending,
    isRefreshingSessionDelete,
    retry,
    retrySessions: retry,
    handleRequestDeleteSession,
    handleCancelDeleteSession,
    handleRetrySessionDeleteStatus,
    handleConfirmDeleteSession,
    handleStartRecording,
    handleToggleChartSeries,
  };
};
