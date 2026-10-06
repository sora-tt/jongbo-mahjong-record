import {
  getStatisticsDateRangeInputValues,
  type StatisticsScopeOption,
} from "@/features/statistics/model/scope-filter";

import type {
  StatisticsScopeFilters,
  StatisticsView,
} from "@/features/statistics/model/query-cache";

export type StatisticsPageSeasonOption = StatisticsScopeOption & { id: string };

export type StatisticsRouteContext = {
  isContextMode: boolean;
  scope: StatisticsScopeFilters;
  targetUserId: string | null;
  activeView: StatisticsView;
  scopeLabel: string;
  returnTo: string | null;
};

const viewValues: readonly StatisticsView[] = [
  "overview",
  "trend",
  "comparisons",
  "history",
];

const getSafeReturnPath = (value: string | null) => {
  if (
    !value ||
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("#")
  ) {
    return null;
  }

  try {
    const baseUrl = "https://statistics.local.invalid";
    const parsedUrl = new URL(value, baseUrl);
    const isKnownRoute =
      value === "/" ||
      value === "/stats" ||
      /^\/league\/[^/?#%]+(?:\/season\/[^/?#%]+)?$/.test(value);

    return parsedUrl.origin === baseUrl &&
      parsedUrl.pathname === value &&
      isKnownRoute
      ? value
      : null;
  } catch {
    return null;
  }
};

export const parseStatisticsRouteContext = (
  search: string
): StatisticsRouteContext => {
  const params = new URLSearchParams(search);
  const scopeTypeValue = params.get("scopeType");
  const scopeType =
    scopeTypeValue === "league" || scopeTypeValue === "season"
      ? scopeTypeValue
      : scopeTypeValue === "overall"
        ? "overall"
        : null;
  const leagueId = params.get("leagueId") || undefined;
  const seasonId = params.get("seasonId") || undefined;
  const gameTypeValue = params.get("gameType");
  const gameType: StatisticsScopeFilters["gameType"] =
    gameTypeValue === "sanma" || gameTypeValue === "yonma"
      ? gameTypeValue
      : "all";
  const isValidScope =
    scopeType === "overall" ||
    (scopeType === "league" && Boolean(leagueId)) ||
    (scopeType === "season" && Boolean(leagueId && seasonId));
  const returnTo = getSafeReturnPath(params.get("returnTo"));

  return {
    isContextMode: isValidScope,
    scope: isValidScope
      ? {
          scopeType: scopeType ?? "overall",
          ...(scopeType !== "overall" && leagueId ? { leagueId } : {}),
          ...(scopeType === "season" && seasonId ? { seasonId } : {}),
          gameType,
        }
      : { scopeType: "overall", gameType: "all" },
    targetUserId: params.get("targetUserId") || null,
    activeView: viewValues.includes(params.get("view") as StatisticsView)
      ? (params.get("view") as StatisticsView)
      : "overview",
    scopeLabel: params.get("scopeLabel") ?? "",
    returnTo,
  };
};

export const buildStatisticsHref = (input: {
  scope: StatisticsScopeFilters;
  targetUserId?: string;
  activeView?: StatisticsView;
  scopeLabel?: string;
  returnTo?: string | null;
}) => {
  const params = new URLSearchParams({
    scopeType: input.scope.scopeType,
    gameType: input.scope.gameType,
    view: input.activeView ?? "overview",
  });
  if (input.targetUserId) params.set("targetUserId", input.targetUserId);
  if (input.scope.leagueId) params.set("leagueId", input.scope.leagueId);
  if (input.scope.seasonId) params.set("seasonId", input.scope.seasonId);
  if (input.scopeLabel) params.set("scopeLabel", input.scopeLabel);
  if (input.returnTo) params.set("returnTo", input.returnTo);
  return `/stats?${params.toString()}`;
};

export type StatisticsPageQueryStatus =
  | "idle"
  | "loading"
  | "ready"
  | "empty"
  | "uncomputed"
  | "error";

export const normalizeStatisticsPageQueryStatus = (
  status: string
): StatisticsPageQueryStatus =>
  status === "idle" ||
  status === "loading" ||
  status === "ready" ||
  status === "empty" ||
  status === "uncomputed" ||
  status === "error"
    ? status
    : "idle";

export type StatisticsPagePanelState<TData> =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "uncomputed" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: TData };

type CursorPagedAnalysis = {
  status: string;
  breakdown?: {
    dimension: string;
    rows: readonly unknown[];
    nextCursor: string | null;
  };
};

export const getStatisticsPageScopeOptions = (
  seasons: readonly StatisticsPageSeasonOption[]
): StatisticsScopeOption[] =>
  seasons.map(({ leagueId, leagueName, seasonId, seasonName }) => ({
    leagueId,
    leagueName,
    seasonId,
    seasonName,
  }));

export const getStatisticsPagePeriodLabel = (range: {
  from?: string;
  to?: string;
}) => {
  const { from, to } = getStatisticsDateRangeInputValues(range);
  const formatDate = (date: string) => date.replaceAll("-", "/");

  if (from && to) return `${formatDate(from)}〜${formatDate(to)}`;
  if (from) return `${formatDate(from)}以降`;
  if (to) return `${formatDate(to)}まで`;
  return "全期間";
};

export const getStatisticsPageSubjectLabel = ({
  viewerUserId,
  targetUserId,
  viewerName,
  members,
}: {
  viewerUserId: string;
  targetUserId: string;
  viewerName: string;
  members: readonly { userId: string; userName: string }[];
}) => {
  if (targetUserId === viewerUserId) return viewerName || "本人";
  return (
    members.find((member) => member.userId === targetUserId)?.userName ||
    "選択中の参加者"
  );
};

export const getStatisticsPagePanelState = <TData>(
  rawStatus: string,
  data: TData | null,
  error: string | null
): StatisticsPagePanelState<TData> => {
  const status = normalizeStatisticsPageQueryStatus(rawStatus);
  if (status === "idle") return { kind: "idle" };
  if (status === "loading") return { kind: "loading" };
  if (status === "empty") return { kind: "empty" };
  if (status === "uncomputed") return { kind: "uncomputed" };
  if (status === "error") {
    return { kind: "error", message: error ?? "成績の取得に失敗しました。" };
  }
  if (status !== "ready") return { kind: "idle" };
  return data === null ? { kind: "loading" } : { kind: "ready", data };
};

export const mergeStatisticsAnalysisPages = <
  TCurrent extends CursorPagedAnalysis,
  TNext extends CursorPagedAnalysis,
>(
  current: TCurrent,
  next: TNext
): TCurrent | TNext => {
  if (next.status !== "ready") return next;

  if (
    current.status !== "ready" ||
    !current.breakdown ||
    !next.breakdown ||
    current.breakdown.dimension !== next.breakdown.dimension
  ) {
    return next;
  }

  return {
    ...current,
    breakdown: {
      ...current.breakdown,
      rows: [...current.breakdown.rows, ...next.breakdown.rows],
      nextCursor: next.breakdown.nextCursor,
    },
  } as TCurrent;
};
