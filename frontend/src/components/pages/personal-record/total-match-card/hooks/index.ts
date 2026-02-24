import { LeagueSeasonMember } from "@/types/domain/league";

interface UseTotalMatchCardProps {
  selectedLeagueSeasonMember: LeagueSeasonMember | null;
}

export const useTotalMatchCard = ({
  selectedLeagueSeasonMember,
}: UseTotalMatchCardProps) => {
  const gamesPlayed = selectedLeagueSeasonMember?.gamesPlayed;

  return {
    gamesPlayed,
  };
};
