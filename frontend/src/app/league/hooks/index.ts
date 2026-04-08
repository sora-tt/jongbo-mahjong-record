import { useEffect } from "react";

import { useSearchParams } from "next/navigation";

import { leagueData1 } from "@/mocks/league";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectLeagueLoading,
  selectLeagueError,
  selectLeagueRecord,
  selectLeagueSeasons,
  selectSelectedLeagueId,
} from "@/store/selectors/league-selectors";
import {
  setLeagues,
  setSelectedLeagueId,
  setLoading,
  setError,
} from "@/store/slices/league-slice";
import { League } from "@/types/domain/league";

/**
 * mock-dataディレクトリから動的にmockデータを読み込む
 * @param mockKey - mockファイル名（例: "league-default", "league-1"）
 * @returns mockLeagueデータまたはnull
 */
const loadMockData = async ({
  mockKey,
}: {
  mockKey: string;
}): Promise<{ mockLeague: League } | null> => {
  try {
    const mockModule = await import(`../mock-data/${mockKey}.ts`);
    return mockModule || null;
  } catch (error) {
    console.error(`Failed to load mock data: ${mockKey}`, error);
    return null;
  }
};

export const useLeague = () => {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const selectedLeagueId = useAppSelector(selectSelectedLeagueId);
  const {
    longestWinStreak,
    longestLoseStreak,
    currentHighestScore,
    currentLowestScore,
  } = useAppSelector(selectLeagueRecord);
  const leagueSeasons = useAppSelector((state) =>
    selectLeagueSeasons(state, selectedLeagueId)
  );
  const loading = useAppSelector(selectLeagueLoading);
  const error = useAppSelector(selectLeagueError);

  useEffect(() => {
    const fetchLeague = async () => {
      const mockKey = searchParams.get("_mock");
      const isDev = process.env.NODE_ENV === "development";

      if (isDev && mockKey) {
        dispatch(setLoading(true));
        const mockData = await loadMockData({ mockKey });
        if (mockData) {
          dispatch(setLeagues([mockData.mockLeague]));
          dispatch(setSelectedLeagueId(mockData.mockLeague.leagueId));
        } else {
          dispatch(setError(`Mock data not found: ${mockKey}`));
        }
        dispatch(setLoading(false));
        return;
      }

      // APIからデータを取得
      dispatch(setLoading(true));
      try {
        // TODO: 実際のAPI呼び出しに置き換える
        // const response = await fetch('/api/leagues/current');
        // const data = await response.json();
        // dispatch(setLeagues([data]));
        // dispatch(setSelectedLeagueId(data.leagueId));

        // 暫定: APIが未実装なので、mockデータを使用
        dispatch(setLeagues([leagueData1]));
        dispatch(setSelectedLeagueId(leagueData1.leagueId));
      } catch (err) {
        dispatch(
          setError(
            err instanceof Error ? err.message : "Failed to fetch league"
          )
        );
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchLeague();
  }, [dispatch, searchParams]);

  return {
    longestWinStreak,
    longestLoseStreak,
    currentHighestScore,
    currentLowestScore,
    loading,
    error,
    leagueSeasons,
  };
};
