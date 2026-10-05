import assert from "node:assert/strict";
import test from "node:test";

import { asIsoDateString, asOpaqueId } from "@/domain/shared/types.js";
import type { Match, MatchResult } from "@/domain/match/types.js";
import { buildUserMatchStatisticsProjections } from "@/domain/statistics/projection-builder.js";

const baseMatch = (results: MatchResult[]): Match => ({
  id: asOpaqueId("match-1"),
  leagueId: asOpaqueId("league-1"),
  seasonId: asOpaqueId("season-1"),
  sessionId: asOpaqueId("session-1"),
  matchIndex: 7,
  playedAt: asIsoDateString("2026-09-30T15:04:05.000Z"),
  results,
  chomboEvents: [],
  offTableKyotakuCount: 0,
  createdAt: asIsoDateString("2026-09-30T15:00:00.000Z"),
  updatedAt: asIsoDateString("2026-09-30T15:05:00.000Z"),
});

const result = (
  userId: string,
  rank: number,
  wind: MatchResult["wind"],
  rawScore: number,
  point: number,
): MatchResult => ({
  userId: asOpaqueId(userId),
  userName: `name-${userId}`,
  wind,
  rank,
  rawScore,
  point,
});

const context = {
  league: { id: asOpaqueId("league-1"), name: "League name" },
  season: { id: asOpaqueId("season-1"), name: "Season name" },
  session: { id: asOpaqueId("session-1"), label: "Table 3" },
};

test("builds one projection per confirmed result in result order and preserves confirmed values", () => {
  const match = baseMatch([
    result("user-3", 3, "west", 18_000, -22),
    result("user-1", 1, "east", 42_000, 42),
    result("user-2", 2, "south", 30_000, 5),
  ]);

  const rows = buildUserMatchStatisticsProjections({ match, ...context });
  const repeatedRows = buildUserMatchStatisticsProjections({
    match,
    ...context,
  });

  assert.equal(rows.length, match.results.length);
  assert.deepEqual(repeatedRows, rows);
  assert.deepEqual(
    rows.map(({ userId, rank, wind, rawScore, finalPoint }) => ({
      userId,
      rank,
      wind,
      rawScore,
      finalPoint,
    })),
    [
      {
        userId: asOpaqueId("user-3"),
        rank: 3,
        wind: "west",
        rawScore: 18_000,
        finalPoint: -22,
      },
      {
        userId: asOpaqueId("user-1"),
        rank: 1,
        wind: "east",
        rawScore: 42_000,
        finalPoint: 42,
      },
      {
        userId: asOpaqueId("user-2"),
        rank: 2,
        wind: "south",
        rawScore: 30_000,
        finalPoint: 5,
      },
    ],
  );
  assert.ok(
    rows.every((row) => row.gameType === "sanma" && row.playerCount === 3),
  );
  assert.ok(rows.every((row) => row.playedAt === match.playedAt));
  assert.ok(rows.every((row) => row.matchIndex === match.matchIndex));
  assert.ok(rows.every((row) => row.updatedAt === match.updatedAt));
});

test("derives Sanma and Yonma independently from each match's confirmed result count", () => {
  const sanma = baseMatch([
    result("s1", 1, "east", 40_000, 40),
    result("s2", 2, "south", 30_000, 0),
    result("s3", 3, "west", 20_000, -40),
  ]);
  const yonma: Match = {
    ...baseMatch([
      result("y1", 1, "east", 40_000, 40),
      result("y2", 2, "south", 30_000, 0),
      result("y3", 3, "west", 20_000, -20),
      result("y4", 4, "north", 10_000, -20),
    ]),
    id: asOpaqueId("match-2"),
  };

  const sanmaRows = buildUserMatchStatisticsProjections({
    match: sanma,
    ...context,
  });
  const yonmaRows = buildUserMatchStatisticsProjections({
    match: yonma,
    ...context,
  });

  assert.equal(sanmaRows.length, sanma.results.length);
  assert.equal(yonmaRows.length, yonma.results.length);
  assert.ok(
    sanmaRows.every((row) => row.gameType === "sanma" && row.playerCount === 3),
  );
  assert.ok(
    yonmaRows.every((row) => row.gameType === "yonma" && row.playerCount === 4),
  );
});

test("accepts tied ranks when they match the raw-score competition ranking", () => {
  const match = baseMatch([
    result("user-1", 1, "east", 40_000, 40),
    result("user-2", 2, "south", 30_000, 0),
    result("user-3", 2, "west", 30_000, 0),
    result("user-4", 4, "north", 10_000, -40),
  ]);

  const rows = buildUserMatchStatisticsProjections({ match, ...context });

  assert.deepEqual(
    rows.map(({ userId, rank }) => ({ userId, rank })),
    [
      { userId: asOpaqueId("user-1"), rank: 1 },
      { userId: asOpaqueId("user-2"), rank: 2 },
      { userId: asOpaqueId("user-3"), rank: 2 },
      { userId: asOpaqueId("user-4"), rank: 4 },
    ],
  );
});

test("rejects a Sanma result set that does not contain exactly east, south, and west", () => {
  const withNorth = baseMatch([
    result("user-1", 1, "east", 40_000, 40),
    result("user-2", 2, "south", 30_000, 0),
    result("user-3", 3, "north", 20_000, -40),
  ]);
  const duplicateWind = baseMatch([
    result("user-1", 1, "east", 40_000, 40),
    result("user-2", 2, "east", 30_000, 0),
    result("user-3", 3, "west", 20_000, -40),
  ]);

  assert.throws(
    () => buildUserMatchStatisticsProjections({ match: withNorth, ...context }),
    /wind/,
  );
  assert.throws(
    () =>
      buildUserMatchStatisticsProjections({ match: duplicateWind, ...context }),
    /wind/,
  );
});

