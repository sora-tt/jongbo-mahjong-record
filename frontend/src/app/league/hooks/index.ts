import { leagueRecordData1 } from "@/mocks/league-record";
import { leagueSeasonOverviewsData } from "@/mocks/league-season-overview";

export const useLeague = () => {
  // TODO: リーグ記録データをモックデータまたはAPIから取得する
  const { winStreak, loseStreak, highestScore, lowestScore } =
    leagueRecordData1;

  // TODO: シーズン一覧データをモックデータまたはAPIから取得する
  const seasons = leagueSeasonOverviewsData;

  return {
    winStreak,
    loseStreak,
    highestScore,
    lowestScore,
    seasons,
  };
};
