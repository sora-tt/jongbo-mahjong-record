import * as React from "react";

import { useRouter } from "next/navigation";

import { mergeStatisticsAnalysisPages } from "@/app/stats/model/page";
import {
  getCurrentUser,
  getPersonalStatisticsAnalysis,
  getPersonalStatisticsSummary,
  getStatisticsMatchHistory,
  getUserStats,
  listJoiningSeasons,
  listStatisticsLeagueMembers,
  listStatisticsSeasonMembers,
} from "@/features/statistics/api";
import {
  toJoiningSeason,
  toPersonalStatisticsAnalysisView,
  toPersonalStatisticsSummaryView,
  toStatisticsMatchHistoryView,
  toUserStats,
} from "@/features/statistics/model/adapter";
import {
  createStatisticsQueryCache,
  createStatisticsQueryKey,
  createStatisticsScopeKey,
  createHistoryLoadingLifecycle,
  canLoadStatisticsTarget,
  isCurrentStatisticsRequest,
  resolveStatisticsMembersFailure,
  selectStatisticsScope,
  selectStatisticsTarget,
  type StatisticsDimension,
  type StatisticsGroupBy,
  type StatisticsScopeFilters,
  type StatisticsSelection,
  type StatisticsView,
  type StatisticsWindowSize,
} from "@/features/statistics/model/query-cache";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";

const DEFAULT_INITIAL_ERROR_MESSAGE =
  "個人成績画面の取得に失敗しました。時間をおいて再度お試しください。";
const DEFAULT_STATS_ERROR_MESSAGE =
  "個人成績の取得に失敗しました。時間をおいて再度お試しください。";
const DEFAULT_QUERY_ERROR_MESSAGE =
  "成績の取得に失敗しました。時間をおいて再度お試しください。";
const DEFAULT_MEMBERS_ERROR_MESSAGE =
  "表示対象者の一覧を取得できませんでした。再試行してください。";

export type StatsStatus =
  | "idle"
  | "loading"
  | "success"
  | "uncomputed"
  | "error";

type QueryStatus =
  | "idle"
  | "loading"
  | "ready"
  | "empty"
  | "uncomputed"
  | "error";
type QueryState<TValue> = {
  key: string | null;
  status: QueryStatus;
  data: TValue | null;
  error: string | null;
};
type JoiningSeasonOption = ReturnType<typeof toJoiningSeason> & {
  id: string;
};
type StatisticsMemberOption = { userId: string; userName: string };
type MembersState = {
  key: string | null;
  status: "idle" | "loading" | "ready" | "error";
  data: StatisticsMemberOption[];
  error: string | null;
};

const toApiScope = (scope: StatisticsScopeFilters) => ({
  scopeType: scope.scopeType,
  ...(scope.scopeType !== "overall" && scope.leagueId
    ? { leagueId: scope.leagueId }
    : {}),
  ...(scope.scopeType === "season" && scope.seasonId
    ? { seasonId: scope.seasonId }
    : {}),
  ...(scope.from ? { from: scope.from } : {}),
  ...(scope.to ? { to: scope.to } : {}),
  gameType: scope.gameType,
});

const getResultStatus = (data: { status: string }): QueryStatus => {
  if (data.status === "uncomputed") return "uncomputed";
  if (data.status === "empty") return "empty";
  return "ready";
};

const initialQueryState = <TValue>(): QueryState<TValue> => ({
  key: null,
  status: "idle",
  data: null,
  error: null,
});

const loadScopeMembers = async (
  scope: Pick<StatisticsScopeFilters, "scopeType" | "leagueId" | "seasonId">
): Promise<StatisticsMemberOption[]> => {
  const members =
    scope.scopeType === "league" && scope.leagueId
      ? await listStatisticsLeagueMembers(scope.leagueId)
      : scope.scopeType === "season" && scope.leagueId && scope.seasonId
        ? await listStatisticsSeasonMembers(scope.leagueId, scope.seasonId)
        : [];

  return members.map((member) => ({
    userId: String(member.userId),
    userName: member.userName,
  }));
};

