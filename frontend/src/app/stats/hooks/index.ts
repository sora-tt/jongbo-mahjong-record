import * as React from "react";

import { useRouter } from "next/navigation";

import {
  getCurrentUser,
  getUserStats,
  listJoiningSeasons,
} from "@/features/statistics/api";
import {
  toJoiningSeason,
  toUserStats,
} from "@/features/statistics/model/adapter";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";

const DEFAULT_INITIAL_ERROR_MESSAGE =
  "個人成績画面の取得に失敗しました。時間をおいて再度お試しください。";
const DEFAULT_STATS_ERROR_MESSAGE =
  "個人成績の取得に失敗しました。時間をおいて再度お試しください。";

export type StatsStatus =
  | "idle"
  | "loading"
  | "success"
  | "uncomputed"
  | "error";

type JoiningSeasonOption = ReturnType<typeof toJoiningSeason> & {
  id: string;
};

export const useStatistics = () => {
  const router = useRouter();
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
  const statsRequestId = React.useRef(0);

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
        const seasons = await listJoiningSeasons(me.id);

        if (!isActive) return;

        setUserId(String(me.id));
        setUserName(me.name);
        setJoiningLeagueSeasons(
          seasons.map((season) => {
            const option = toJoiningSeason(season);
            return {
              ...option,
              id: `${option.leagueId}:${option.seasonId}`,
            };
          })
        );
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

  return {
    userName,
    joiningLeagueSeasons,
    selectedLeagueSeasonId,
    selectedStats,
    isLoading,
    initialError,
    statsError,
    statsStatus,
    isStatsLoading: statsStatus === "loading",
    onChangeLeagueSeason,
    onDisplayButtonClick: () => void loadStats(),
    retry: () => setRetryCount((count) => count + 1),
    retryStats: () => void loadStats(),
  };
};
