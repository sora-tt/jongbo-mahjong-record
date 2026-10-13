import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { fetchLeagueDetail, fetchLeagueMembers } from "@/features/league/api";
import { toLeagueDetail } from "@/features/league/model/adapter";
import { fetchLeagueSeasons } from "@/features/season/api";
import { toSeasonSummary } from "@/features/season/model/adapter";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";

const DEFAULT_ERROR_MESSAGE =
  "リーグ詳細の取得に失敗しました。時間をおいて再度お試しください。";
const DEFAULT_SEASONS_ERROR_MESSAGE =
  "シーズン一覧の取得に失敗しました。時間をおいて再度お試しください。";

export const useLeaguePage = () => {
  const router = useRouter();
  const params = useParams<{ leagueId: string }>();
  const [league, setLeague] = React.useState<ReturnType<
    typeof toLeagueDetail
  > | null>(null);
  const [leagueSeasons, setLeagueSeasons] = React.useState<
    Array<ReturnType<typeof toSeasonSummary>>
  >([]);
  const [members, setMembers] = React.useState<
    Awaited<ReturnType<typeof fetchLeagueMembers>>
  >([]);
  const [membersLoading, setMembersLoading] = React.useState(true);
  const [membersError, setMembersError] = React.useState<string | null>(null);
  const [seasonsLoading, setSeasonsLoading] = React.useState(true);
  const [seasonsError, setSeasonsError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [seasonRetryCount, setSeasonRetryCount] = React.useState(0);

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
      setNotFound(false);
      setMembersLoading(true);
      setMembersError(null);

      try {
        const leagueDetail = await fetchLeagueDetail(leagueId);

        if (!isActive) {
          return;
        }

        setLeague(toLeagueDetail(leagueDetail));
        void fetchLeagueMembers(leagueId)
          .then((leagueMembers) => {
            if (!isActive) return;
            setMembers(leagueMembers);
          })
          .catch((membersLoadError: unknown) => {
            if (!isActive) return;
            if (
              membersLoadError instanceof ApiError &&
              membersLoadError.status === 401
            ) {
              router.replace("/login");
              return;
            }
            if (
              membersLoadError instanceof ApiError &&
              membersLoadError.status === 404
            ) {
              setMembers([]);
              setMembersError(null);
              return;
            }
            setMembersError(
              getApiErrorMessage(
                membersLoadError,
                "リーグ参加者を取得できませんでした。"
              )
            );
          })
          .finally(() => {
            if (isActive) setMembersLoading(false);
          });
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 404) {
          setLeague(null);
          setNotFound(true);
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

  React.useEffect(() => {
    let isActive = true;
    const leagueId = params.leagueId;

    if (!leagueId) {
      setSeasonsLoading(false);
      return () => {
        isActive = false;
      };
    }

    const loadSeasons = async () => {
      setSeasonsLoading(true);
      setSeasonsError(null);

      try {
        const seasons = await fetchLeagueSeasons(leagueId);
        if (!isActive) return;
        setLeagueSeasons(seasons.map(toSeasonSummary));
      } catch (seasonsLoadError) {
        if (!isActive) return;

        if (
          seasonsLoadError instanceof ApiError &&
          seasonsLoadError.status === 404
        ) {
          setLeagueSeasons([]);
          return;
        }

        if (
          seasonsLoadError instanceof ApiError &&
          seasonsLoadError.status === 401
        ) {
          router.replace("/login");
          return;
        }

        setSeasonsError(
          getApiErrorMessage(seasonsLoadError, DEFAULT_SEASONS_ERROR_MESSAGE)
        );
      } finally {
        if (isActive) setSeasonsLoading(false);
      }
    };

    void loadSeasons();

    return () => {
      isActive = false;
    };
  }, [params.leagueId, seasonRetryCount, router]);

  const retry = React.useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  const retrySeasons = React.useCallback(() => {
    setSeasonRetryCount((count) => count + 1);
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
    notFound,
    error,
    leagueSeasons,
    seasonsLoading,
    seasonsError,
    members,
    membersLoading,
    membersError,
    retry,
    retrySeasons,
  };
};
