import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { COLOR_MAP } from "@/constants/color-map";
import { ApiError } from "@/lib/api/core";
import { fetchSeasonDetail } from "@/lib/api/seasons";

const DEFAULT_ERROR_MESSAGE =
  "シーズン詳細の取得に失敗しました。時間をおいて再度お試しください。";

type SeasonDetail = Awaited<ReturnType<typeof fetchSeasonDetail>>;

type Title = {
  label: string;
  playerName: string;
  value: string;
};

type SeasonChartSeries = {
  userId: string;
  userName: string;
  colorClassName: string;
};

type SeasonChartViewSeries = SeasonChartSeries & {
  strokeColor: string;
};

type SeasonChartData = {
  matchIndex: number;
  [userId: string]: number;
};

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const CHART_STROKE_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#ec4899",
  "#f97316",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#84cc16",
  "#14b8a6",
  "#06b6d4",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#f43f5e",
  "#db2777",
  "#a16207",
  "#78716c",
  "#6b7280",
  "#111827",
];

const colorClassNames = Object.values(COLOR_MAP);

const buildSeasonChartData = (season: SeasonDetail) => {
  const series: SeasonChartSeries[] = season.pointProgressions.map(
    (progression, index) => ({
      userId: progression.userId,
      userName: progression.userName,
      colorClassName: colorClassNames[index % colorClassNames.length],
    })
  );

  const progressionByUser = new Map(
    season.pointProgressions.map((progression) => [
      progression.userId,
      new Map(
        progression.points.map((point) => [point.matchIndex, point.totalPoints])
      ),
    ])
  );

  const latestPointByUser = new Map<string, number>();

  const chartData: SeasonChartData[] = Array.from(
    { length: season.totalMatchCount },
    (_, index) => {
      const matchIndex = index + 1;
      const row: SeasonChartData = { matchIndex };

      series.forEach((item) => {
        const progression = progressionByUser.get(item.userId);
        const currentPoint = progression?.get(matchIndex);
        if (typeof currentPoint === "number") {
          latestPointByUser.set(item.userId, currentPoint);
        }

        row[item.userId] = latestPointByUser.get(item.userId) ?? 0;
      });

      return row;
    }
  );

  return {
    series,
    chartData,
    isChartEmpty: season.totalMatchCount === 0 || series.length === 0,
  };
};

export const useSeasonPage = () => {
  const router = useRouter();
  const params = useParams<{ leagueId: string; seasonId: string }>();
  const [season, setSeason] = React.useState<Awaited<
    ReturnType<typeof fetchSeasonDetail>
  > | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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

      try {
        const seasonDetail = await fetchSeasonDetail(leagueId, seasonId);

        if (!isActive) {
          return;
        }

        setSeason(seasonDetail);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : DEFAULT_ERROR_MESSAGE
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [params.leagueId, params.seasonId, router]);

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
        series: [] as SeasonChartSeries[],
        chartData: [] as SeasonChartData[],
        isChartEmpty: true,
      };
    }

    return buildSeasonChartData(season);
  }, [season]);

  const chartSeries: SeasonChartViewSeries[] = React.useMemo(
    () =>
      pointProgressionChart.series.map((item, index) => ({
        userId: item.userId,
        userName: item.userName,
        colorClassName: item.colorClassName,
        strokeColor:
          CHART_STROKE_COLORS[index % CHART_STROKE_COLORS.length] ?? "#111827",
      })),
    [pointProgressionChart.series]
  );

  const [visibleUserIds, setVisibleUserIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    setVisibleUserIds(chartSeries.map((item) => item.userId));
  }, [chartSeries]);

  const visibleSeries: SeasonChartViewSeries[] = React.useMemo(
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
    router.push(`/league/${leagueId}/season/${seasonId}/player-select`);
  }, [params.leagueId, params.seasonId, router]);

  return {
    leagueId: params.leagueId,
    season,
    titles,
    pointProgressionChart,
    chartSeries,
    visibleSeries,
    visibleUserIds,
    loading,
    error,
    handleStartRecording,
    handleToggleChartSeries,
  };
};
