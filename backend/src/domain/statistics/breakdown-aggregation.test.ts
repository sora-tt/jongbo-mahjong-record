import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateOpponentStatistics,
  aggregateSeatStatistics,
  aggregateSessionStatistics,
} from "@/domain/statistics/breakdown-aggregation.js";
import type { UserMatchStatistics } from "@/domain/statistics/types.js";
import { asIsoDateString, asOpaqueId } from "@/domain/shared/types.js";

const match = (input: {
  id: string;
  sessionId?: string;
  gameType?: UserMatchStatistics["gameType"];
  playerCount?: UserMatchStatistics["playerCount"];
  wind?: UserMatchStatistics["wind"];
  rank: number;
  finalPoint: number;
  opponents?: UserMatchStatistics["opponents"];
}): UserMatchStatistics => ({
  id: asOpaqueId(`projection-${input.id}`),
  userId: asOpaqueId("user-1"),
  userName: "麻雀太郎",
  leagueId: asOpaqueId("league-1"),
  leagueName: "リーグ",
  seasonId: asOpaqueId("season-1"),
  seasonName: "シーズン",
  sessionId: asOpaqueId(input.sessionId ?? "session-1"),
  sessionLabel: input.sessionId ?? "session-1",
  matchId: asOpaqueId(`match-${input.id}`),
  matchIndex: 1,
  playedAt: asIsoDateString("2026-01-01T00:00:00.000Z"),
  gameType: input.gameType ?? "yonma",
  playerCount: input.playerCount ?? 4,
  wind: input.wind ?? "east",
  rank: input.rank,
  rawScore: 25_000,
  finalPoint: input.finalPoint,
  chomboCount: 0,
  opponents: input.opponents ?? [],
  updatedAt: asIsoDateString("2026-01-01T00:00:00.000Z"),
});

const opponent = (
  userId: string,
  rank: number,
  finalPoint: number,
  userName = userId,
): UserMatchStatistics["opponents"][number] => ({
  userId: asOpaqueId(userId),
  userName,
  rank,
  finalPoint,
});

test("aggregates seat statistics by game type with valid seats and empty buckets", () => {
  const breakdown = aggregateSeatStatistics([
    match({
      id: "sanma-east-1",
      gameType: "sanma",
      playerCount: 3,
      wind: "east",
      rank: 1,
      finalPoint: 10,
    }),
    match({
      id: "sanma-east-2",
      gameType: "sanma",
      playerCount: 3,
      wind: "east",
      rank: 2,
      finalPoint: 5,
    }),
    match({
      id: "sanma-north-is-not-a-seat",
      gameType: "sanma",
      playerCount: 3,
      wind: "north",
      rank: 3,
      finalPoint: -15,
    }),
    match({
      id: "yonma-north",
      gameType: "yonma",
      playerCount: 4,
      wind: "north",
      rank: 4,
      finalPoint: -20,
    }),
  ]);

  const rows = breakdown.rows;
  assert.equal(breakdown.nextCursor, null);
  assert.deepEqual(
    rows.map(({ key, gameType }) => ({ key, gameType })),
    [
      { key: "east", gameType: "sanma" },
      { key: "south", gameType: "sanma" },
      { key: "west", gameType: "sanma" },
      { key: "east", gameType: "yonma" },
      { key: "south", gameType: "yonma" },
      { key: "west", gameType: "yonma" },
      { key: "north", gameType: "yonma" },
    ],
  );
  assert.deepEqual(rows[0], {
    key: "east",
    label: "東家",
    gameType: "sanma",
    matchCount: 2,
    denominator: 2,
    totalPoints: 15,
    averageRank: 1.5,
    topRate: 0.5,
    averageFinalPoint: 7.5,
    rankCounts: [
      { rank: 1, count: 1 },
      { rank: 2, count: 1 },
      { rank: 3, count: 0 },
    ],
  });
  assert.deepEqual(rows[1], {
    key: "south",
    label: "南家",
    gameType: "sanma",
    matchCount: 0,
    denominator: 0,
    totalPoints: 0,
    averageRank: null,
    topRate: null,
    averageFinalPoint: null,
    rankCounts: [
      { rank: 1, count: 0 },
      { rank: 2, count: 0 },
      { rank: 3, count: 0 },
    ],
  });
  assert.equal(
    rows.some(({ gameType, key }) => gameType === "sanma" && key === "north"),
    false,
  );
});

