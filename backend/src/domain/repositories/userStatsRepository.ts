import type { ScopeType, UserStats } from "@/domain/models.js";

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
