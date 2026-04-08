import type { MatchResult, Rule, Wind } from "@/domain/models.js";
import { ValidationError } from "@/errors.js";

const roundScore = (value: number, mode: Rule["scoreCalculation"]) => {
  switch (mode) {
    case "decimal":
      return value / 1000;
    case "fiveDropSixUp": {
      const base = Math.floor(value / 1000);
      const remainder = Math.abs(value % 1000);
      return remainder >= 600 ? (value >= 0 ? base + 1 : base - 1) : base;
    }
    case "round":
      return Math.round(value / 1000);
    case "floor":
      return Math.floor(value / 1000);
    case "ceil":
      return Math.ceil(value / 1000);
    default:
      return value / 1000;
  }
};

export const calculateMatchPoints = (
  rule: Rule,
  results: Array<{
    userId: string;
    userName: string;
    wind: Wind;
    rank: number;
    rawScore: number;
  }>,
): MatchResult[] => {
  const expectedPlayerCount = rule.gameType === "sanma" ? 3 : 4;
  if (results.length !== expectedPlayerCount) {
    throw new ValidationError(
      `expected ${expectedPlayerCount} players for ${rule.gameType}`,
    );
  }

  const uniqueUserIds = new Set(results.map((result) => result.userId));
  const uniqueWinds = new Set(results.map((result) => result.wind));
  const uniqueRanks = new Set(results.map((result) => result.rank));
  if (uniqueUserIds.size !== results.length) {
    throw new ValidationError("results must not contain duplicate userId");
  }
  if (uniqueWinds.size !== results.length) {
    throw new ValidationError("results must not contain duplicate wind");
  }
  if (uniqueRanks.size !== results.length) {
    throw new ValidationError("results must not contain duplicate rank");
  }

  const rawTotal = results.reduce((sum, result) => sum + result.rawScore, 0);
  const expectedRawTotal = rule.oka.startingPoints * expectedPlayerCount;
  if (rawTotal !== expectedRawTotal) {
    throw new ValidationError("rawScore total does not match table total", {
      expectedRawTotal,
      rawTotal,
    });
  }

  const withPoints = results.map((result) => {
    const adjusted = result.rawScore - rule.oka.returnPoints;
    const base = roundScore(adjusted, rule.scoreCalculation);
    const uma =
      result.rank === 1
        ? rule.uma.first
        : result.rank === 2
          ? rule.uma.second
          : result.rank === 3
            ? rule.uma.third
            : (rule.uma.fourth ?? 0);

    return {
      ...result,
      point: Number((base + uma).toFixed(1)),
    };
  });

  const totalPoint = withPoints.reduce((sum, result) => sum + result.point, 0);
  if (Math.abs(totalPoint) > 0.2) {
    throw new ValidationError("calculated point total must be 0", {
      totalPoint,
    });
  }

  return withPoints;
};
