import { LeagueSeasonMember } from "@/types/domain/league";

interface UseTotalPointCardProps {
  selectedLeagueSeasonMember: LeagueSeasonMember | null;
}

export const useTotalPointCard = ({
  selectedLeagueSeasonMember,
}: UseTotalPointCardProps) => {
  const totalPoints = selectedLeagueSeasonMember?.totalPoints;

  return {
    totalPoints,
  };
};
