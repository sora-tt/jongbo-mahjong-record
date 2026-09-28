import type {
  LeagueId,
  ScopeType,
  SeasonId,
  UserId,
  UserStatsId,
} from "@/domain/shared/types.js";
import { asOpaqueId } from "@/domain/shared/types.js";

export type UserStatsKey = {
  userId: UserId | string;
  scopeType: ScopeType;
  leagueId: LeagueId | string | null;
  seasonId: SeasonId | string | null;
};

export const buildUserStatsId = (key: UserStatsKey): UserStatsId => {
  const userId = String(key.userId);
  if (key.scopeType === "overall") {
    if (key.leagueId !== null || key.seasonId !== null) {
      throw new TypeError("overall stats must not have league or season scope");
    }
    return asOpaqueId(`overall_${userId}`);
  }

  if (!key.leagueId) {
    throw new TypeError(`${key.scopeType} stats require leagueId`);
  }

  if (key.scopeType === "league") {
    if (key.seasonId !== null) {
      throw new TypeError("league stats must not have seasonId");
    }
    return asOpaqueId(`league_${key.leagueId}_${userId}`);
  }

  if (!key.seasonId) {
    throw new TypeError("season stats require seasonId");
  }

  return asOpaqueId(`season_${key.leagueId}_${key.seasonId}_${userId}`);
};