export const useStatistics = () => {
  const router = useRouter();
  const queryCache = React.useRef(createStatisticsQueryCache());
  const [viewerUserId, setViewerUserId] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [userName, setUserName] = React.useState("");
  const [joiningLeagueSeasons, setJoiningLeagueSeasons] = React.useState<
    JoiningSeasonOption[]
  >([]);
  const [selectedLeagueSeasonId, setSelectedLeagueSeasonId] =
    React.useState("");
  const [selectedStats, setSelectedStats] = React.useState<ReturnType<
    typeof toUserStats
  > | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [initialError, setInitialError] = React.useState<string | null>(null);
  const [statsError, setStatsError] = React.useState<string | null>(null);
  const [statsStatus, setStatsStatus] = React.useState<StatsStatus>("idle");
  const [retryCount, setRetryCount] = React.useState(0);
  const [selection, setSelection] = React.useState<StatisticsSelection>({
    viewerUserId: "",
    targetUserId: "",
    scope: { scopeType: "overall", gameType: "all" },
    activeView: "overview",
    dimension: "period",
    groupBy: "day",
    windowSize: 10,
    historyCursor: null,
  });
  const [summaryState, setSummaryState] =
    React.useState<
      QueryState<ReturnType<typeof toPersonalStatisticsSummaryView>>
    >(initialQueryState);
  const [analysisState, setAnalysisState] =
    React.useState<
      QueryState<ReturnType<typeof toPersonalStatisticsAnalysisView>>
    >(initialQueryState);
  const [historyState, setHistoryState] =
    React.useState<QueryState<ReturnType<typeof toStatisticsMatchHistoryView>>>(
      initialQueryState
    );
  const [historyError, setHistoryError] = React.useState<string | null>(null);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = React.useState(false);
  const [analysisMoreError, setAnalysisMoreError] = React.useState<
    string | null
  >(null);
  const [isLoadingMoreAnalysis, setIsLoadingMoreAnalysis] =
    React.useState(false);
  const [membersState, setMembersState] = React.useState<MembersState>({
    key: null,
    status: "idle",
    data: [],
    error: null,
  });
  const [summaryRetryCount, setSummaryRetryCount] = React.useState(0);
  const [analysisRetryCount, setAnalysisRetryCount] = React.useState(0);
  const [historyRetryCount, setHistoryRetryCount] = React.useState(0);
  const [membersRetryCount, setMembersRetryCount] = React.useState(0);
  const summaryRequestKeyRef = React.useRef("");
  const analysisRequestKeyRef = React.useRef("");
  const analysisRequestId = React.useRef(0);
  const analysisLoadingLifecycle = React.useRef(
    createHistoryLoadingLifecycle()
  );
  const historyBaseKeyRef = React.useRef("");
  const historyRequestId = React.useRef(0);
  const historyLoadingLifecycle = React.useRef(createHistoryLoadingLifecycle());
  const statsRequestId = React.useRef(0);
  const selectionRef = React.useRef(selection);
  selectionRef.current = selection;

  const scopeKey = createStatisticsScopeKey(selection.scope);
  const canLoadCurrentTarget = canLoadStatisticsTarget(selection, scopeKey, {
    scopeKey: membersState.key,
    status: membersState.status,
    memberUserIds: membersState.data.map((member) => member.userId),
  });
  const summaryQueryKey = createStatisticsQueryKey({
    ...selection,
    view: "summary",
  });
  const analysisQueryKey = createStatisticsQueryKey({
    ...selection,
    view: "analysis",
  });
  const historyBaseQueryKey = createStatisticsQueryKey({
    ...selection,
    view: "history",
    limit: 50,
    cursor: null,
  });
  const apiScope = React.useMemo(
    () => toApiScope(selection.scope),
    [selection.scope]
  );

  summaryRequestKeyRef.current = summaryQueryKey;
  analysisRequestKeyRef.current = analysisQueryKey;
  historyBaseKeyRef.current = historyBaseQueryKey;

  React.useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setInitialError(null);
      setUserId("");
      setUserName("");
      setJoiningLeagueSeasons([]);
      setSelectedLeagueSeasonId("");
      setSelectedStats(null);
      setStatsError(null);
      setStatsStatus("idle");
      statsRequestId.current += 1;

      try {
        const me = await getCurrentUser();
        if (!isActive) return;

        const id = String(me.id);
        setViewerUserId(id);
        setUserId(id);
        setUserName(me.name);
        setSelection((current) => ({
          ...current,
          viewerUserId: id,
          targetUserId: id,
        }));

        void listJoiningSeasons(id)
          .then((seasons) => {
            if (!isActive) return;
            setJoiningLeagueSeasons(
              seasons.map((season) => {
                const option = toJoiningSeason(season);
                return {
                  ...option,
                  id: `${option.leagueId}:${option.seasonId}`,
                };
              })
            );
          })
          .catch(() => {
            // The legacy season selector is independent from the statistics summary.
          });
      } catch (loadError) {
        if (!isActive) return;

        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
          return;
        }

        setInitialError(
          getApiErrorMessage(loadError, DEFAULT_INITIAL_ERROR_MESSAGE)
        );
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [retryCount, router]);

  React.useEffect(() => {
    if (!viewerUserId || selection.scope.scopeType === "overall") {
      setMembersState({ key: scopeKey, status: "idle", data: [], error: null });
      return;
    }

    const cached =
      queryCache.current.getMembers<StatisticsMemberOption[]>(scopeKey);
    if (cached) {
      setMembersState({
        key: scopeKey,
        status: "ready",
        data: cached,
        error: null,
      });
      return;
    }

    let isActive = true;
    setMembersState({
      key: scopeKey,
      status: "loading",
      data: [],
      error: null,
    });

    void queryCache.current
      .fetchMembers(scopeKey, () =>
        loadScopeMembers({
          scopeType: selection.scope.scopeType,
          leagueId: selection.scope.leagueId,
          seasonId: selection.scope.seasonId,
        })
      )
      .then((members) => {
        if (!isActive) return;
        const currentSelection = selectionRef.current;
        setMembersState({
          key: scopeKey,
          status: "ready",
          data: members,
          error: null,
        });
        if (
          !members.some(
            (member) => member.userId === currentSelection.targetUserId
          )
        ) {
          setSelection((current) =>
            current.targetUserId === currentSelection.targetUserId
              ? selectStatisticsTarget(current, current.viewerUserId)
              : current
          );
        }
      })
      .catch((membersError: unknown) => {
        if (!isActive) return;
        if (membersError instanceof ApiError && membersError.status === 401) {
          router.replace("/login");
        }
        const currentSelection = selectionRef.current;
        const failure = resolveStatisticsMembersFailure(currentSelection);
        setMembersState({
          key: scopeKey,
          status: failure.rosterStatus,
          data: [],
          error: getApiErrorMessage(
            membersError,
            DEFAULT_MEMBERS_ERROR_MESSAGE
          ),
        });
        if (failure.selection.targetUserId !== currentSelection.targetUserId) {
          setSelection((current) =>
            current.targetUserId === currentSelection.targetUserId
              ? failure.selection
              : current
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    membersRetryCount,
    router,
    scopeKey,
    selection.scope.scopeType,
    selection.scope.leagueId,
    selection.scope.seasonId,
    viewerUserId,
  ]);

  React.useEffect(() => {
    if (!viewerUserId || !canLoadCurrentTarget) return;

    const cached =
      queryCache.current.get<
        ReturnType<typeof toPersonalStatisticsSummaryView>
      >(summaryQueryKey);
    if (cached) {
      setSummaryState({
        key: summaryQueryKey,
        status: getResultStatus(cached),
        data: cached,
        error: null,
      });
      return;
    }

    let isActive = true;
    setSummaryState({
      key: summaryQueryKey,
      status: "loading",
      data: null,
      error: null,
    });

    void queryCache.current
      .fetch(summaryQueryKey, async () => {
        const response = await getPersonalStatisticsSummary({
          targetUserId: selection.targetUserId,
          query: apiScope,
        });
        return toPersonalStatisticsSummaryView(
          response,
          selection.targetUserId
        );
      })
      .then((data) => {
        if (
          !isCurrentStatisticsRequest(
            summaryQueryKey,
            summaryRequestKeyRef.current,
            isActive
          )
        )
          return;
        setSummaryState({
          key: summaryQueryKey,
          status: getResultStatus(data),
          data,
          error: null,
        });
      })
      .catch((loadError: unknown) => {
        if (
          !isCurrentStatisticsRequest(
            summaryQueryKey,
            summaryRequestKeyRef.current,
            isActive
          )
        )
          return;
        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
        }
        setSummaryState({
          key: summaryQueryKey,
          status: "error",
          data: null,
          error: getApiErrorMessage(loadError, DEFAULT_QUERY_ERROR_MESSAGE),
        });
      });

    return () => {
      isActive = false;
    };
  }, [
    apiScope,
    router,
    selection.targetUserId,
    summaryQueryKey,
    summaryRetryCount,
    canLoadCurrentTarget,
    viewerUserId,
  ]);

  React.useEffect(() => {
    if (
      !viewerUserId ||
      !canLoadCurrentTarget ||
      selection.activeView !== "analysis"
    ) {
      return;
    }
    const analysisLoading = analysisLoadingLifecycle.current;
    const requestId = analysisRequestId.current + 1;
    analysisRequestId.current = requestId;
    setAnalysisMoreError(null);

    const cached =
      queryCache.current.get<
        ReturnType<typeof toPersonalStatisticsAnalysisView>
      >(analysisQueryKey);
    if (cached) {
      setAnalysisState({
        key: analysisQueryKey,
        status: getResultStatus(cached),
        data: cached,
        error: null,
      });
      return () => {
        analysisRequestId.current += 1;
        if (analysisLoading.cancel()) setIsLoadingMoreAnalysis(false);
      };
    }

    let isActive = true;
    setAnalysisState({
      key: analysisQueryKey,
      status: "loading",
      data: null,
      error: null,
    });

    const query = {
      ...apiScope,
      dimension: selection.dimension,
      ...(selection.dimension === "period"
        ? { groupBy: selection.groupBy }
        : {}),
      windowSize: `${selection.windowSize}` as "10" | "20" | "50",
    };

    void queryCache.current
      .fetch(analysisQueryKey, async () => {
        const response = await getPersonalStatisticsAnalysis({
          targetUserId: selection.targetUserId,
          query,
        });
        return toPersonalStatisticsAnalysisView(
          response,
          selection.targetUserId
        );
      })
      .then((data) => {
        if (
          !isCurrentStatisticsRequest(
            analysisQueryKey,
            analysisRequestKeyRef.current,
            isActive
          ) ||
          analysisRequestId.current !== requestId
        )
          return;
        setAnalysisState({
          key: analysisQueryKey,
          status: getResultStatus(data),
          data,
          error: null,
        });
      })
      .catch((loadError: unknown) => {
        if (
          !isCurrentStatisticsRequest(
            analysisQueryKey,
            analysisRequestKeyRef.current,
            isActive
          ) ||
          analysisRequestId.current !== requestId
        )
          return;
        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
        }
        setAnalysisState({
          key: analysisQueryKey,
          status: "error",
          data: null,
          error: getApiErrorMessage(loadError, DEFAULT_QUERY_ERROR_MESSAGE),
        });
      });

    return () => {
      isActive = false;
      analysisRequestId.current += 1;
      if (analysisLoading.cancel()) setIsLoadingMoreAnalysis(false);
    };
  }, [
    analysisQueryKey,
    analysisRetryCount,
    apiScope,
    canLoadCurrentTarget,
    router,
    selection.activeView,
    selection.dimension,
    selection.groupBy,
    selection.targetUserId,
    selection.windowSize,
    viewerUserId,
  ]);

  React.useEffect(() => {
    if (
      !viewerUserId ||
      !canLoadCurrentTarget ||
      selection.activeView !== "history"
    ) {
      return;
    }
    const historyLoading = historyLoadingLifecycle.current;

    const cached =
      queryCache.current.get<ReturnType<typeof toStatisticsMatchHistoryView>>(
        historyBaseQueryKey
      );
    const requestId = historyRequestId.current + 1;
    historyRequestId.current = requestId;

    if (cached) {
      setHistoryState({
        key: historyBaseQueryKey,
        status: getResultStatus(cached),
        data: cached,
        error: null,
      });
      setHistoryError(null);
      setSelection((current) =>
        historyBaseKeyRef.current === historyBaseQueryKey
          ? { ...current, historyCursor: cached.nextCursor ?? null }
          : current
      );
      return () => {
        historyRequestId.current += 1;
        if (historyLoading.cancel()) {
          setIsLoadingMoreHistory(false);
        }
      };
    }

    let isActive = true;
    setHistoryError(null);
    setHistoryState({
      key: historyBaseQueryKey,
      status: "loading",
      data: null,
      error: null,
    });

    void queryCache.current
      .fetch(historyBaseQueryKey, async () => {
        const response = await getStatisticsMatchHistory({
          targetUserId: selection.targetUserId,
          query: { ...apiScope, limit: "50" },
        });
        return toStatisticsMatchHistoryView(response, selection.targetUserId);
      })
      .then((data) => {
        if (
          !isCurrentStatisticsRequest(
            historyBaseQueryKey,
            historyBaseKeyRef.current,
            isActive
          ) ||
          historyRequestId.current !== requestId
        ) {
          return;
        }
        setHistoryState({
          key: historyBaseQueryKey,
          status: getResultStatus(data),
          data,
          error: null,
        });
        setSelection((current) =>
          historyBaseKeyRef.current === historyBaseQueryKey
            ? { ...current, historyCursor: data.nextCursor ?? null }
            : current
        );
      })
      .catch((loadError: unknown) => {
        if (
          !isCurrentStatisticsRequest(
            historyBaseQueryKey,
            historyBaseKeyRef.current,
            isActive
          ) ||
          historyRequestId.current !== requestId
        ) {
          return;
        }
        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
        }
        setHistoryState({
          key: historyBaseQueryKey,
          status: "error",
          data: null,
          error: getApiErrorMessage(loadError, DEFAULT_QUERY_ERROR_MESSAGE),
        });
      });

    return () => {
      isActive = false;
      historyRequestId.current += 1;
      if (historyLoading.cancel()) {
        setIsLoadingMoreHistory(false);
      }
    };
  }, [
    apiScope,
    historyBaseQueryKey,
    historyRetryCount,
    router,
    canLoadCurrentTarget,
    selection.activeView,
    selection.targetUserId,
    viewerUserId,
  ]);

  const onChangeScope = React.useCallback((scope: StatisticsScopeFilters) => {
    const members = queryCache.current.getMembers<StatisticsMemberOption[]>(
      createStatisticsScopeKey(scope)
    );
    setSelection((current) =>
      selectStatisticsScope(
        current,
        scope,
        members?.map((member) => member.userId) ?? null
      )
    );
  }, []);

  const onChangeTarget = React.useCallback((targetUserId: string) => {
    setSelection((current) => {
      const members = queryCache.current.getMembers<StatisticsMemberOption[]>(
        createStatisticsScopeKey(current.scope)
      );
      if (
        current.scope.scopeType === "overall" ||
        !members?.some((member) => member.userId === targetUserId)
      ) {
        return current;
      }
      return selectStatisticsTarget(current, targetUserId);
    });
  }, []);

  const onChangeDateRange = React.useCallback((from?: string, to?: string) => {
    setSelection((current) => ({
      ...current,
      scope: {
        ...current.scope,
        ...(from ? { from } : { from: undefined }),
        ...(to ? { to } : { to: undefined }),
      },
    }));
  }, []);

  const onChangeGameType = React.useCallback(
    (gameType: StatisticsScopeFilters["gameType"]) => {
      setSelection((current) => ({
        ...current,
        scope: { ...current.scope, gameType },
      }));
    },
    []
  );

  const onChangeActiveView = React.useCallback((activeView: StatisticsView) => {
    setSelection((current) => ({ ...current, activeView }));
  }, []);

  const onChangeDimension = React.useCallback(
    (dimension: StatisticsDimension) => {
      setSelection((current) => ({ ...current, dimension }));
    },
    []
  );

  const onChangeGroupBy = React.useCallback((groupBy: StatisticsGroupBy) => {
    setSelection((current) => ({ ...current, groupBy }));
  }, []);

  const onChangeWindowSize = React.useCallback(
    (windowSize: StatisticsWindowSize) => {
      setSelection((current) => ({ ...current, windowSize }));
    },
    []
  );

  const loadMoreHistory = React.useCallback(async () => {
    const cursor = selection.historyCursor;
    if (
      !cursor ||
      !historyState.data ||
      historyState.key !== historyBaseQueryKey ||
      isLoadingMoreHistory ||
      historyLoadingLifecycle.current.isLoading()
    ) {
      return;
    }

    const loadingGeneration = historyLoadingLifecycle.current.start();
    const requestId = historyRequestId.current + 1;
    historyRequestId.current = requestId;
    setIsLoadingMoreHistory(true);
    setHistoryError(null);

    try {
      const nextPageKey = createStatisticsQueryKey({
        ...selection,
        view: "history",
        limit: 50,
        cursor,
      });
      const nextPage = await queryCache.current.fetch(nextPageKey, async () => {
        const response = await getStatisticsMatchHistory({
          targetUserId: selection.targetUserId,
          query: { ...apiScope, limit: "50", cursor },
        });
        return toStatisticsMatchHistoryView(response, selection.targetUserId);
      });

      if (
        historyRequestId.current !== requestId ||
        historyBaseKeyRef.current !== historyBaseQueryKey
      ) {
        return;
      }

      if (
        historyState.data?.status === "ready" &&
        nextPage.status === "ready"
      ) {
        const accumulatedHistory = {
          ...nextPage,
          items: [...historyState.data.items, ...nextPage.items],
        };
        queryCache.current.set(historyBaseQueryKey, accumulatedHistory);
        setHistoryState({
          key: historyBaseQueryKey,
          status: getResultStatus(nextPage),
          error: null,
          data: accumulatedHistory,
        });
      }
      setSelection((current) =>
        historyBaseKeyRef.current === historyBaseQueryKey
          ? { ...current, historyCursor: nextPage.nextCursor ?? null }
          : current
      );
    } catch (loadError) {
      if (
        historyRequestId.current === requestId &&
        historyBaseKeyRef.current === historyBaseQueryKey
      ) {
        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
        }
        setHistoryError(
          getApiErrorMessage(loadError, DEFAULT_QUERY_ERROR_MESSAGE)
        );
      }
    } finally {
      if (historyLoadingLifecycle.current.finish(loadingGeneration)) {
        setIsLoadingMoreHistory(false);
      }
    }
  }, [
    apiScope,
    historyBaseQueryKey,
    historyState.data,
    historyState.key,
    isLoadingMoreHistory,
    router,
    selection,
  ]);

  const retrySummary = React.useCallback(
    () => setSummaryRetryCount((count) => count + 1),
    []
  );
  const retryAnalysis = React.useCallback(
    () => setAnalysisRetryCount((count) => count + 1),
    []
  );
  const retryHistory = React.useCallback(
    () => setHistoryRetryCount((count) => count + 1),
    []
  );
  const retryMembers = React.useCallback(
    () => setMembersRetryCount((count) => count + 1),
    []
  );

  const onChangeLeagueSeason = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      statsRequestId.current += 1;
      setSelectedLeagueSeasonId(event.target.value);
      setSelectedStats(null);
      setStatsError(null);
      setStatsStatus("idle");
    },
    []
  );

  const loadStats = React.useCallback(async () => {
    if (!selectedLeagueSeasonId || !userId) {
      setSelectedStats(null);
      setStatsStatus("idle");
      return;
    }

    const selectedSeason = joiningLeagueSeasons.find(
      (season) => season.id === selectedLeagueSeasonId
    );
    if (!selectedSeason) {
      setSelectedStats(null);
      setStatsStatus("idle");
      return;
    }

    const requestId = statsRequestId.current + 1;
    statsRequestId.current = requestId;
    setStatsStatus("loading");
    setStatsError(null);

    try {
      const stats = await getUserStats({
        userId,
        scopeType: "season",
        leagueId: String(selectedSeason.leagueId),
        seasonId: String(selectedSeason.seasonId),
      });

      if (statsRequestId.current !== requestId) return;

      setSelectedStats(toUserStats(stats));
      setStatsStatus("success");
    } catch (loadError) {
      if (statsRequestId.current !== requestId) return;

      if (loadError instanceof ApiError && loadError.status === 401) {
        router.replace("/login");
        return;
      }

      if (loadError instanceof ApiError && loadError.status === 404) {
        setSelectedStats(null);
        setStatsStatus("uncomputed");
        return;
      }

      setSelectedStats(null);
      setStatsError(getApiErrorMessage(loadError, DEFAULT_STATS_ERROR_MESSAGE));
      setStatsStatus("error");
    }
  }, [joiningLeagueSeasons, router, selectedLeagueSeasonId, userId]);

  const onChangeLegacySeasonAndScope = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onChangeLeagueSeason(event);
      const id = event.target.value;
      const selectedSeason = joiningLeagueSeasons.find(
        (season) => season.id === id
      );
      if (selectedSeason) {
        onChangeScope({
          scopeType: "season",
          leagueId: String(selectedSeason.leagueId),
          seasonId: String(selectedSeason.seasonId),
          gameType: "all",
        });
      }
    },
    [joiningLeagueSeasons, onChangeLeagueSeason, onChangeScope]
  );

  const visibleSummaryState =
    summaryState.key === summaryQueryKey
      ? summaryState
      : queryCache.current.get<
            ReturnType<typeof toPersonalStatisticsSummaryView>
          >(summaryQueryKey)
        ? {
            key: summaryQueryKey,
            status: getResultStatus(
              queryCache.current.get<
                ReturnType<typeof toPersonalStatisticsSummaryView>
              >(summaryQueryKey)!
            ),
            data: queryCache.current.get<
              ReturnType<typeof toPersonalStatisticsSummaryView>
            >(summaryQueryKey)!,
            error: null,
          }
        : {
            key: summaryQueryKey,
            status: viewerUserId ? (isLoading ? "idle" : "loading") : "idle",
            data: null,
            error: null,
          };
  const visibleAnalysisState =
    analysisState.key === analysisQueryKey
      ? analysisState
      : queryCache.current.get<
            ReturnType<typeof toPersonalStatisticsAnalysisView>
          >(analysisQueryKey)
        ? {
            key: analysisQueryKey,
            status: getResultStatus(
              queryCache.current.get<
                ReturnType<typeof toPersonalStatisticsAnalysisView>
              >(analysisQueryKey)!
            ),
            data: queryCache.current.get<
              ReturnType<typeof toPersonalStatisticsAnalysisView>
            >(analysisQueryKey)!,
            error: null,
          }
        : {
            key: analysisQueryKey,
            status:
              selection.activeView === "analysis" && viewerUserId
                ? "loading"
                : "idle",
            data: null,
            error: null,
          };
  const visibleHistoryState =
    historyState.key === historyBaseQueryKey
      ? historyState
      : queryCache.current.get<ReturnType<typeof toStatisticsMatchHistoryView>>(
            historyBaseQueryKey
          )
        ? {
            key: historyBaseQueryKey,
            status: getResultStatus(
              queryCache.current.get<
                ReturnType<typeof toStatisticsMatchHistoryView>
              >(historyBaseQueryKey)!
            ),
            data: queryCache.current.get<
              ReturnType<typeof toStatisticsMatchHistoryView>
            >(historyBaseQueryKey)!,
            error: null,
          }
        : {
            key: historyBaseQueryKey,
            status:
              selection.activeView === "history" && viewerUserId
                ? "loading"
                : "idle",
            data: null,
            error: null,
          };
  const visibleMembersState =
    membersState.key === scopeKey
      ? membersState
      : queryCache.current.getMembers<StatisticsMemberOption[]>(scopeKey)
        ? {
            key: scopeKey,
            status: "ready" as const,
            data: queryCache.current.getMembers<StatisticsMemberOption[]>(
              scopeKey
            )!,
            error: null,
          }
        : selection.scope.scopeType === "overall"
          ? { key: scopeKey, status: "idle" as const, data: [], error: null }
          : {
              key: scopeKey,
              status: "loading" as const,
              data: [],
              error: null,
            };

  const loadMoreAnalysis = React.useCallback(
    async (cursor: string) => {
      const currentAnalysis = visibleAnalysisState.data;
      const analysisLoading = analysisLoadingLifecycle.current;
      if (
        !currentAnalysis ||
        currentAnalysis.status !== "ready" ||
        currentAnalysis.breakdown.nextCursor !== cursor ||
        visibleAnalysisState.key !== analysisQueryKey ||
        analysisLoading.isLoading()
      ) {
        return;
      }

      const requestId = analysisRequestId.current + 1;
      analysisRequestId.current = requestId;
      const loadingGeneration = analysisLoading.start();
      setIsLoadingMoreAnalysis(true);
      setAnalysisMoreError(null);

      try {
        const nextPageKey = createStatisticsQueryKey({
          ...selection,
          view: "analysis",
          cursor,
        });
        const nextPage = await queryCache.current.fetch(
          nextPageKey,
          async () => {
            const response = await getPersonalStatisticsAnalysis({
              targetUserId: selection.targetUserId,
              query: {
                ...apiScope,
                dimension: selection.dimension,
                ...(selection.dimension === "period"
                  ? { groupBy: selection.groupBy }
                  : {}),
                windowSize: `${selection.windowSize}` as "10" | "20" | "50",
                cursor,
              },
            });
            return toPersonalStatisticsAnalysisView(
              response,
              selection.targetUserId
            );
          }
        );

        if (
          requestId !== analysisRequestId.current ||
          analysisRequestKeyRef.current !== analysisQueryKey
        ) {
          return;
        }
        const mergedAnalysis = mergeStatisticsAnalysisPages(
          currentAnalysis,
          nextPage
        );
        queryCache.current.set(analysisQueryKey, mergedAnalysis);
        setAnalysisState({
          key: analysisQueryKey,
          status: getResultStatus(mergedAnalysis),
          data: mergedAnalysis,
          error: null,
        });
      } catch (loadError: unknown) {
        if (
          requestId === analysisRequestId.current &&
          analysisRequestKeyRef.current === analysisQueryKey
        ) {
          if (loadError instanceof ApiError && loadError.status === 401) {
            router.replace("/login");
          }
          setAnalysisMoreError(
            getApiErrorMessage(loadError, DEFAULT_QUERY_ERROR_MESSAGE)
          );
        }
      } finally {
        if (analysisLoading.finish(loadingGeneration)) {
          setIsLoadingMoreAnalysis(false);
        }
      }
    },
    [
      apiScope,
      analysisQueryKey,
      router,
      selection,
      visibleAnalysisState.data,
      visibleAnalysisState.key,
    ]
  );

  return {
    // Existing fields remain available until the page integration task adopts the new model.
    userName,
    joiningLeagueSeasons,
    selectedLeagueSeasonId,
    selectedStats,
    isLoading,
    initialError,
    statsError,
    statsStatus,
    isStatsLoading: statsStatus === "loading",
    onChangeLeagueSeason: onChangeLegacySeasonAndScope,
    onDisplayButtonClick: () => void loadStats(),
    retry: () => setRetryCount((count) => count + 1),
    retryStats: () => void loadStats(),
    viewerUserId,
    targetUserId: selection.targetUserId,
    scope: selection.scope,
    activeView: selection.activeView,
    dimension: selection.dimension,
    groupBy: selection.groupBy,
    windowSize: selection.windowSize,
    historyCursor: selection.historyCursor,
    summary: visibleSummaryState.data,
    summaryStatus: visibleSummaryState.status,
    summaryError: visibleSummaryState.error,
    analysis: visibleAnalysisState.data,
    analysisStatus: visibleAnalysisState.status,
    analysisError: visibleAnalysisState.error,
    analysisMoreError,
    isLoadingMoreAnalysis,
    history: visibleHistoryState.data,
    historyStatus: visibleHistoryState.status,
    historyError: historyError ?? visibleHistoryState.error,
    isLoadingMoreHistory,
    members: visibleMembersState.data,
    membersStatus: visibleMembersState.status,
    membersError: visibleMembersState.error,
    onChangeScope,
    onChangeTarget,
    onChangeDateRange,
    onChangeGameType,
    onChangeActiveView,
    onChangeDimension,
    onChangeGroupBy,
    onChangeWindowSize,
    loadMoreHistory,
    loadMoreAnalysis,
    retrySummary,
    retryAnalysis,
    retryHistory,
    retryMembers,
  };
};
