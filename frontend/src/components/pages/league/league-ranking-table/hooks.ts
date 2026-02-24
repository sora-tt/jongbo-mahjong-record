import type { LeagueMember } from "@/types/domain/league";

import { useLeague } from "@/app/league/hooks";

export const useLeagueRankingTable = () => {
  const { league, error } = useLeague();

  const members: LeagueMember[] = league?.members ?? [];

  return { members, error };
};
