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
  titles: LeagueTitle[];
};

export type LeagueMember = {
  player: User;
  joinedAt: Date;
  role: Role;

  // 集計系
  totalPoints: number;
  gamesPlayed: number;
  rank: number;
  numberOfEachOrder: NumberOfEachOrder;
};

export type NumberOfEachOrder = {
  first: number;
  second: number;
  third: number;
  fourth: number;
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

export type LeagueTitle = {
  label: string;
  playerName: string;
  value: string;
};
