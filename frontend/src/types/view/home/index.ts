export type LeagueCardVm = {
  id: string;
  name: string;
  memberCount: number;
  gameCount: number;
  myRank: number;
};

export type HomeVm = {
  userName: string;
  leagues: LeagueCardVm[];
};
