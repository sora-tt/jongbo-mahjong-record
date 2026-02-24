import { leaguesData } from "@/mocks/league";
import { userData1 } from "@/mocks/user";

export const useHome = () => {
  const user = userData1;
  const leagues = leaguesData;

  const hasLeagues = Object.keys(leagues).length > 0;

  const error: string | null = null;

  return {
    userId: user.userId,
    userName: user.name,
    leagues,
    hasLeagues,
    error,
  };
};
