import { LeagueSeasonMember } from "@/types/domain/league";

interface UseAverageRankCardProps {
  selectedLeagueSeasonMember: LeagueSeasonMember | null;
}

export const useAverageRankCard = ({
  selectedLeagueSeasonMember,
}: UseAverageRankCardProps) => {
  const averageRank = selectedLeagueSeasonMember?.averageRank;

  return {
    averageRank,
  };
};
