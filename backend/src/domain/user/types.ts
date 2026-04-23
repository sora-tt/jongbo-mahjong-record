import type { ScopeType } from "@/domain/shared/types.js";

export type User = {
  id: string;
  username: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type UserStats = {
  id: string;
  userId: string;
  userName: string;
  scopeType: ScopeType;
  leagueId: string | null;
  seasonId: string | null;
  leagueName: string | null;
  seasonName: string | null;
  totalPoints: number;
  totalMatchCount: number;
  averageRank: number;
  currentRank: number | null;
  firstCount: number;
  secondCount: number;
  thirdCount: number;
  fourthCount: number | null;
  firstRate: number;
  secondRate: number;
  thirdRate: number;
  fourthRate: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  averageScore: number | null;
  winStreak: number | null;
  loseStreak: number | null;
  createdAt: string;
  updatedAt: string;
};

export type JoiningSeason = {
  leagueId: string;
  leagueName: string;
  seasonId: string;
  seasonName: string;
};
