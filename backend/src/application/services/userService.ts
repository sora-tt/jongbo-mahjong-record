import type { ScopeType } from "@/domain/models.js";
import type { UserRepository } from "@/domain/repositories/userRepository.js";
import type { UserStatsRepository } from "@/domain/repositories/userStatsRepository.js";
import { NotFoundError, ValidationError } from "@/errors.js";

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userStatsRepository: UserStatsRepository
  ) {}

  getUser(userId: string) {
    return this.userRepository.get(userId);
  }

  searchUsers(query: string) {
    return this.userRepository.search(query);
  }

  listJoiningSeasons(userId: string) {
    return this.userRepository.listJoiningSeasons(userId);
  }

  async getUserStats(params: {
    userId: string;
    scopeType: ScopeType;
    leagueId?: string;
    seasonId?: string;
  }) {
    if (params.scopeType === "league" && !params.leagueId) {
      throw new ValidationError("leagueId is required when scopeType is league");
    }
    if (params.scopeType === "season" && (!params.leagueId || !params.seasonId)) {
      throw new ValidationError("leagueId and seasonId are required when scopeType is season");
    }

    const stats = await this.userStatsRepository.get(params);
    if (!stats) {
      throw new NotFoundError("user stats not found for given scope", params as Record<string, unknown>);
    }

    return stats;
  }
}
