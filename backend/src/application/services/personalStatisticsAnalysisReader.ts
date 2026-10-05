import { createHash } from "node:crypto";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type { UserMatchStatisticsRepository } from "@/domain/statistics/repository.js";
import type {
  BreakdownDimension,
  StatisticsAnalysis,
  StatisticsAnalysisQuery,
  StatisticsAnalysisResult,
  StatisticsBreakdown,
  StatisticsScope,
  UserMatchStatistics,
} from "@/domain/statistics/types.js";
import {
  aggregateSeatStatistics,
  aggregateOpponentStatistics,
  aggregateSessionStatistics,
} from "@/domain/statistics/breakdown-aggregation.js";
import {
  aggregateCalendarStatistics,
  aggregatePointProgression,
} from "@/domain/statistics/temporal-aggregation.js";
import { StatisticsTargetAccessService } from "@/application/services/statisticsTargetAccessService.js";
import type { UserStatsRepository } from "@/domain/user/repository.js";
import { NotFoundError } from "@/domain/shared/errors.js";

const TIME_ZONE = "Asia/Tokyo" as const;
const DEFAULT_BREAKDOWN_PAGE_SIZE = 20;
const MAX_BREAKDOWN_PAGE_SIZE = 100;
const GAME_TYPE_ORDER: UserMatchStatistics["gameType"][] = ["sanma", "yonma"];
const BREAKDOWN_DIMENSIONS: readonly BreakdownDimension[] = [
  "period",
  "weekday",
  "timeOfDay",
  "seat",
  "opponent",
  "session",
];
const CALENDAR_GROUPS = ["day", "month", "year"] as const;
const PROGRESSION_WINDOW_SIZES = [10, 20, 50] as const;

const isBreakdownDimension = (value: unknown): value is BreakdownDimension =>
  typeof value === "string" &&
  BREAKDOWN_DIMENSIONS.includes(value as BreakdownDimension);

const isCalendarGroup = (
  value: unknown,
): value is NonNullable<StatisticsAnalysisQuery["groupBy"]> =>
  typeof value === "string" &&
  CALENDAR_GROUPS.includes(value as (typeof CALENDAR_GROUPS)[number]);

const isProgressionWindowSize = (
  value: unknown,
): value is StatisticsAnalysisQuery["windowSize"] =>
  typeof value === "number" &&
  PROGRESSION_WINDOW_SIZES.includes(
    value as (typeof PROGRESSION_WINDOW_SIZES)[number],
  );

type BreakdownCursor =
  | {
      dimension: "opponent";
      gameType: UserMatchStatistics["gameType"];
      userId: string;
    }
  | { dimension: "session"; sessionId: string };

type AnalysisCursor = {
  version: 1;
  queryHash: string;
  after: BreakdownCursor;
};

type PageBreakdown = Extract<
  StatisticsBreakdown,
  { dimension: "opponent" | "session" }
>;

const toScope = (query: StatisticsAnalysisQuery): StatisticsScope => {
  const filters = {
    ...(query.from === undefined ? {} : { from: query.from }),
    ...(query.to === undefined ? {} : { to: query.to }),
    ...(query.gameType === undefined ? {} : { gameType: query.gameType }),
  };

  if (query.scopeType === "overall") {
    return { ...filters, scopeType: "overall" };
  }
  if (query.scopeType === "league") {
    return { ...filters, scopeType: "league", leagueId: query.leagueId };
  }
  return {
    ...filters,
    scopeType: "season",
    leagueId: query.leagueId,
    seasonId: query.seasonId,
  };
};

