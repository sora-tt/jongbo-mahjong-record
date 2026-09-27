import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSeasonRecords,
  buildStandings,
  buildUserStats,
  sortMatches,
} from "@/domain/shared/aggregation.js";
import type { Match } from "@/domain/match/types.js";
import { asIsoDateString, asOpaqueId } from "@/domain/shared/types.js";

const members = [
  { userId: asOpaqueId("u2"), userName: "同名" },
  { userId: asOpaqueId("u1"), userName: "同名" },
];

const match = (
  id: string,
  sessionId: string,
  matchIndex: number,
  points: [number, number],
): Match => ({
  id: asOpaqueId(id),
  leagueId: asOpaqueId("league"),
  seasonId: asOpaqueId("season"),
  sessionId: asOpaqueId(sessionId),
  matchIndex,
  playedAt: asIsoDateString("2026-01-01T00:00:00.000Z"),
  results: [
    {
      userId: asOpaqueId("u1"),
      userName: "同名",
      wind: "east",
      rank: 1,
      rawScore: 35000,
      point: points[0],
    },
    {
      userId: asOpaqueId("u2"),
      userName: "同名",
      wind: "south",
      rank: 2,
      rawScore: 25000,
      point: points[1],
    },
  ],
  createdAt: asIsoDateString("2026-01-01T00:00:00.000Z"),
  updatedAt: asIsoDateString("2026-01-01T00:00:00.000Z"),
});

test("sorts matches by playedAt, sessionId, matchIndex, and matchId", () => {
  const ordered = sortMatches([
    match("match-2", "session-b", 1, [1, -1]),
    match("match-1", "session-a", 2, [1, -1]),
    match("match-0", "session-a", 1, [1, -1]),
  ]);

  assert.deepEqual(
    ordered.map((value) => value.id),
    ["match-0", "match-1", "match-2"],
  );
});

test("uses userId as the final stable standing tie-breaker", () => {
  const standings = buildStandings(members, [], "sanma");

  assert.deepEqual(
    standings.map((standing) => standing.userId),
    ["u1", "u2"],
  );
});

test("does not calculate fourth-place records for sanma", () => {
  const records = buildSeasonRecords(
    [{ userId: asOpaqueId("u1"), userName: "A" }],
    [
      {
        ...match("match-1", "session-a", 1, [0, 0]),
        results: [
          {
            userId: asOpaqueId("u1"),
            userName: "A",
            wind: "east",
            rank: 1,
            rawScore: 35000,
            point: 0,
          },
          {
            userId: asOpaqueId("u2"),
            userName: "B",
            wind: "south",
            rank: 2,
            rawScore: 25000,
            point: 0,
          },
        ],
      },
    ],
    "sanma",
  );

  assert.equal(records.avoidLastRate, null);
});

test("keeps fourth-place stats null for sanma", () => {
  const stats = buildUserStats({
    scopeType: "season",
    userId: "u1",
    userName: "A",
    leagueId: "league",
    seasonId: "season",
    leagueName: "League",
    seasonName: "Season",
    matchCount: 1,
    currentRank: 1,
    results: [
      {
        userId: asOpaqueId("u1"),
        userName: "A",
        wind: "east",
        rank: 1,
        rawScore: 35000,
        point: 0,
      },
    ],
    playerCount: 3,
  });

  assert.equal(stats.fourthCount, null);
  assert.equal(stats.fourthRate, null);
});
