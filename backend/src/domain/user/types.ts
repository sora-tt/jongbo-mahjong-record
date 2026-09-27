import type {
  IsoDateString,
  LeagueId,
  Nullable,
  ScopeType,
  SeasonId,
  UserId,
  UserStatsId,
} from "@/domain/shared/types.js";

export type User = {
  id: UserId;
  username: string;
  email: string;
  name: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type UserStats = {
  id: UserStatsId;
  userId: UserId;
  userName: string;
  scopeType: ScopeType;
  leagueId: Nullable<LeagueId>;
  seasonId: Nullable<SeasonId>;
  leagueName: Nullable<string>;
  seasonName: Nullable<string>;
  totalPoints: number;
  totalMatchCount: number;
  averageRank: number;
  currentRank: Nullable<number>;
  firstCount: number;
  secondCount: number;
  thirdCount: number;
  fourthCount: Nullable<number>;
  firstRate: number;
  secondRate: number;
  thirdRate: number;
  fourthRate: Nullable<number>;
  highestScore: Nullable<number>;
  lowestScore: Nullable<number>;
  averageScore: Nullable<number>;
  winStreak: Nullable<number>;
  loseStreak: Nullable<number>;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type JoiningSeason = {
  leagueId: LeagueId;
  leagueName: string;
  seasonId: SeasonId;
  seasonName: string;
};