const toStatsKey = (query: StatisticsAnalysisQuery) => {
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

const toProjectionQuery = (query: StatisticsAnalysisQuery) => ({
  ...toScope(query),
  userId: query.targetUserId,
});

const queryHash = (query: StatisticsAnalysisQuery): string =>
  createHash("sha256")
    .update(
      JSON.stringify({
        viewerUserId: query.viewerUserId,
        targetUserId: query.targetUserId,
        scopeType: query.scopeType,
        leagueId: query.scopeType === "overall" ? null : query.leagueId,
        seasonId: query.scopeType === "season" ? query.seasonId : null,
        from: query.from ?? null,
        to: query.to ?? null,
        gameType: query.gameType ?? "all",
        dimension: query.dimension,
        groupBy: query.dimension === "period" ? (query.groupBy ?? "day") : null,
        windowSize: query.windowSize,
        limit: query.limit ?? DEFAULT_BREAKDOWN_PAGE_SIZE,
      }),
    )
    .digest("hex");

const encodeCursor = (cursor: AnalysisCursor): string =>
  Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");

const decodeCursor = (
  encoded: string,
  expectedHash: string,
  dimension: BreakdownDimension,
): BreakdownCursor => {
  let value: unknown;
  try {
    value = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw new TypeError("invalid cursor");
  }

  if (typeof value !== "object" || value === null) {
    throw new TypeError("invalid cursor");
  }

  const cursor = value as Partial<AnalysisCursor>;
  if (cursor.version !== 1 || typeof cursor.queryHash !== "string") {
    throw new TypeError("invalid cursor");
  }
  if (cursor.queryHash !== expectedHash) {
    throw new TypeError("cursor does not match query");
  }
  if (typeof cursor.after !== "object" || cursor.after === null) {
    throw new TypeError("invalid cursor");
  }

  const after = cursor.after as Partial<BreakdownCursor>;
  if (
    dimension === "opponent" &&
    after.dimension === "opponent" &&
    (after.gameType === "sanma" || after.gameType === "yonma") &&
    typeof after.userId === "string" &&
    after.userId.length > 0
  ) {
    return {
      dimension: "opponent",
      gameType: after.gameType,
      userId: after.userId,
    };
  }
  if (
    dimension === "session" &&
    after.dimension === "session" &&
    typeof after.sessionId === "string" &&
    after.sessionId.length > 0
  ) {
    return { dimension: "session", sessionId: after.sessionId };
  }
  throw new TypeError("invalid cursor");
};

const compareOpponentCursor = (
  row: Extract<PageBreakdown, { dimension: "opponent" }>["rows"][number],
  after: Extract<BreakdownCursor, { dimension: "opponent" }>,
): number =>
  GAME_TYPE_ORDER.indexOf(row.gameType) -
    GAME_TYPE_ORDER.indexOf(after.gameType) ||
  row.userId.localeCompare(after.userId);

const compareSessionCursor = (
  row: Extract<PageBreakdown, { dimension: "session" }>["rows"][number],
  after: Extract<BreakdownCursor, { dimension: "session" }>,
): number => row.sessionId.localeCompare(after.sessionId);

const paginateBreakdown = (
  breakdown: PageBreakdown,
  query: StatisticsAnalysisQuery,
  hash: string,
  limit: number,
  after?: BreakdownCursor,
): PageBreakdown => {
  if (breakdown.dimension === "opponent") {
    const pageRows = breakdown.rows
      .filter(
        (row) =>
          after === undefined ||
          (after.dimension === "opponent" &&
            compareOpponentCursor(row, after) > 0),
      )
      .slice(0, limit + 1);
    const hasNextPage = pageRows.length > limit;
    const rows = pageRows.slice(0, limit);
    const lastRow = rows.at(-1);
    return {
      ...breakdown,
      rows,
      nextCursor:
        hasNextPage && lastRow
          ? encodeCursor({
              version: 1,
              queryHash: hash,
              after: {
                dimension: "opponent",
                gameType: lastRow.gameType,
                userId: lastRow.userId,
              },
            })
          : null,
    };
  }

  const pageRows = breakdown.rows
    .filter(
      (row) =>
        after === undefined ||
        (after.dimension === "session" && compareSessionCursor(row, after) > 0),
    )
    .slice(0, limit + 1);
  const hasNextPage = pageRows.length > limit;
  const rows = pageRows.slice(0, limit);
  const lastRow = rows.at(-1);
  return {
    ...breakdown,
    rows,
    nextCursor:
      hasNextPage && lastRow
        ? encodeCursor({
            version: 1,
            queryHash: hash,
            after: { dimension: "session", sessionId: lastRow.sessionId },
          })
        : null,
  };
};

const aggregateBreakdown = (
  query: StatisticsAnalysisQuery,
  matches: readonly UserMatchStatistics[],
): StatisticsBreakdown => {
  switch (query.dimension) {
    case "period":
    case "weekday":
    case "timeOfDay":
      return aggregateCalendarStatistics(matches, query.dimension, {
        ...(query.groupBy === undefined ? {} : { groupBy: query.groupBy }),
        ...(query.from === undefined ? {} : { from: query.from }),
        ...(query.to === undefined ? {} : { to: query.to }),
      });
    case "seat":
      return aggregateSeatStatistics(matches);
    case "opponent":
      return aggregateOpponentStatistics(matches);
    case "session":
      return aggregateSessionStatistics(matches);
  }
};

export class PersonalStatisticsAnalysisReader {
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
      "listForScope"
    >,
    private readonly leagueRepository: Pick<LeagueRepository, "exists">,
    private readonly seasonRepository: Pick<SeasonRepository, "exists">,
  ) {}

  async getAnalysis(
    query: StatisticsAnalysisQuery,
  ): Promise<StatisticsAnalysisResult> {
    await this.accessService.assertAllowed(query);
    await this.assertScopeExists(query);

    if (!isBreakdownDimension(query.dimension)) {
      throw new TypeError("invalid statistics analysis dimension");
    }
    if (!isProgressionWindowSize(query.windowSize)) {
      throw new TypeError("invalid statistics analysis windowSize");
    }
    if (query.groupBy !== undefined && query.dimension !== "period") {
      throw new TypeError("groupBy is only supported for period dimension");
    }
    if (query.groupBy !== undefined && !isCalendarGroup(query.groupBy)) {
      throw new TypeError("invalid statistics analysis groupBy");
    }

    const isPagedDimension =
      query.dimension === "opponent" || query.dimension === "session";
    if (
      !isPagedDimension &&
      (query.cursor !== undefined || query.limit !== undefined)
    ) {
      throw new TypeError(
        "limit and cursor are only supported for opponent/session dimensions",
      );
    }
    const limit = query.limit ?? DEFAULT_BREAKDOWN_PAGE_SIZE;
    if (
      isPagedDimension &&
      (!Number.isInteger(limit) || limit < 1 || limit > MAX_BREAKDOWN_PAGE_SIZE)
    ) {
      throw new TypeError(
        `analysis breakdown limit must be between 1 and ${MAX_BREAKDOWN_PAGE_SIZE}`,
      );
    }

    const hash = queryHash(query);
    const after =
      query.cursor === undefined
        ? undefined
        : decodeCursor(query.cursor, hash, query.dimension);

    const statsRecord =
      await this.userStatsRepository.getWithPersonalStatistics(
        toStatsKey(query),
      );
    if (statsRecord === null || statsRecord.personalStatisticsVersion < 1) {
      return {
        status: "uncomputed",
        scope: toScope(query),
        generatedAt: null,
        timeZone: TIME_ZONE,
        windowSize: query.windowSize,
      };
    }

    const projections = await this.projectionRepository.listForScope(
      toProjectionQuery(query),
    );
    // Keep the read boundary safe even if a repository implementation returns a wider row set.
    const matches = projections.filter(
      (match) => match.userId === query.targetUserId,
    );
    const breakdown = aggregateBreakdown(query, matches);
    const resultBreakdown = isPagedDimension
      ? paginateBreakdown(breakdown as PageBreakdown, query, hash, limit, after)
      : breakdown;

    return {
      status: matches.length === 0 ? "empty" : "ready",
      scope: toScope(query),
      generatedAt: statsRecord.stats.updatedAt,
      timeZone: TIME_ZONE,
      windowSize: query.windowSize,
      progression: aggregatePointProgression(matches, query.windowSize),
      breakdown: resultBreakdown,
    } satisfies StatisticsAnalysis;
  }

  private async assertScopeExists(
    query: StatisticsAnalysisQuery,
  ): Promise<void> {
    if (query.scopeType === "league") {
      if (!(await this.leagueRepository.exists(query.leagueId))) {
        throw new NotFoundError("league not found", {
          leagueId: query.leagueId,
        });
      }
    } else if (query.scopeType === "season") {
      if (
        !(await this.seasonRepository.exists(query.leagueId, query.seasonId))
      ) {
        throw new NotFoundError("season not found", {
          leagueId: query.leagueId,
          seasonId: query.seasonId,
        });
      }
    }
  }
}
