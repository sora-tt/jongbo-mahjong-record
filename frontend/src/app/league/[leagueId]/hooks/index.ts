import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { fetchLeagueDetail } from "@/features/league/api";
import { toLeagueDetail } from "@/features/league/model/adapter";
import { fetchLeagueSeasons } from "@/features/season/api";
import { toSeasonSummary } from "@/features/season/model/adapter";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";

const DEFAULT_ERROR_MESSAGE =
  "リーグ詳細の取得に失敗しました。時間をおいて再度お試しください。";

export const useLeaguePage = () => {
  const router = useRouter();
  const params = useParams<{ leagueId: string }>();
  const [league, setLeague] = React.useState<ReturnType<
    typeof toLeagueDetail
  > | null>(null);
  const [leagueSeasons, setLeagueSeasons] = React.useState<
    Array<ReturnType<typeof toSeasonSummary>>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    let isActive = true;

    const leagueId = params.leagueId;

    if (!leagueId) {
      setError("leagueId が指定されていません");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [leagueDetail, seasons] = await Promise.all([
          fetchLeagueDetail(leagueId),
          fetchLeagueSeasons(leagueId),
        ]);

        if (!isActive) {
          return;
        }

        setLeague(toLeagueDetail(leagueDetail));
        setLeagueSeasons(seasons.map(toSeasonSummary));
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
          return;
        }

        setError(getApiErrorMessage(loadError, DEFAULT_ERROR_MESSAGE));
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
  }, [params.leagueId, retryCount, router]);

  const retry = React.useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  const longestWinStreak = league?.leagueRecords?.winStreak ?? null;
  const longestLoseStreak = league?.leagueRecords?.loseStreak ?? null;
  const currentHighestScore = league?.leagueRecords?.highestScore ?? null;
  const currentLowestScore = league?.leagueRecords?.lowestScore ?? null;

  return {
    league,
    longestWinStreak,
    longestLoseStreak,
    currentHighestScore,
    currentLowestScore,
    loading,
    error,
    leagueSeasons,
    retry,
  };
};
