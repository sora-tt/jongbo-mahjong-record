import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { fetchSeasonDetail, updateSeason } from "@/features/season/api";
import { toSeasonDetail } from "@/features/season/model/adapter";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";

type SeasonStatus = "active" | "archived";
type SeasonMember = ReturnType<typeof toSeasonDetail>["members"][number];

const DEFAULT_ERROR_MESSAGE =
  "シーズン情報の取得に失敗しました。時間をおいて再度お試しください。";

export const useSeasonEdit = () => {
  const router = useRouter();
  const params = useParams<{ leagueId: string; seasonId: string }>();
  const { leagueId, seasonId } = params;
  const [seasonName, setSeasonName] = React.useState("");
  const [status, setStatus] = React.useState<SeasonStatus>("active");
  const [members, setMembers] = React.useState<SeasonMember[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    let isActive = true;

    if (!leagueId || !seasonId) {
      setError("leagueId または seasonId が指定されていません");
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setIsLoaded(false);
      setError(null);

      try {
        const season = toSeasonDetail(
          await fetchSeasonDetail(leagueId, seasonId)
        );

        if (!isActive) {
          return;
        }

        setSeasonName(season.name);
        setStatus(season.status);
        setMembers(season.members);
        setIsLoaded(true);
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
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [leagueId, retryCount, router, seasonId]);

  const handleSubmit = React.useCallback(async () => {
    if (!leagueId || !seasonId) {
      setError("leagueId または seasonId が指定されていません");
      return;
    }

    const trimmedName = seasonName.trim();
    if (!trimmedName) {
      setError("シーズン名を入力してください");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateSeason(leagueId, seasonId, {
        name: trimmedName,
        status,
      });
      router.push(`/league/${leagueId}/season/${seasonId}`);
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        router.replace("/login");
        return;
      }

      setError(getApiErrorMessage(submitError, "シーズン更新に失敗しました"));
    } finally {
      setIsSubmitting(false);
    }
  }, [leagueId, router, seasonName, seasonId, status]);

  const retry = React.useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  return {
    leagueId,
    seasonId,
    seasonName,
    status,
    members,
    isLoading,
    isLoaded,
    isSubmitting,
    error,
    setSeasonName,
    setStatus,
    handleSubmit,
    retry,
  };
};
