import { LeagueSeasonMember } from "@/types/domain/league";

interface UseTopTwoRateCardProps {
  selectedLeagueSeasonMember: LeagueSeasonMember | null;
}

export const useTopTwoRateCard = ({
  selectedLeagueSeasonMember,
}: UseTopTwoRateCardProps) => {
  const top2Rate = selectedLeagueSeasonMember?.top2Rate;

  return {
    top2Rate,
  };
};
