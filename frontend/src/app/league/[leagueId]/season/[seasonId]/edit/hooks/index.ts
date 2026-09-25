import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { fetchSeasonDetail, updateSeason } from "@/features/season/api";
import { toSeasonDetail } from "@/features/season/model/adapter";
import { ApiError, getApiErrorMessage } from "@/lib/api/core";

type SeasonStatus = "active" | "archived";

const DEFAULT_ERROR_MESSAGE =
  "シーズン情報の取得に失敗しました。時間をおいて再度お試しください。";

export const useSeasonEdit = () => {
  const router = useRouter();
  const params = useParams<{ leagueId: string; seasonId: string }>();
  const [seasonName, setSeasonName] = React.useState("");
  const [status, setStatus] = React.useState<SeasonStatus>("active");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isActive = true;
    const { leagueId, seasonId } = params;

    if (!leagueId || !seasonId) {
      setError("leagueId または seasonId が指定されていません");
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
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
  }, [params, router]);

  const handleSubmit = React.useCallback(async () => {
    const { leagueId, seasonId } = params;

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
  }, [params, router, seasonName, status]);

  return {
    leagueId: params.leagueId,
    seasonId: params.seasonId,
    seasonName,
    status,
    isLoading,
    isSubmitting,
    error,
    setSeasonName,
    setStatus,
    handleSubmit,
  };
};
