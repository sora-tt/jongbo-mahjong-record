import type { LeagueMember } from "@/types/domain/league";

import { useLeague } from "@/app/league/season/hooks";
import { UserIdType } from "@/types/domain/user";

export const useLeagueRankingTable = () => {
  const { league, error } = useLeague();

  const members: Record<UserIdType, LeagueMember> = league?.members ?? [];

  return { members, error };
};
