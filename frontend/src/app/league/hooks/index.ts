import * as React from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { ApiError } from "@/lib/api/core";
import { fetchLeagueDetail } from "@/lib/api/leagues";
import { fetchLeagueSeasons } from "@/lib/api/seasons";

const DEFAULT_ERROR_MESSAGE =
  "リーグ詳細の取得に失敗しました。時間をおいて再度お試しください。";

export const useLeague = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [league, setLeague] = React.useState<Awaited<
    ReturnType<typeof fetchLeagueDetail>
  > | null>(null);
  const [leagueSeasons, setLeagueSeasons] = React.useState<
    Awaited<ReturnType<typeof fetchLeagueSeasons>>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isActive = true;

    const leagueId = searchParams.get("leagueId");

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

        setLeague(leagueDetail);
        setLeagueSeasons(seasons);
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
  }, [router, searchParams]);

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
  };
};
