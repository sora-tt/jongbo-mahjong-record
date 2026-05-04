import * as React from "react";

import { useParams, useRouter } from "next/navigation";

import { COLOR_MAP } from "@/constants/color-map";
import { ApiError } from "@/lib/api/core";
import { fetchSeasonDetail } from "@/lib/api/seasons";

const DEFAULT_ERROR_MESSAGE =
  "シーズン詳細の取得に失敗しました。時間をおいて再度お試しください。";

type Title = {
  label: string;
  playerName: string;
  value: string;
};

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

export const useSeasonPage = () => {
  const router = useRouter();
  const params = useParams<{ leagueId: string; seasonId: string }>();
  const [season, setSeason] = React.useState<Awaited<
    ReturnType<typeof fetchSeasonDetail>
  > | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const colorValues = React.useMemo(() => Object.values(COLOR_MAP), []);

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

  return {
    leagueId: params.leagueId,
    season,
    titles,
    colorValues,
    loading,
    error,
  };
};
