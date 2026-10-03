import type {
  JoiningSeason,
  User,
  UserStats,
  UserStatsUpsertData,
  UserStatsWithPersonalStatistics,
} from "@/domain/user/types.js";
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
  getWithPersonalStatistics(params: {
    userId: string;
    scopeType: ScopeType;
    leagueId?: string;
    seasonId?: string;
  }): Promise<UserStatsWithPersonalStatistics | null>;
  upsert(
    key: {
      userId: string;
      scopeType: ScopeType;
      leagueId: string | null;
      seasonId: string | null;
    },
    data: UserStatsUpsertData,
  ): Promise<string>;
  markScopesUncomputed(
    scopes: Array<{
      scopeType: ScopeType;
      leagueId: string | null;
      seasonId: string | null;
    }>,
  ): Promise<void>;
  deleteMissingScopeStats(params: {
    scopeType: ScopeType;
    leagueId: string | null;
    seasonId: string | null;
    keepUserIds: string[];
  }): Promise<void>;
  deleteStatsForLeague(leagueId: string): Promise<void>;
  deleteMissingSeasonStats(
    leagueId: string,
    seasonId: string,
    keepUserIds: string[],
  ): Promise<void>;
}
