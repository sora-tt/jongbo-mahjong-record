import { User } from "./user";

export type League = {
  id: string;
  name: string;
  createdAt: Date;
  members: LeagueMember[];
  //仮で追加
  lastRecordedAt: Date;
  ruleName: string;
  totalGames: number;
  standings: LeagueStanding[];
  titles: LeagueDetailTitle[];
};

export type LeagueMember = {
  player: User;
  joinedAt: Date;
  role: Role;
  createdAt: Date;

  // 集計系
  totalPoints: number;
  gamesPlayed: number;
  rank: number;
};

export type Role = "owner" | "member";

export type LeagueStanding = {
  rank: number;
  playerName: string;
  totalPt: number;
  first: number;
  second: number;
  third: number;
  fourth: number;
};

export type LeagueDetailTitle = {
  label: string;
  playerName: string;
  value: string;
};
