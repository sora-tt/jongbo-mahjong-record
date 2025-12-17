import { mockLeagues } from "@/mocks/league";
import { mockUser } from "@/mocks/user";

export const useHome = () => {
  const user = mockUser;
  const leagues = mockLeagues;

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