test("aggregates opponent results separately by game type and uses encounter count as above-rate denominator", () => {
  const breakdown = aggregateOpponentStatistics([
    match({
      id: "first",
      rank: 2,
      finalPoint: 10,
      opponents: [opponent("user-z", 1, 15), opponent("user-a", 2, 5, "Alpha")],
    }),
    match({
      id: "second",
      rank: 1,
      finalPoint: 20,
      opponents: [
        opponent("user-z", 3, -10),
        opponent("user-a", 4, -5, "Alpha"),
      ],
    }),
    match({
      id: "third",
      gameType: "sanma",
      playerCount: 3,
      rank: 1,
      finalPoint: 12,
      opponents: [opponent("user-a", 2, 8, "Alpha")],
    }),
  ]);

  const rows = breakdown.rows;
  assert.deepEqual(
    rows.map(({ gameType, userId }) => ({ gameType, userId })),
    [
      { gameType: "sanma", userId: "user-a" },
      { gameType: "yonma", userId: "user-a" },
      { gameType: "yonma", userId: "user-z" },
    ],
  );
  assert.deepEqual(rows[1], {
    userId: "user-a",
    userName: "Alpha",
    gameType: "yonma",
    encounterCount: 2,
    aboveRate: 0.5,
    tieCount: 1,
    totalPointDifference: 30,
    averagePointDifference: 15,
  });
  assert.deepEqual(rows[2], {
    userId: "user-z",
    userName: "user-z",
    gameType: "yonma",
    encounterCount: 2,
    aboveRate: 0.5,
    tieCount: 0,
    totalPointDifference: 25,
    averagePointDifference: 12.5,
  });
});

test("aggregates every session with per-game-type rank/top values in stable key order", () => {
  const matches = [
    match({
      id: "session-a-sanma",
      sessionId: "session-a",
      gameType: "sanma",
      playerCount: 3,
      rank: 1,
      finalPoint: 12,
    }),
    match({
      id: "session-a-yonma",
      sessionId: "session-a",
      rank: 2,
      finalPoint: -3,
    }),
    match({
      id: "session-b-yonma",
      sessionId: "session-b",
      rank: 1,
      finalPoint: 9,
    }),
  ];
  const result = aggregateSessionStatistics(matches);
  assert.equal(result.rows.length, 2);
  assert.deepEqual(
    result.rows.map(({ sessionId }) => sessionId),
    ["session-a", "session-b"],
  );
  assert.deepEqual(result.rows[0], {
    sessionId: "session-a",
    label: "session-a",
    matchCount: 2,
    totalPoints: 9,
    averageRankByGameType: [
      {
        gameType: "sanma",
        matchCount: 1,
        totalPoints: 12,
        averageFinalPoint: 12,
        averageRank: 1,
        ranks: [
          { rank: 1, count: 1, rate: 1 },
          { rank: 2, count: 0, rate: 0 },
          { rank: 3, count: 0, rate: 0 },
        ],
        topRate: 1,
        topTwoRate: 1,
        topThreeRate: null,
        lastRate: 0,
        lastAvoidanceRate: 1,
      },
      {
        gameType: "yonma",
        matchCount: 1,
        totalPoints: -3,
        averageFinalPoint: -3,
        averageRank: 2,
        ranks: [
          { rank: 1, count: 0, rate: 0 },
          { rank: 2, count: 1, rate: 1 },
          { rank: 3, count: 0, rate: 0 },
          { rank: 4, count: 0, rate: 0 },
        ],
        topRate: 0,
        topTwoRate: 1,
        topThreeRate: 1,
        lastRate: 0,
        lastAvoidanceRate: 1,
      },
    ],
    topCountByGameType: [
      { gameType: "sanma", count: 1 },
      { gameType: "yonma", count: 0 },
    ],
  });

  assert.equal(result.nextCursor, null);
});

test("returns all opponents in stable key order without producing an unbound cursor", () => {
  const matches = [
    match({
      id: "one",
      rank: 1,
      finalPoint: 10,
      opponents: [opponent("user-b", 2, 5), opponent("user-a", 3, 0)],
    }),
  ];
  const result = aggregateOpponentStatistics(matches);
  assert.deepEqual(
    result.rows.map(({ userId }) => userId),
    ["user-a", "user-b"],
  );
  assert.equal(result.nextCursor, null);
  assert.deepEqual(
    aggregateOpponentStatistics([...matches].reverse()).rows,
    result.rows,
  );
});

test("returns empty breakdown rows when there are no confirmed projections", () => {
  assert.deepEqual(aggregateSeatStatistics([]), {
    dimension: "seat",
    rows: [],
    nextCursor: null,
  });
  assert.deepEqual(aggregateOpponentStatistics([]), {
    dimension: "opponent",
    rows: [],
    nextCursor: null,
  });
  assert.deepEqual(aggregateSessionStatistics([]), {
    dimension: "session",
    rows: [],
    nextCursor: null,
  });
});

test("orders mixed-case opponent and session IDs using the shared locale ordering", () => {
  const rows = ["user-B", "user-b", "user-A", "user-a"].map((userId, index) =>
    match({
      id: `mixed-${index}`,
      sessionId: ["session-B", "session-b", "session-A", "session-a"][index],
      rank: 1,
      finalPoint: 10,
      opponents: [opponent(userId, 2, 5)],
    }),
  );

  assert.deepEqual(
    aggregateOpponentStatistics(rows).rows.map(({ userId }) => userId),
    ["user-a", "user-A", "user-b", "user-B"],
  );
  assert.deepEqual(
    aggregateSessionStatistics(rows).rows.map(({ sessionId }) => sessionId),
    ["session-a", "session-A", "session-b", "session-B"],
  );
});
