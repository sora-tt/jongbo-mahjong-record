import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type {
  StatisticsReadIdentity,
  StatisticsScope,
} from "@/domain/statistics/types.js";
import { NotFoundError } from "@/domain/shared/errors.js";
import { StatisticsTargetAccessError } from "@/domain/statistics/errors.js";

export class StatisticsTargetAccessService {
  constructor(
    private readonly leagueRepository: Pick<
      LeagueRepository,
      "areMembers" | "exists"
    >,
    private readonly seasonRepository: Pick<
      SeasonRepository,
      "areMembers" | "exists"
    >,
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
      // Membership repositories may represent a missing scope as `false`.
      // Resolve that ambiguity only on denied requests so missing scopes keep
      // their 404 contract without adding reads to successful target access.
      if (query.scopeType === "league" && query.leagueId) {
        const exists = await this.leagueRepository.exists(query.leagueId);
        if (!exists) {
          throw new NotFoundError("league not found", {
            leagueId: query.leagueId,
          });
        }
      } else if (
        query.scopeType === "season" &&
        query.leagueId &&
        query.seasonId
      ) {
        const exists = await this.seasonRepository.exists(
          query.leagueId,
          query.seasonId,
        );
        if (!exists) {
          throw new NotFoundError("season not found", {
            leagueId: query.leagueId,
            seasonId: query.seasonId,
          });
        }
      }

      throw new StatisticsTargetAccessError({
        scopeType: query.scopeType,
        leagueId: query.leagueId,
        seasonId: query.seasonId,
      });
    }
  }
}
