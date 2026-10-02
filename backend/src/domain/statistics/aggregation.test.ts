import assert from "node:assert/strict";
import test from "node:test";
import { aggregateRankAndScoreStatistics } from "@/domain/statistics/aggregation.js";
import type { UserMatchStatistics } from "@/domain/statistics/types.js";
import { asIsoDateString, asOpaqueId } from "@/domain/shared/types.js";

const projection = (
  id: string,
  gameType: UserMatchStatistics["gameType"],
  playerCount: UserMatchStatistics["playerCount"],
  rank: number,
  rawScore: number,
  finalPoint: number,
): UserMatchStatistics => ({
  id: asOpaqueId(`projection-${id}`),
  userId: asOpaqueId("user-1"),
  userName: "麻雀太郎",
  leagueId: asOpaqueId("league-1"),
  leagueName: "リーグ",
  seasonId: asOpaqueId("season-1"),
  seasonName: "シーズン",
  sessionId: asOpaqueId("session-1"),
  sessionLabel: null,
  matchId: asOpaqueId(`match-${id}`),
  matchIndex: Number(id.replace(/\D/g, "")) || 1,
  playedAt: asIsoDateString("2026-01-01T00:00:00.000Z"),
  gameType,
  playerCount,
  wind: "east",
  rank,
  rawScore,
  finalPoint,
  chomboCount: 0,
  opponents: [],
  updatedAt: asIsoDateString("2026-01-01T00:00:00.000Z"),
});

test("aggregates rank rates and score distributions separately for sanma and yonma", () => {
  const result = aggregateRankAndScoreStatistics([
    projection("1", "sanma", 3, 1, 40_000, 45),
    projection("2", "sanma", 3, 3, 15_000, -35),
    projection("3", "yonma", 4, 2, 25_000, 4),
    projection("4", "yonma", 4, 4, 10_000, -14),
  ]);

  assert.equal(result.totalMatchCount, 4);
  assert.equal(result.totalPoints, 0);
  assert.equal(result.averageFinalPoint, 0);
  assert.deepEqual(
    result.byGameType.map(({ gameType, matchCount, averageRank }) => ({
      gameType,
      matchCount,
      averageRank,
    })),
    [
      { gameType: "sanma", matchCount: 2, averageRank: 2 },
      { gameType: "yonma", matchCount: 2, averageRank: 3 },
    ],
  );
  assert.deepEqual(result.byGameType[0]?.ranks, [
    { rank: 1, count: 1, rate: 0.5 },
    { rank: 2, count: 0, rate: 0 },
    { rank: 3, count: 1, rate: 0.5 },
  ]);
  assert.deepEqual(result.byGameType[1]?.ranks, [
    { rank: 1, count: 0, rate: 0 },
    { rank: 2, count: 1, rate: 0.5 },
    { rank: 3, count: 0, rate: 0 },
    { rank: 4, count: 1, rate: 0.5 },
  ]);
  assert.equal(result.byGameType[0]?.topRate, 0.5);
  assert.equal(result.byGameType[0]?.topTwoRate, 0.5);
  assert.equal(result.byGameType[0]?.topThreeRate, null);
  assert.equal(result.byGameType[0]?.lastRate, 0.5);
  assert.equal(result.byGameType[0]?.lastAvoidanceRate, 0.5);
  assert.equal(result.byGameType[1]?.topRate, 0);
  assert.equal(result.byGameType[1]?.topTwoRate, 0.5);
  assert.equal(result.byGameType[1]?.topThreeRate, 0.5);
  assert.equal(result.byGameType[1]?.lastRate, 0.5);
  assert.equal(result.byGameType[1]?.lastAvoidanceRate, 0.5);
  assert.deepEqual(result.rawScore, {
    matchCount: 4,
    average: 22_500,
    maximum: 40_000,
    minimum: 10_000,
    median: 20_000,
    populationStandardDeviation: Math.sqrt(131_250_000),
  });
  assert.deepEqual(result.finalPoint, {
    matchCount: 4,
    average: 0,
    maximum: 45,
    minimum: -35,
    median: -5,
    populationStandardDeviation: Math.sqrt(865.5),
    positive: { count: 2, denominator: 4, rate: 0.5 },
    negative: { count: 2, denominator: 4, rate: 0.5 },
    even: { count: 0, denominator: 4, rate: 0 },
  });
  assert.deepEqual(result.scoreByRank, [
    {
      gameType: "sanma",
      rank: 1,
      matchCount: 1,
      averageRawScore: 40_000,
      averageFinalPoint: 45,
    },
    {
      gameType: "sanma",
      rank: 2,
      matchCount: 0,
      averageRawScore: null,
      averageFinalPoint: null,
    },
    {
      gameType: "sanma",
      rank: 3,
      matchCount: 1,
      averageRawScore: 15_000,
      averageFinalPoint: -35,
    },
    {
      gameType: "yonma",
      rank: 1,
      matchCount: 0,
      averageRawScore: null,
      averageFinalPoint: null,
    },
    {
      gameType: "yonma",
      rank: 2,
      matchCount: 1,
      averageRawScore: 25_000,
      averageFinalPoint: 4,
    },
    {
      gameType: "yonma",
      rank: 3,
      matchCount: 0,
      averageRawScore: null,
      averageFinalPoint: null,
    },
    {
      gameType: "yonma",
      rank: 4,
      matchCount: 1,
      averageRawScore: 10_000,
      averageFinalPoint: -14,
    },
  ]);
});

test("returns null ratios when a game type has no matches and omits sanma fourth place", () => {
  const result = aggregateRankAndScoreStatistics([
    projection("1", "sanma", 3, 2, 30_000, 0),
  ]);

  assert.equal(result.byGameType.length, 1);
  assert.deepEqual(
    result.byGameType[0]?.ranks.map(({ rank }) => rank),
    [1, 2, 3],
  );
  assert.equal(result.byGameType[0]?.ranks[1]?.rate, 1);
  assert.equal(result.finalPoint.positive.rate, 0);
  assert.equal(result.finalPoint.negative.rate, 0);
  assert.equal(result.finalPoint.even.rate, 1);
  assert.equal(result.rawScore.populationStandardDeviation, null);
  assert.equal(result.finalPoint.populationStandardDeviation, null);

  const empty = aggregateRankAndScoreStatistics([]);
  assert.deepEqual(empty.byGameType, []);
  assert.equal(empty.totalMatchCount, 0);
  assert.equal(empty.totalPoints, 0);
  assert.equal(empty.averageFinalPoint, null);
  assert.deepEqual(empty.rawScore, {
    matchCount: 0,
    average: null,
    maximum: null,
    minimum: null,
    median: null,
    populationStandardDeviation: null,
  });
  assert.deepEqual(empty.finalPoint.positive, {
    count: 0,
    denominator: 0,
    rate: null,
  });
  assert.deepEqual(empty.scoreByRank, []);
});
