import type { MatchResult } from "@/domain/match/types.js";
import type { LeagueRule } from "@/domain/league/types.js";
import { ValidationError } from "@/domain/shared/errors.js";
import { asOpaqueId, type GameType, type Wind } from "@/domain/shared/types.js";

const expectedWindsByGameType: Record<GameType, readonly Wind[]> = {
  sanma: ["east", "south", "west"],
  yonma: ["east", "south", "west", "north"],
};

export const calculateMatchPoints = (
  rule: LeagueRule,
  results: Array<{
    userId: string;
    userName: string;
    wind: Wind;
    rawScore: number;
  }>,
): MatchResult[] => {
  if (rule.uma.mode !== "fixed") {
    throw new ValidationError("floatingCount uma is not supported yet", {
      field: "rule.uma.mode",
      mode: rule.uma.mode,
    });
  }

  const fixedUma = rule.uma;
  const getUmaByRank = (rank: number) => {
    const playerCount = rule.gameType === "sanma" ? 3 : 4;
    const oka =
      ((rule.oka.returnPoints - rule.oka.startingPoints) * playerCount) / 1000;

    if (rank === 1) {
      return fixedUma.first + oka;
    }
    if (rank === 2) {
      return fixedUma.second;
    }
    if (rank === 3) {
      return fixedUma.third;
    }
    return fixedUma.fourth ?? 0;
  };

  const expectedPlayerCount = rule.gameType === "sanma" ? 3 : 4;
  if (results.length !== expectedPlayerCount) {
    throw new ValidationError(
      `expected ${expectedPlayerCount} players for ${rule.gameType}`,
    );
  }

  const uniqueUserIds = new Set(results.map((result) => result.userId));
  const uniqueWinds = new Set(results.map((result) => result.wind));
  if (uniqueUserIds.size !== results.length) {
    throw new ValidationError("results must not contain duplicate userId");
  }
  if (uniqueWinds.size !== results.length) {
    throw new ValidationError("results must not contain duplicate wind");
  }

  const expectedWinds = expectedWindsByGameType[rule.gameType];
  if (
    results.some((result) => !expectedWinds.includes(result.wind)) ||
    expectedWinds.some((wind) => !uniqueWinds.has(wind))
  ) {
    throw new ValidationError(`wind is not allowed for ${rule.gameType}`, {
      field: "results.wind",
      gameType: rule.gameType,
      expectedWinds,
    });
  }

  const rawTotal = results.reduce((sum, result) => sum + result.rawScore, 0);
  const expectedRawTotal = rule.oka.startingPoints * expectedPlayerCount;
  if (rawTotal !== expectedRawTotal) {
    throw new ValidationError("rawScore total does not match table total", {
      expectedRawTotal,
      rawTotal,
    });
  }

  // rank は入力値を信用せず、rawScore から再計算する。同点時も backend 側で一貫して扱う。
  const sorted = [...results].sort(
    (left, right) => right.rawScore - left.rawScore,
  );
  const ranked: Array<(typeof results)[number] & { rank: number }> = [];

  sorted.forEach((result, index) => {
    const previous = ranked[index - 1];
    const rank =
      index === 0 || previous.rawScore !== result.rawScore
        ? index + 1
        : previous.rank;

    ranked.push({
      ...result,
      rank,
    });
  });

  const withPoints = ranked.map((result) => {
    // 同順位がいる場合、その順位帯の uma を等分して配る。1 位 uma には oka を事前加算している。
    const tiedPlayers = ranked.filter(
      (candidate) => candidate.rank === result.rank,
    );
    const occupiedRanks = Array.from(
      { length: tiedPlayers.length },
      (_, index) => result.rank + index,
    );
    const splitUma =
      occupiedRanks.reduce((sum, rank) => sum + getUmaByRank(rank), 0) /
      tiedPlayers.length;
    // rawScore は 100 点単位で渡される前提なので、素点差は 1000 で割るだけでよい。
    const adjusted = result.rawScore - rule.oka.returnPoints;
    const base = adjusted / 1000;

    return {
      ...result,
      point: Number((base + splitUma).toFixed(1)),
    };
  });

  const totalPoint = withPoints.reduce((sum, result) => sum + result.point, 0);
  if (Math.abs(totalPoint) > 0.2) {
    throw new ValidationError("calculated point total must be 0", {
      totalPoint,
    });
  }

  return withPoints.map((result) => ({
    ...result,
    userId: asOpaqueId(result.userId),
  }));
};
