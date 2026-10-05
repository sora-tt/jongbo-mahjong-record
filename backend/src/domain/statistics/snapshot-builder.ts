import type { ScopeType, UserId } from "@/domain/shared/types.js";
import type {
  FormatSummary,
  PersonalStatisticsSnapshot,
  UserMatchStatistics,
} from "@/domain/statistics/types.js";
import type { UserStatsUpsertData } from "@/domain/user/types.js";
import { aggregateRankAndScoreStatistics } from "@/domain/statistics/aggregation.js";
import {
  aggregatePersonalRecords,
  aggregateRecentResults,
  orderUserMatchStatistics,
} from "@/domain/statistics/temporal-aggregation.js";

const GAME_TYPES = ["sanma", "yonma"] as const;

type SnapshotMatchInput = UserMatchStatistics | Omit<UserMatchStatistics, "id">;

type BasicStatistics = Pick<
  UserStatsUpsertData,
  | "totalPoints"
  | "totalMatchCount"
  | "chomboCount"
  | "currentRank"
  | "firstCount"
  | "secondCount"
  | "thirdCount"
  | "fourthCount"
>;

type CurrentStandingInput = {
  source: "season" | "activeSeason";
  standings: ReadonlyArray<{
    userId: UserId | string;
    rank: number;
    totalPoints: number;
  }>;
};

export type PersonalStatisticsSnapshotBuildInput = {
  targetUserId: UserId;
  scopeType: ScopeType;
  matches: readonly SnapshotMatchInput[];
  basicStats: BasicStatistics;
  currentStanding: CurrentStandingInput | null;
  /** Scope-level standing reused when only a date-filtered summary is rebuilt. */
  persistedCurrentStanding?: PersonalStatisticsSnapshot["all"]["currentStanding"];
};

const toFullProjection = (match: SnapshotMatchInput): UserMatchStatistics =>
  "id" in match ? match : { ...match, id: match.matchId };

const emptyFormatSummary = (
  gameType: UserMatchStatistics["gameType"],
): FormatSummary => {
  const playerCount = gameType === "sanma" ? 3 : 4;
  return {
    gameType,
    matchCount: 0,
    totalPoints: 0,
    averageFinalPoint: null,
    averageRank: null,
    ranks: Array.from({ length: playerCount }, (_, index) => ({
      rank: index + 1,
      count: 0,
      rate: null,
    })),
    topRate: null,
    topTwoRate: null,
    topThreeRate: null,
    lastRate: null,
    lastAvoidanceRate: null,
  };
};

const roundToOneDecimal = (value: number): number => Number(value.toFixed(1));

const assertBasicStatisticsMatch = (
  matches: readonly UserMatchStatistics[],
  basicStats: BasicStatistics,
): void => {
  const totalPoints = matches.reduce((sum, match) => sum + match.finalPoint, 0);
  const countsByRank = [1, 2, 3, 4].map(
    (rank) => matches.filter((match) => match.rank === rank).length,
  );
  const chomboCount = matches.reduce(
    (sum, match) => sum + match.chomboCount,
    0,
  );
  const formatHasYonma = matches.some((match) => match.gameType === "yonma");
  const fourthCountMatches =
    basicStats.fourthCount === null
      ? !formatHasYonma
      : basicStats.fourthCount === countsByRank[3];

  if (
    basicStats.totalMatchCount !== matches.length ||
    basicStats.totalPoints !== roundToOneDecimal(totalPoints) ||
    basicStats.chomboCount !== chomboCount ||
    basicStats.firstCount !== countsByRank[0] ||
    basicStats.secondCount !== countsByRank[1] ||
    basicStats.thirdCount !== countsByRank[2] ||
    !fourthCountMatches
  ) {
    throw new TypeError(
      "existing user stats do not match the projection input",
    );
  }
};

const resolveCurrentStanding = (
  input: PersonalStatisticsSnapshotBuildInput,
): PersonalStatisticsSnapshot["all"]["currentStanding"] => {
  if (input.scopeType === "overall" || input.currentStanding === null) {
    return null;
  }

  const expectedSource =
    input.scopeType === "season" ? "season" : "activeSeason";
  if (input.currentStanding.source !== expectedSource) {
    throw new TypeError("standing source does not match statistics scope");
  }

  const seenUsers = new Set<string>();
  const seenRanks = new Set<number>();
  input.currentStanding.standings.forEach((standing) => {
    if (
      !Number.isInteger(standing.rank) ||
      standing.rank < 1 ||
      !Number.isFinite(standing.totalPoints) ||
      standing.userId.length === 0 ||
      seenUsers.has(standing.userId) ||
      seenRanks.has(standing.rank)
    ) {
      throw new TypeError(
        "current standings contain invalid or duplicate rows",
      );
    }
    seenUsers.add(standing.userId);
    seenRanks.add(standing.rank);
  });

  const targetStanding = input.currentStanding.standings.find(
    (standing) => standing.userId === input.targetUserId,
  );
  if (targetStanding === undefined) return null;

  const above = input.currentStanding.standings
    .filter((standing) => standing.rank < targetStanding.rank)
    .reduce<
      (typeof input.currentStanding.standings)[number] | null
    >((nearest, standing) => (nearest === null || standing.rank > nearest.rank ? standing : nearest), null);
  const below = input.currentStanding.standings
    .filter((standing) => standing.rank > targetStanding.rank)
    .reduce<
      (typeof input.currentStanding.standings)[number] | null
    >((nearest, standing) => (nearest === null || standing.rank < nearest.rank ? standing : nearest), null);

  return {
    rank: targetStanding.rank,
    totalPoints: targetStanding.totalPoints,
    pointsBehindAbove:
      above === null ? null : above.totalPoints - targetStanding.totalPoints,
    pointsAheadBelow:
      below === null ? null : targetStanding.totalPoints - below.totalPoints,
    source: input.currentStanding.source,
  };
};

