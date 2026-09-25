import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { fetchSeasonDetail } from "@/features/season/api";
import { toSeasonDetail } from "@/features/season/model/adapter";
import { listSessions } from "@/features/session/api";
import { toSessionList } from "@/features/session/model/adapter";
import { toPointProgressionChart } from "@/features/statistics/model/adapter";
import { CHART_SERIES } from "@/features/statistics/model/chart";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";

const DEFAULT_ERROR_MESSAGE =
  "シーズン詳細の取得に失敗しました。時間をおいて再度お試しください。";

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

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

export const useSeasonPage = () => {
  const router = useRouter();
  const params = useParams<{ leagueId: string; seasonId: string }>();
  const [season, setSeason] = React.useState<SeasonDetail | null>(null);
  const [sessions, setSessions] = React.useState<SessionSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sessionsLoading, setSessionsLoading] = React.useState(true);
  const [sessionsError, setSessionsError] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    let isActive = true;

    const leagueId = params.leagueId;
    const seasonId = params.seasonId;

    if (!leagueId || !seasonId) {
      setError("leagueId または seasonId が指定されていません");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      setSessionsLoading(true);
      setSessionsError(null);

      const [seasonResult, sessionsResult] = await Promise.allSettled([
        fetchSeasonDetail(leagueId, seasonId),
        listSessions(leagueId, seasonId),
      ]);

      if (!isActive) return;

      if (seasonResult.status === "fulfilled") {
        setSeason(toSeasonDetail(seasonResult.value));
        setError(null);
      } else if (
        seasonResult.reason instanceof ApiError &&
        seasonResult.reason.status === 401
      ) {
        router.replace("/login");
      } else {
        setError(
          getApiErrorMessage(seasonResult.reason, DEFAULT_ERROR_MESSAGE)
        );
      }
      setLoading(false);

      if (sessionsResult.status === "fulfilled") {
        setSessions(toSessionList(sessionsResult.value));
      } else if (
        sessionsResult.reason instanceof ApiError &&
        sessionsResult.reason.status === 401
      ) {
        router.replace("/login");
      } else {
        setSessionsError(
          getApiErrorMessage(
            sessionsResult.reason,
            "Session一覧の取得に失敗しました。"
          )
        );
      }
      setSessionsLoading(false);
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [params.leagueId, params.seasonId, retryCount, router]);

  const retry = React.useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

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

    const chart = toPointProgressionChart(season.pointProgressions);
    return {
      ...chart,
      isUncomputed:
        chart.isUncomputed || (season.totalMatchCount > 0 && chart.isEmpty),
    };
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
    season,
    sessions,
    titles,
    pointProgressionChart,
    chartSeries,
    visibleSeries,
    visibleUserIds,
    loading,
    sessionsLoading,
    sessionsError,
    error,
    retry,
    retrySessions: retry,
    handleStartRecording,
    handleToggleChartSeries,
  };
};
