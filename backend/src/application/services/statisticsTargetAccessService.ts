import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type {
  StatisticsReadIdentity,
  StatisticsScope,
} from "@/domain/statistics/types.js";
import { StatisticsTargetAccessError } from "@/domain/statistics/errors.js";

export class StatisticsTargetAccessService {
  constructor(
    private readonly leagueRepository: Pick<LeagueRepository, "areMembers">,
    private readonly seasonRepository: Pick<SeasonRepository, "areMembers">,
  ) {}

  async assertAllowed(
    query: Pick<StatisticsScope, "scopeType" | "leagueId" | "seasonId"> &
      StatisticsReadIdentity,
  ): Promise<void> {
    if (query.viewerUserId === query.targetUserId) {
      return;
    }

    let isAllowed = false;

    if (query.scopeType === "league" && query.leagueId) {
      isAllowed = await this.leagueRepository.areMembers(
        query.leagueId,
        query.viewerUserId,
        query.targetUserId,
      );
    } else if (
      query.scopeType === "season" &&
      query.leagueId &&
      query.seasonId
    ) {
      isAllowed = await this.seasonRepository.areMembers(
        query.leagueId,
        query.seasonId,
        query.viewerUserId,
        query.targetUserId,
      );
    }

    if (!isAllowed) {
      throw new StatisticsTargetAccessError({
        scopeType: query.scopeType,
        leagueId: query.leagueId,
        seasonId: query.seasonId,
      });
    }
  }
}
