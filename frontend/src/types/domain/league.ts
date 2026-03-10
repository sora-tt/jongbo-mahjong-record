import { Rule } from "./rule";
import { User, UserIdType } from "./user";

import { AppDate } from "@/types/utils/app-date";

export type LeagueIdType = string;

export type LeagueSeasonIdType = string;

export type League = {
  leagueId: LeagueIdType;
  name: string;
  createdAt: AppDate;
  rule: Rule;
  members: Record<UserIdType, LeagueMember>;
  seasons?: Record<LeagueSeasonIdType, LeagueSeason>;
  leagueRecord?: LeagueRecord;
  //仮で追加
  lastRecordedAt?: AppDate;
  totalGames?: number;
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

export type LeagueSeason = {
  leagueSeasonId: LeagueSeasonIdType;
  name: string;
  members: Record<UserIdType, LeagueSeasonMember>;
  memberCount: number;
  gameCount: number;
  isOngoing: boolean;
};

export type LeagueSeasonMember = {
  player: User;
  // 集計系
  totalPoints: number;
  gamesPlayed: number;
  rank: number;
  numberOfEachOrder: NumberOfEachOrder;
  averageRank: number;
  top2Rate: number;
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

export type LeagueRecord = {
  longestWinStreak?: { count: number; playerName: string };
  longestLoseStreak?: { count: number; playerName: string };
  currentHighestScore?: { score: number; playerName: string };
  currentLowestScore?: { score: number; playerName: string };
};

export type LeagueSeasonOverview = {
  leagueSeasonId: LeagueSeasonIdType;
  name: string;
  memberCount: number;
  gameCount: number;
  isOngoing: boolean;
};
