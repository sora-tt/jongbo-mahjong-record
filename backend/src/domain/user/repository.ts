import type { JoiningSeason, User, UserStats } from "@/domain/user/types.js";
import type { ScopeType } from "@/domain/shared/types.js";

export interface UserRepository {
  get(userId: string): Promise<User>;
  getByIds(userIds: string[]): Promise<User[]>;
  search(query: string): Promise<User[]>;
  listJoiningSeasons(userId: string): Promise<JoiningSeason[]>;
  upsertProfile(input: {
    userId: string;
    email: string | null;
    name: string;
    username: string;
  }): Promise<User>;
  updateProfile(input: {
    userId: string;
    name?: string;
    username?: string;
  }): Promise<User>;
}

export interface UserStatsRepository {
  get(params: {
    userId: string;
    scopeType: ScopeType;
    leagueId?: string;
    seasonId?: string;
  }): Promise<UserStats | null>;
  upsert(
    key: {
      userId: string;
      scopeType: ScopeType;
      leagueId: string | null;
      seasonId: string | null;
    },
    data: Omit<UserStats, "id" | "createdAt" | "updatedAt">,
  ): Promise<string>;
  deleteMissingSeasonStats(
    leagueId: string,
    seasonId: string,
    keepUserIds: string[],
  ): Promise<void>;
}
