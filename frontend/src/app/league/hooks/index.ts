import { leagueData1 } from "@/mocks/league";

export const useLeague = () => {
  const league = leagueData1;

  const error: string | null = league ? null : "リーグが見つかりません";

  return { league, error };
};
