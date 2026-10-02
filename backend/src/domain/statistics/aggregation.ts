import type {
  FormatSummary,
  NumericSummary,
  RateCount,
  StatisticsGameType,
  UserMatchStatistics,
} from "@/domain/statistics/types.js";

export type RankAndScoreAggregation = {
  totalMatchCount: number;
  totalPoints: number;
  averageFinalPoint: number | null;
  byGameType: FormatSummary[];
  rawScore: NumericSummary;
  finalPoint: NumericSummary & {
    positive: RateCount;
    negative: RateCount;
    even: RateCount;
  };
  scoreByRank: Array<{
    gameType: StatisticsGameType;
    rank: number;
    matchCount: number;
    averageRawScore: number | null;
    averageFinalPoint: number | null;
  }>;
};

export type RankAndScoreAggregationInput = Pick<
  UserMatchStatistics,
  "gameType" | "playerCount" | "rank" | "rawScore" | "finalPoint"
>;

const gameTypeOrder: StatisticsGameType[] = ["sanma", "yonma"];

const emptyNumericSummary = (): NumericSummary => ({
  matchCount: 0,
  average: null,
  maximum: null,
  minimum: null,
  median: null,
  populationStandardDeviation: null,
});

const summarizeNumbers = (values: readonly number[]): NumericSummary => {
  if (values.length === 0) {
    return emptyNumericSummary();
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const sortedValues = [...values].sort((left, right) => left - right);
  const middleIndex = Math.floor(sortedValues.length / 2);
  const median =
    sortedValues.length % 2 === 0
      ? ((sortedValues[middleIndex - 1] ?? 0) +
          (sortedValues[middleIndex] ?? 0)) /
        2
      : (sortedValues[middleIndex] ?? null);
  const populationStandardDeviation =
    values.length < 2
      ? null
      : Math.sqrt(
          values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
            values.length,
        );
  const { maximum, minimum } = values.reduce(
    (bounds, value) => ({
      maximum: Math.max(bounds.maximum, value),
      minimum: Math.min(bounds.minimum, value),
    }),
    { maximum: -Infinity, minimum: Infinity },
  );

  return {
    matchCount: values.length,
    average,
    maximum,
    minimum,
    median,
    populationStandardDeviation,
  };
};

const rateCount = (count: number, denominator: number): RateCount => ({
  count,
  denominator,
  rate: denominator === 0 ? null : count / denominator,
});

const rankCount = (
  matches: readonly RankAndScoreAggregationInput[],
  rank: number,
) => matches.filter((match) => match.rank === rank).length;

const averageOrNull = (values: readonly number[]): number | null =>
  values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length;

const summarizeFormat = (
  gameType: StatisticsGameType,
  matches: readonly RankAndScoreAggregationInput[],
): FormatSummary => {
  const playerCount = gameType === "sanma" ? 3 : 4;
  const denominator = matches.length;
  const lastCount = matches.filter(
    (match) => match.rank === match.playerCount,
  ).length;
  const ranks = Array.from({ length: playerCount }, (_, index) => {
    const rank = index + 1;
    const count = rankCount(matches, rank);
    return {
      rank,
      count,
      rate: denominator === 0 ? null : count / denominator,
    };
  });
  const topCount = rankCount(matches, 1);
  const topTwoCount = matches.filter((match) => match.rank <= 2).length;
  const topThreeCount = matches.filter((match) => match.rank <= 3).length;
  const lastRate = denominator === 0 ? null : lastCount / denominator;

  return {
    gameType,
    matchCount: denominator,
    totalPoints: matches.reduce((sum, match) => sum + match.finalPoint, 0),
    averageFinalPoint: averageOrNull(matches.map((match) => match.finalPoint)),
    averageRank: averageOrNull(matches.map((match) => match.rank)),
    ranks,
    topRate: denominator === 0 ? null : topCount / denominator,
    topTwoRate: denominator === 0 ? null : topTwoCount / denominator,
    topThreeRate:
      gameType === "yonma" && denominator > 0
        ? topThreeCount / denominator
        : null,
    lastRate,
    lastAvoidanceRate: lastRate === null ? null : 1 - lastRate,
  };
};

const summarizeScoreByRank = (
  matches: readonly RankAndScoreAggregationInput[],
): RankAndScoreAggregation["scoreByRank"] =>
  gameTypeOrder.flatMap((gameType) => {
    const formatMatches = matches.filter(
      (match) => match.gameType === gameType,
    );
    if (formatMatches.length === 0) {
      return [];
    }

    const playerCount = gameType === "sanma" ? 3 : 4;
    return Array.from({ length: playerCount }, (_, index) => {
      const rank = index + 1;
      const rankMatches = formatMatches.filter((match) => match.rank === rank);
      return {
        gameType,
        rank,
        matchCount: rankMatches.length,
        averageRawScore: averageOrNull(
          rankMatches.map((match) => match.rawScore),
        ),
        averageFinalPoint: averageOrNull(
          rankMatches.map((match) => match.finalPoint),
        ),
      };
    });
  });

const validateInput = (matches: readonly RankAndScoreAggregationInput[]) => {
  matches.forEach((match) => {
    const expectedPlayerCount = match.gameType === "sanma" ? 3 : 4;
    if (match.playerCount !== expectedPlayerCount) {
      throw new TypeError(
        "statistics projection game type/player count mismatch",
      );
    }
    if (
      !Number.isInteger(match.rank) ||
      match.rank < 1 ||
      match.rank > match.playerCount
    ) {
      throw new TypeError("statistics projection rank is out of range");
    }
    if (
      !Number.isFinite(match.rawScore) ||
      !Number.isFinite(match.finalPoint)
    ) {
      throw new TypeError(
        "statistics projection scores must be finite numbers",
      );
    }
  });
};

export const aggregateRankAndScoreStatistics = (
  matches: readonly RankAndScoreAggregationInput[],
): RankAndScoreAggregation => {
  validateInput(matches);

  const rawScores = matches.map((match) => match.rawScore);
  const finalPoints = matches.map((match) => match.finalPoint);
  const totalMatchCount = matches.length;
  const byGameType = gameTypeOrder.flatMap((gameType) => {
    const formatMatches = matches.filter(
      (match) => match.gameType === gameType,
    );
    return formatMatches.length === 0
      ? []
      : [summarizeFormat(gameType, formatMatches)];
  });
  const rawScore = summarizeNumbers(rawScores);
  const finalPoint = summarizeNumbers(finalPoints);

  return {
    totalMatchCount,
    totalPoints: finalPoints.reduce((sum, value) => sum + value, 0),
    averageFinalPoint: finalPoint.average,
    byGameType,
    rawScore,
    finalPoint: {
      ...finalPoint,
      positive: rateCount(
        finalPoints.filter((value) => value > 0).length,
        totalMatchCount,
      ),
      negative: rateCount(
        finalPoints.filter((value) => value < 0).length,
        totalMatchCount,
      ),
      even: rateCount(
        finalPoints.filter((value) => value === 0).length,
        totalMatchCount,
      ),
    },
    scoreByRank: summarizeScoreByRank(matches),
  };
};
