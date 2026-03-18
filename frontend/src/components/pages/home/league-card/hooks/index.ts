import { leagueData1 } from "@/mocks/league";

export const useLeagueCard = () => {
  const userId = "0001";
  const league = leagueData1;
  const myRank = league.members[userId]?.rank;

  return {
    leagueName: league?.name ?? "",
    memberCount: league?.members ? Object.keys(league.members).length : 0,
    gameCount: league?.totalGames,
    myRank,
  };
};
