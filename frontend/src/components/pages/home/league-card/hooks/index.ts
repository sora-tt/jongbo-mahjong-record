import { leagueData1 } from "@/mocks/league";

export const useLeagueCard = () => {
  const userId = "0001";
  const league = leagueData1;
  const myRank = league.members.find(
    (member) => member.player.id === userId
  )?.rank;

  return {
    leagueName: league?.name ?? "",
    memberCount: league?.members.length,
    gameCount: league?.totalGames,
    myRank,
  };
};
