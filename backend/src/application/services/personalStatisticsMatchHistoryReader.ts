import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type { UserMatchStatisticsRepository } from "@/domain/statistics/repository.js";
import type {
  StatisticsMatchHistoryQuery,
  StatisticsMatchPage,
  StatisticsScope,
} from "@/domain/statistics/types.js";
import type { IsoDateString } from "@/domain/shared/types.js";
import { StatisticsTargetAccessService } from "@/application/services/statisticsTargetAccessService.js";
import type { UserStatsRepository } from "@/domain/user/repository.js";

const TIME_ZONE = "Asia/Tokyo" as const;
const DEFAULT_HISTORY_PAGE_SIZE = 50;
const MAX_HISTORY_PAGE_SIZE = 100;

const toScope = (query: StatisticsMatchHistoryQuery): StatisticsScope => {
  const filters = {
    ...(query.from === undefined ? {} : { from: query.from }),
    ...(query.to === undefined ? {} : { to: query.to }),
    ...(query.gameType === undefined ? {} : { gameType: query.gameType }),
  };

  if (query.scopeType === "overall") {
    return { ...filters, scopeType: "overall" };
  }
  if (query.scopeType === "league") {
    return {
      ...filters,
      scopeType: "league",
      leagueId: query.leagueId,
    };
  }
  return {
    ...filters,
    scopeType: "season",
    leagueId: query.leagueId,
    seasonId: query.seasonId,
  };
};

const toStatsKey = (query: StatisticsMatchHistoryQuery) => {
  if (query.scopeType === "overall") {
    return { userId: query.targetUserId, scopeType: query.scopeType };
  }
  if (query.scopeType === "league") {
    return {
      userId: query.targetUserId,
      scopeType: query.scopeType,
      leagueId: query.leagueId,
    };
  }
  return {
    userId: query.targetUserId,
    scopeType: query.scopeType,
    leagueId: query.leagueId,
    seasonId: query.seasonId,
  };
};

const toProjectionQuery = (
  query: StatisticsMatchHistoryQuery,
  limit: number,
) => ({
  ...toScope(query),
  userId: query.targetUserId,
  limit,
  ...(query.cursor === undefined ? {} : { cursor: query.cursor }),
});

const resolveLimit = (limit: number | undefined): number => {
  const resolvedLimit = limit === undefined ? DEFAULT_HISTORY_PAGE_SIZE : limit;
  if (
    !Number.isInteger(resolvedLimit) ||
    resolvedLimit < 1 ||
    resolvedLimit > MAX_HISTORY_PAGE_SIZE
  ) {
    throw new TypeError(
      `history page limit must be between 1 and ${MAX_HISTORY_PAGE_SIZE}`,
    );
  }
  return resolvedLimit;
};

const toResult = (
  query: StatisticsMatchHistoryQuery,
  generatedAt: IsoDateString,
  page: Pick<StatisticsMatchPage, "items" | "nextCursor">,
): StatisticsMatchPage => {
  const scope = toScope(query);
  if (page.items.length === 0) {
    return {
      status: "empty",
      scope,
      generatedAt,
      timeZone: TIME_ZONE,
      items: [],
      nextCursor: null,
    };
  }

  return {
    status: "ready",
    scope,
    generatedAt,
    timeZone: TIME_ZONE,
    items: page.items,
    nextCursor: page.nextCursor,
  };
};

export class PersonalStatisticsMatchHistoryReader {
  constructor(
    private readonly accessService: Pick<
      StatisticsTargetAccessService,
      "assertAllowed"
    >,
    private readonly userStatsRepository: Pick<
      UserStatsRepository,
      "getWithPersonalStatistics"
    >,
    private readonly projectionRepository: Pick<
      UserMatchStatisticsRepository,
      "listPage"
    >,
    private readonly leagueRepository: Pick<LeagueRepository, "get">,
    private readonly seasonRepository: Pick<SeasonRepository, "get">,
  ) {}

  async getMatchHistory(
    query: StatisticsMatchHistoryQuery,
  ): Promise<StatisticsMatchPage> {
    await this.accessService.assertAllowed(query);
    await this.assertScopeExists(query);

    const limit = resolveLimit(query.limit);
    const statsRecord =
      await this.userStatsRepository.getWithPersonalStatistics(
        toStatsKey(query),
      );
    if (
      statsRecord === null ||
      !Number.isSafeInteger(statsRecord.personalStatisticsVersion) ||
      statsRecord.personalStatisticsVersion < 1
    ) {
      return {
        status: "uncomputed",
        scope: toScope(query),
        generatedAt: null,
        timeZone: TIME_ZONE,
        items: [],
        nextCursor: null,
      };
    }

    const page = await this.projectionRepository.listPage(
      toProjectionQuery(query, limit),
    );
    return toResult(query, statsRecord.stats.updatedAt, page);
  }

  private async assertScopeExists(
    query: StatisticsMatchHistoryQuery,
  ): Promise<void> {
    if (query.scopeType === "league") {
      await this.leagueRepository.get(query.leagueId);
    } else if (query.scopeType === "season") {
      await this.seasonRepository.get(query.leagueId, query.seasonId);
    }
  }
}