test("rejects saved ranks that disagree with raw-score descending order", () => {
  const inconsistentRanks = baseMatch([
    result("user-1", 1, "east", 40_000, 40),
    result("user-2", 1, "south", 30_000, 0),
    result("user-3", 3, "west", 20_000, -40),
  ]);

  assert.throws(
    () =>
      buildUserMatchStatisticsProjections({
        match: inconsistentRanks,
        ...context,
      }),
    /rank/,
  );
});

test("copies only other confirmed results as opponents with their confirmed attributes", () => {
  const match = baseMatch([
    result("user-1", 2, "east", 31_000, 4),
    result("user-2", 1, "south", 39_000, 28),
    result("user-3", 3, "west", 20_000, -32),
  ]);

  const rows = buildUserMatchStatisticsProjections({ match, ...context });

  assert.deepEqual(rows[0]?.opponents, [
    {
      userId: asOpaqueId("user-2"),
      userName: "name-user-2",
      rank: 1,
      finalPoint: 28,
    },
    {
      userId: asOpaqueId("user-3"),
      userName: "name-user-3",
      rank: 3,
      finalPoint: -32,
    },
  ]);
  assert.equal(rows.length, match.results.length);
  for (const row of rows) {
    assert.equal(row.opponents.length, match.results.length - 1);
    assert.ok(
      row.opponents.every((opponent) => opponent.userId !== row.userId),
    );
  }
});

test("counts chombo events by offender without deriving round-level information", () => {
  const match: Match = {
    ...baseMatch([
      result("user-1", 1, "east", 40_000, 40),
      result("user-2", 2, "south", 30_000, 0),
      result("user-3", 3, "west", 20_000, -40),
    ]),
    chomboEvents: [
      { offenderUserId: asOpaqueId("user-2") },
      { offenderUserId: asOpaqueId("user-1") },
      { offenderUserId: asOpaqueId("user-2") },
    ],
  };

  const rows = buildUserMatchStatisticsProjections({ match, ...context });

  assert.deepEqual(
    rows.map(({ chomboCount }) => chomboCount),
    [1, 2, 0],
  );
});

test("rejects a result count that cannot represent a confirmed three- or four-player match", () => {
  const twoResults = baseMatch([
    result("user-1", 1, "east", 40_000, 40),
    result("user-2", 2, "south", 30_000, -40),
  ]);
  const fiveResults = baseMatch([
    result("user-1", 1, "east", 40_000, 40),
    result("user-2", 2, "south", 30_000, 0),
    result("user-3", 3, "west", 20_000, -20),
    result("user-4", 4, "north", 10_000, -20),
    result("user-5", 5, "east", 5_000, 0),
  ]);

  assert.throws(
    () =>
      buildUserMatchStatisticsProjections({ match: twoResults, ...context }),
    /exactly 3 or 4 confirmed results/,
  );
  assert.throws(
    () =>
      buildUserMatchStatisticsProjections({ match: fiveResults, ...context }),
    /exactly 3 or 4 confirmed results/,
  );
});

test("rejects duplicate participants, missing metadata, invalid scores, and invalid match dates", () => {
  const validResults = [
    result("user-1", 1, "east", 40_000, 40),
    result("user-2", 2, "south", 30_000, 0),
    result("user-3", 3, "west", 20_000, -40),
  ];
  const duplicateUserResults = [
    validResults[0]!,
    { ...validResults[1]!, userId: validResults[0]!.userId },
    validResults[2]!,
  ];
  const invalidDateMatch = {
    ...baseMatch(validResults),
    playedAt: "not-a-date",
  } as unknown as Match;
  const missingSeasonName = {
    ...context,
    season: { id: context.season.id },
  } as unknown as typeof context;
  const nonFiniteScoreMatch = baseMatch([
    { ...validResults[0]!, point: Number.NaN },
    validResults[1]!,
    validResults[2]!,
  ]);

  assert.throws(
    () =>
      buildUserMatchStatisticsProjections({
        match: baseMatch(duplicateUserResults),
        ...context,
      }),
    /duplicate participant/,
  );
  assert.throws(
    () =>
      buildUserMatchStatisticsProjections({
        match: baseMatch(validResults),
        ...missingSeasonName,
      }),
    /season name/,
  );
  assert.throws(
    () =>
      buildUserMatchStatisticsProjections({
        match: nonFiniteScoreMatch,
        ...context,
      }),
    /finite confirmed values/,
  );
  assert.throws(
    () =>
      buildUserMatchStatisticsProjections({
        match: invalidDateMatch,
        ...context,
      }),
    /valid playedAt/,
  );
});

test("requires the metadata IDs to match the authoritative match scope", () => {
  const match = baseMatch([
    result("user-1", 1, "east", 40_000, 40),
    result("user-2", 2, "south", 30_000, 0),
    result("user-3", 3, "west", 20_000, -40),
  ]);

  assert.throws(
    () =>
      buildUserMatchStatisticsProjections({
        match,
        ...context,
        league: { id: asOpaqueId("wrong-league"), name: "League name" },
      }),
    /metadata IDs must match the match scope/,
  );
});
