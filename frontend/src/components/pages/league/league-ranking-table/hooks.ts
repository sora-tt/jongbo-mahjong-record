import type { LeagueMember } from "@/types/domain/league";
import type { UserIdType } from "@/types/domain/user";

import { useLeague } from "@/app/league/season/hooks";

export const useLeagueRankingTable = () => {
  const { league, error } = useLeague();

  const members: Record<UserIdType, LeagueMember> = league?.members ?? {};

  return { members, error };
};
