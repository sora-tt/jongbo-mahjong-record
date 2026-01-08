import { User, UserIdType } from "./user";
import { AppDate } from "../utils/app-date";

export type LeagueIdType = string;

export type League = {
  leagueId: LeagueIdType;
  name: string;
  createdAt: AppDate;
  members: Record<UserIdType, LeagueMember>;
  lastRecordedAt: AppDate;
  ruleName: string;
  totalGames: number;
  titles?: LeagueTitle[];
};

export type LeagueMember = {
  player: User;
  joinedAt: AppDate;
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

export type LeagueTitle = {
  label: string;
  playerName: string;
  value: string;
};
