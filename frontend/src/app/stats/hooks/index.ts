import * as React from "react";

import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api/core";
import { fetchJoiningSeasons, fetchMe, fetchUserStats } from "@/lib/api/users";

import type {
  PersonalRecordSeasonOption,
  PersonalRecordStats,
} from "@/types/domain/personal-record";

const DEFAULT_INITIAL_ERROR_MESSAGE =
  "個人成績画面の取得に失敗しました。時間をおいて再度お試しください。";
const DEFAULT_STATS_ERROR_MESSAGE =
  "個人成績の取得に失敗しました。時間をおいて再度お試しください。";

const buildSeasonOptionId = (leagueId: string, seasonId: string) =>
  `${leagueId}:${seasonId}`;

const calculateTop2Rate = (
  firstCount: number,
  secondCount: number,
  total: number
) => {
  if (total === 0) {
    return 0;
  }

  return ((firstCount + secondCount) / total) * 100;
};

const toPersonalRecordStats = (
  stats: Awaited<ReturnType<typeof fetchUserStats>>
): PersonalRecordStats => ({
  totalPoints: stats.totalPoints,
  totalMatchCount: stats.totalMatchCount,
  rank: stats.currentRank,
  averageRank: stats.averageRank,
  top2Rate: calculateTop2Rate(
    stats.firstCount,
    stats.secondCount,
    stats.totalMatchCount
  ),
  numberOfEachOrder: {
    first: stats.firstCount,
    second: stats.secondCount,
    third: stats.thirdCount,
    fourth: stats.fourthCount ?? 0,
  },
});

export const usePersonalRecord = () => {
  const router = useRouter();
  const [userId, setUserId] = React.useState("");
  const [userName, setUserName] = React.useState("");
  const [joiningLeagueSeasons, setJoiningLeagueSeasons] = React.useState<
    PersonalRecordSeasonOption[]
  >([]);
  const [selectedLeagueSeasonId, setSelectedLeagueSeasonId] =
    React.useState("");
  const [selectedStats, setSelectedStats] =
    React.useState<PersonalRecordStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isStatsLoading, setIsStatsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const me = await fetchMe();
        const seasons = await fetchJoiningSeasons(me.id);

        if (!isActive) {
          return;
        }

        setUserId(me.id);
        setUserName(me.name);
        setJoiningLeagueSeasons(
          seasons.map((season) => ({
            id: buildSeasonOptionId(season.leagueId, season.seasonId),
            leagueId: season.leagueId,
            seasonId: season.seasonId,
            name: `${season.leagueName} - ${season.seasonName}`,
          }))
        );
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : DEFAULT_INITIAL_ERROR_MESSAGE
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [router]);

  const onChangeLeagueSeason = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedLeagueSeasonId(e.target.value);
      setError(null);
    },
    []
  );

  const onDisplayButtonClick = React.useCallback(async () => {
    if (!selectedLeagueSeasonId || !userId) {
      setSelectedStats(null);
      return;
    }

    const selectedSeason = joiningLeagueSeasons.find(
      (season) => season.id === selectedLeagueSeasonId
    );

    if (!selectedSeason) {
      setSelectedStats(null);
      return;
    }

    setIsStatsLoading(true);
    setError(null);

    try {
      const stats = await fetchUserStats({
        userId,
        scopeType: "season",
        leagueId: selectedSeason.leagueId,
        seasonId: selectedSeason.seasonId,
      });

      setSelectedStats(toPersonalRecordStats(stats));
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        router.replace("/login");
        return;
      }

      setSelectedStats(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : DEFAULT_STATS_ERROR_MESSAGE
      );
    } finally {
      setIsStatsLoading(false);
    }
  }, [joiningLeagueSeasons, router, selectedLeagueSeasonId, userId]);

  return {
    userName,
    joiningLeagueSeasons,
    selectedLeagueSeasonId,
    selectedStats,
    isLoading,
    isStatsLoading,
    error,
    onChangeLeagueSeason,
    onDisplayButtonClick,
  };
};
