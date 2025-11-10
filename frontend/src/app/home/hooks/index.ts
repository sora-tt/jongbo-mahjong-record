import { mockLeagues } from "@/mocks/league";
import { mockUser } from "@/mocks/user";

export const useHome = () => {
  const user = mockUser;
  const leagues = mockLeagues;

  const error: string | null = null;

  const hasLeagues = leagues.length > 0;

  return { user, leagues, error, hasLeagues };
};