const assertCurrentRankMatches = (
  scopeType: ScopeType,
  currentRank: number | null,
  currentStanding: PersonalStatisticsSnapshot["all"]["currentStanding"],
): void => {
  const expectedRank =
    scopeType === "overall" ? null : (currentStanding?.rank ?? null);
  if (currentRank !== expectedRank) {
    throw new TypeError(
      "existing user stats do not match the projection input",
    );
  }
};

const resolvePersistedCurrentStanding = (
  input: PersonalStatisticsSnapshotBuildInput,
): PersonalStatisticsSnapshot["all"]["currentStanding"] => {
  const currentStanding = input.persistedCurrentStanding;
  if (currentStanding === undefined) {
    return resolveCurrentStanding(input);
  }
  if (currentStanding === null) {
    return null;
  }

  const expectedSource =
    input.scopeType === "season" ? "season" : "activeSeason";
  if (
    input.scopeType === "overall" ||
    currentStanding.source !== expectedSource
  ) {
    throw new TypeError("standing source does not match statistics scope");
  }
  if (
    !Number.isInteger(currentStanding.rank) ||
    currentStanding.rank < 1 ||
    !Number.isFinite(currentStanding.totalPoints) ||
    (currentStanding.pointsBehindAbove !== null &&
      (!Number.isFinite(currentStanding.pointsBehindAbove) ||
        currentStanding.pointsBehindAbove < 0)) ||
    (currentStanding.pointsAheadBelow !== null &&
      (!Number.isFinite(currentStanding.pointsAheadBelow) ||
        currentStanding.pointsAheadBelow < 0))
  ) {
    throw new TypeError("persisted current standing contains invalid values");
  }

  return currentStanding;
};

const buildSummaryValues = (
  matches: readonly UserMatchStatistics[],
  currentStanding: PersonalStatisticsSnapshot["all"]["currentStanding"],
  totalPointsOverride?: number,
): PersonalStatisticsSnapshot["byGameType"][number]["summary"] => {
  const aggregation = aggregateRankAndScoreStatistics(matches);
  const recordsAndStreaks = aggregatePersonalRecords(matches);
  return {
    totals: {
      totalMatchCount: aggregation.totalMatchCount,
      sessionCount: new Set(matches.map((match) => match.sessionId)).size,
      totalPoints: totalPointsOverride ?? aggregation.totalPoints,
      averageFinalPoint: aggregation.averageFinalPoint,
      chomboCount: matches.reduce((sum, match) => sum + match.chomboCount, 0),
    },
    rawScore: aggregation.rawScore,
    finalPoint: aggregation.finalPoint,
    scoreByRank: aggregation.scoreByRank,
    records: recordsAndStreaks.records,
    streaks: recordsAndStreaks.streaks,
    recentResults: aggregateRecentResults(matches),
    currentStanding,
  };
};

export const buildPersonalStatisticsSnapshot = (
  input: PersonalStatisticsSnapshotBuildInput,
): PersonalStatisticsSnapshot => {
  const matches = orderUserMatchStatistics(input.matches.map(toFullProjection));
  const seenMatchIds = new Set<string>();
  matches.forEach((match) => {
    if (match.userId !== input.targetUserId || match.chomboCount < 0) {
      throw new TypeError(
        "statistics projections must belong to the target user and have valid chombo counts",
      );
    }
    if (!Number.isInteger(match.chomboCount)) {
      throw new TypeError(
        "statistics projection chombo count must be an integer",
      );
    }
    if (seenMatchIds.has(match.matchId)) {
      throw new TypeError("statistics projections contain a duplicate match");
    }
    seenMatchIds.add(match.matchId);
  });

  assertBasicStatisticsMatch(matches, input.basicStats);
  const currentStanding = resolvePersistedCurrentStanding(input);
  assertCurrentRankMatches(
    input.scopeType,
    input.basicStats.currentRank,
    currentStanding,
  );

  const all = buildSummaryValues(
    matches,
    currentStanding,
    input.basicStats.totalPoints,
  );
  const summariesByGameType = GAME_TYPES.map((gameType) => {
    const formatMatches = matches.filter(
      (match) => match.gameType === gameType,
    );
    return {
      gameType,
      summary: buildSummaryValues(formatMatches, currentStanding),
    };
  });
  const observedFormats = aggregateRankAndScoreStatistics(matches).byGameType;

  return {
    all: {
      ...all,
      byGameType: GAME_TYPES.map(
        (gameType) =>
          observedFormats.find((summary) => summary.gameType === gameType) ??
          emptyFormatSummary(gameType),
      ),
    },
    byGameType: summariesByGameType,
  };
};
