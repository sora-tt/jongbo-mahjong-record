"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectAllLeagues,
  selectLeagueLoading,
  selectLeagueError,
} from "@/store/selectors/league-selectors";
import { addLeague, setLoading, setError } from "@/store/slices/league-slice";
import { League } from "@/types/domain/league";
import { AppDate } from "@/types/utils/app-date";

/**
 * Redux使用例のサンプルコンポーネント
 *
 * このコンポーネントは、Reduxの基本的な使い方を示しています：
 * - useAppSelector: 状態の取得
 * - useAppDispatch: アクションのディスパッチ
 * - セレクターの使用
 */
export const ReduxExample = () => {
  const dispatch = useAppDispatch();
  const leagues = useAppSelector(selectAllLeagues);
  const loading = useAppSelector(selectLeagueLoading);
  const error = useAppSelector(selectLeagueError);

  const handleAddSampleLeague = () => {
    const newLeague: League = {
      leagueId: `league-${Date.now()}`,
      name: "サンプルリーグ",
      createdAt: AppDate.fromDate(new Date()),
      rule: {
        ruleId: "rule-1",
        name: "標準ルール",
        mode: "yonma",
        oka: {
          startPoints: 25000,
          returnPoints: 30000,
        },
        uma: {
          1: 20,
          2: 10,
          3: -10,
          4: -20,
        },
        scoreCalc: "round",
      },
      members: {},
      seasons: {},
      lastRecordedAt: AppDate.fromDate(new Date()),
      totalGames: 0,
    };

    dispatch(addLeague(newLeague));
  };

  const handleSimulateLoading = () => {
    dispatch(setLoading(true));
    setTimeout(() => {
      dispatch(setLoading(false));
    }, 2000);
  };

  const handleSimulateError = () => {
    dispatch(setError("これはテストエラーです"));
    setTimeout(() => {
      dispatch(setError(null));
    }, 3000);
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Redux 使用例</h1>

      <div className="space-x-2">
        <button
          onClick={handleAddSampleLeague}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          サンプルリーグを追加
        </button>
        <button
          onClick={handleSimulateLoading}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          ローディングをシミュレート
        </button>
        <button
          onClick={handleSimulateError}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          エラーをシミュレート
        </button>
      </div>

      {loading && (
        <div className="p-4 bg-blue-100 text-blue-700 rounded">
          読み込み中...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          エラー: {error}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">
          リーグ一覧 ({leagues.length}件)
        </h2>
        {leagues.length === 0 ? (
          <p className="text-gray-500">リーグがありません</p>
        ) : (
          <ul className="space-y-2">
            {leagues.map((league) => (
              <li
                key={league.leagueId}
                className="p-4 bg-white border rounded shadow-sm"
              >
                <div className="font-medium">{league.name}</div>
                <div className="text-sm text-gray-600">
                  ID: {league.leagueId}
                </div>
                <div className="text-sm text-gray-600">
                  試合数: {league.totalGames}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
