export type StatisticsScopeFilters = {
  scopeType: "overall" | "league" | "season";
  leagueId?: string;
  seasonId?: string;
  from?: string;
  to?: string;
  gameType: "all" | "sanma" | "yonma";
};

export type StatisticsView = "overview" | "analysis" | "history";
export type StatisticsDimension =
  | "period"
  | "weekday"
  | "timeOfDay"
  | "seat"
  | "opponent"
  | "session";
export type StatisticsGroupBy = "day" | "month" | "year";
export type StatisticsWindowSize = 10 | 20 | 50;

export type StatisticsSelection = {
  viewerUserId: string;
  targetUserId: string;
  scope: StatisticsScopeFilters;
  activeView: StatisticsView;
  dimension: StatisticsDimension;
  groupBy: StatisticsGroupBy;
  windowSize: StatisticsWindowSize;
  historyCursor: string | null;
};

export type StatisticsRosterStatus = "idle" | "loading" | "ready" | "error";
export type StatisticsRosterState = {
  scopeKey: string | null;
  status: StatisticsRosterStatus;
  memberUserIds: readonly string[];
};

export type StatisticsQueryDescriptor = StatisticsSelection & {
  view: "summary" | "analysis" | "history";
  limit?: number;
  cursor?: string | null;
};

const scopeIdentity = (scope: StatisticsScopeFilters) => [
  scope.scopeType,
  scope.leagueId ?? "",
  scope.seasonId ?? "",
];

export const createStatisticsScopeKey = (scope: StatisticsScopeFilters) =>
  JSON.stringify(scopeIdentity(scope));

export const createStatisticsQueryKey = ({
  viewerUserId,
  targetUserId,
  scope,
  view,
  dimension,
  groupBy,
  windowSize,
  limit,
  cursor,
  historyCursor,
}: StatisticsQueryDescriptor) => {
  const base = [
    view,
    viewerUserId,
    targetUserId,
    ...scopeIdentity(scope),
    scope.from ?? "",
    scope.to ?? "",
    scope.gameType,
  ];

  if (view === "analysis") {
    return JSON.stringify([
      ...base,
      dimension,
      dimension === "period" ? groupBy : "",
      windowSize,
      limit ?? "",
      cursor ?? "",
    ]);
  }

  if (view === "history") {
    const selectedCursor = cursor === undefined ? historyCursor : cursor;
    return JSON.stringify([...base, limit ?? "", selectedCursor ?? ""]);
  }

  return JSON.stringify(base);
};

export const selectStatisticsTarget = (
  selection: StatisticsSelection,
  targetUserId: string
): StatisticsSelection => ({
  ...selection,
  targetUserId:
    selection.scope.scopeType === "overall"
      ? selection.viewerUserId
      : targetUserId,
  historyCursor: null,
});

export const selectStatisticsScope = (
  selection: StatisticsSelection,
  scope: StatisticsScopeFilters,
  memberUserIds: readonly string[] | null
): StatisticsSelection => {
  const nextTargetUserId =
    scope.scopeType === "overall"
      ? selection.viewerUserId
      : memberUserIds === null
        ? selection.targetUserId
        : memberUserIds.includes(selection.targetUserId)
          ? selection.targetUserId
          : selection.viewerUserId;

  return {
    ...selection,
    scope,
    targetUserId: nextTargetUserId,
    historyCursor: null,
  };
};

export const canLoadStatisticsTarget = (
  selection: StatisticsSelection,
  scopeKey: string,
  roster: StatisticsRosterState
) => {
  if (
    selection.scope.scopeType === "overall" ||
    selection.targetUserId === selection.viewerUserId
  ) {
    return true;
  }

  return (
    roster.scopeKey === scopeKey &&
    roster.status === "ready" &&
    roster.memberUserIds.includes(selection.targetUserId)
  );
};

export const resolveStatisticsMembersFailure = (
  selection: StatisticsSelection
) => ({
  selection:
    selection.targetUserId === selection.viewerUserId
      ? selection
      : selectStatisticsTarget(selection, selection.viewerUserId),
  rosterStatus: "error" as const,
});

export const isCurrentStatisticsRequest = (
  requestKey: string,
  currentKey: string,
  isActive: boolean
) => isActive && requestKey === currentKey;

export const createHistoryLoadingLifecycle = () => {
  let generation = 0;
  let loadingGeneration: number | null = null;

  return {
    start() {
      generation += 1;
      loadingGeneration = generation;
      return generation;
    },
    cancel(requestGeneration?: number) {
      if (
        loadingGeneration === null ||
        (requestGeneration !== undefined &&
          requestGeneration !== loadingGeneration)
      ) {
        return false;
      }
      generation += 1;
      loadingGeneration = null;
      return true;
    },
    finish(requestGeneration: number) {
      if (loadingGeneration !== requestGeneration) return false;
      loadingGeneration = null;
      return true;
    },
    isLoading() {
      return loadingGeneration !== null;
    },
  };
};

export const createStatisticsQueryCache = () => {
  const values = new Map<string, unknown>();
  const pending = new Map<string, Promise<unknown>>();
  const memberValues = new Map<string, unknown>();
  const memberPending = new Map<string, Promise<unknown>>();

  const fetchFromCache = async <TValue>(
    key: string,
    cache: Map<string, unknown>,
    requests: Map<string, Promise<unknown>>,
    load: () => Promise<TValue>
  ): Promise<TValue> => {
    if (cache.has(key)) return cache.get(key) as TValue;

    const existingRequest = requests.get(key);
    if (existingRequest) return (await existingRequest) as TValue;

    const request = Promise.resolve().then(load);
    requests.set(key, request);

    try {
      const value = await request;
      cache.set(key, value);
      return value;
    } finally {
      if (requests.get(key) === request) requests.delete(key);
    }
  };

  return {
    get<TValue>(key: string): TValue | undefined {
      return values.get(key) as TValue | undefined;
    },
    fetch<TValue>(key: string, load: () => Promise<TValue>) {
      return fetchFromCache(key, values, pending, load);
    },
    set<TValue>(key: string, value: TValue) {
      values.set(key, value);
    },
    getMembers<TValue>(scopeKey: string): TValue | undefined {
      return memberValues.get(scopeKey) as TValue | undefined;
    },
    fetchMembers<TValue>(scopeKey: string, load: () => Promise<TValue>) {
      return fetchFromCache(scopeKey, memberValues, memberPending, load);
    },
  };
};
