import { mockLeagues } from "@/mocks/league";

export const useLeagueCard = (userId: string, leagueId: string) => {
  const league = mockLeagues.find((l) => l.id === leagueId);
  const me = league?.members.find((m) => m.player.id === userId);

  return {
    leagueName: league?.name ?? "",
    memberCount: league?.members?.length ?? 0,
    gameCount: me?.gamesPlayed,
    myRank: me?.rank,
  };
};
