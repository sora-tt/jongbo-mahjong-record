import { leaguesData } from "@/mocks/league";
import { userData1 } from "@/mocks/user";

export const useHome = () => {
  const user = userData1;
  const leagues = leaguesData;

  const hasLeagues = leagues.length > 0;

  const error: string | null = null;

  return {
    userId: user.id,
    userName: user.name,
    leagues: leagues,
    hasLeagues: hasLeagues,
    error: error,
  };
};
