import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateCalendarStatistics,
  aggregatePersonalRecords,
  aggregatePointProgression,
  aggregateRecentResults,
  orderUserMatchStatistics,
} from "@/domain/statistics/temporal-aggregation.js";
import type { UserMatchStatistics } from "@/domain/statistics/types.js";
import { asIsoDateString, asOpaqueId } from "@/domain/shared/types.js";

const match = (input: {
  id: string;
  playedAt: string;
  sessionId?: string;
  matchIndex?: number;
  gameType?: UserMatchStatistics["gameType"];
  playerCount?: UserMatchStatistics["playerCount"];
  rank: number;
  rawScore: number;
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
  matchIndex: input.matchIndex ?? 1,
  playedAt: asIsoDateString(input.playedAt),
  gameType: input.gameType ?? "yonma",
  playerCount: input.playerCount ?? 4,
  wind: "east",
  rank: input.rank,
  rawScore: input.rawScore,
  finalPoint: input.finalPoint,
  chomboCount: 0,
  opponents: input.opponents ?? [],
  updatedAt: asIsoDateString(input.playedAt),
});

test("orders matches deterministically and accumulates the requested newest window", () => {
  const unordered = [
    match({
      id: "d",
      playedAt: "2026-01-01T00:00:00.000Z",
      sessionId: "session-b",
      rank: 1,
      rawScore: 10,
      finalPoint: 4,
    }),
    match({
      id: "c",
      playedAt: "2026-01-01T00:00:00.000Z",
      sessionId: "session-a",
      matchIndex: 2,
      rank: 1,
      rawScore: 10,
      finalPoint: 3,
    }),
    match({
      id: "b",
      playedAt: "2026-01-01T00:00:00.000Z",
      sessionId: "session-a",
      matchIndex: 1,
      rank: 1,
      rawScore: 10,
      finalPoint: 2,
    }),
    match({
      id: "a",
      playedAt: "2026-01-01T00:00:00.000Z",
      sessionId: "session-a",
      matchIndex: 1,
      rank: 1,
      rawScore: 10,
      finalPoint: 1,
    }),
    match({
      id: "e",
      playedAt: "2026-01-02T00:00:00.000Z",
      sessionId: "session-a",
      matchIndex: 1,
      rank: 1,
      rawScore: 10,
      finalPoint: 5,
    }),
    ...Array.from({ length: 6 }, (_, index) =>
      match({
        id: `old-${index}`,
        playedAt: new Date(Date.UTC(2025, 11, 25 + index)).toISOString(),
        rank: 1,
        rawScore: 10,
        finalPoint: index + 1,
      }),
    ),
  ];

  assert.deepEqual(
    orderUserMatchStatistics(unordered).map((row) => row.matchId),
    [
      "match-old-0",
      "match-old-1",
      "match-old-2",
      "match-old-3",
      "match-old-4",
      "match-old-5",
      "match-a",
      "match-b",
      "match-c",
      "match-d",
      "match-e",
    ],
  );
  assert.deepEqual(
    aggregatePointProgression(unordered, 10).map(
      ({ matchId, cumulativePoint }) => ({ matchId, cumulativePoint }),
    ),
    [
      { matchId: "match-old-1", cumulativePoint: 3 },
      { matchId: "match-old-2", cumulativePoint: 6 },
      { matchId: "match-old-3", cumulativePoint: 10 },
      { matchId: "match-old-4", cumulativePoint: 15 },
      { matchId: "match-old-5", cumulativePoint: 21 },
      { matchId: "match-a", cumulativePoint: 22 },
      { matchId: "match-b", cumulativePoint: 24 },
      { matchId: "match-c", cumulativePoint: 27 },
      { matchId: "match-d", cumulativePoint: 31 },
      { matchId: "match-e", cumulativePoint: 36 },
    ],
  );
});

test("uses localeCompare ordering for case-sensitive time ties across records and streaks", () => {
  const rows = [
    match({
      id: "upper-session",
      playedAt: "2026-01-01T00:00:00.000Z",
      sessionId: "A",
      rank: 1,
      rawScore: 500,
      finalPoint: 5,
    }),
    match({
      id: "upper-match",
      playedAt: "2026-01-01T00:00:00.000Z",
      sessionId: "same",
      rank: 4,
      rawScore: 500,
      finalPoint: -5,
    }),
    match({
      id: "lower-session",
      playedAt: "2026-01-01T00:00:00.000Z",
      sessionId: "a",
      rank: 4,
      rawScore: 500,
      finalPoint: -5,
    }),
    match({
      id: "lower-match",
      playedAt: "2026-01-01T00:00:00.000Z",
      sessionId: "same",
      rank: 1,
      rawScore: 500,
      finalPoint: 5,
    }),
  ];

  assert.deepEqual(
    orderUserMatchStatistics(rows).map(({ matchId }) => matchId),
    [
      "match-lower-session",
      "match-upper-session",
      "match-lower-match",
      "match-upper-match",
    ],
  );
  const result = aggregatePersonalRecords(rows);
  assert.equal(
    result.records.highestRawScore?.match.matchId,
    "match-upper-match",
  );
  assert.equal(
    result.streaks.find(({ type }) => type === "top")?.longestCount,
    2,
  );
  assert.equal(
    result.streaks.find(({ type }) => type === "last")?.longestCount,
    1,
  );
  assert.equal(
    result.streaks.find(({ type }) => type === "last")?.currentCount,
    1,
  );
});

test("groups calendar statistics by Tokyo day, weekday, and time with explicit empty bounded days", () => {
  const rows = [
    match({
      id: "before-midnight",
      playedAt: "2026-01-01T14:59:00.000Z",
      gameType: "sanma",
      playerCount: 3,
      rank: 1,
      rawScore: 40_000,
      finalPoint: 10,
    }),
    match({
      id: "midnight",
      playedAt: "2026-01-01T15:00:00.000Z",
      gameType: "yonma",
      playerCount: 4,
      rank: 4,
      rawScore: 10_000,
      finalPoint: -10,
    }),
    match({
      id: "noon",
      playedAt: "2026-01-02T03:00:00.000Z",
      gameType: "sanma",
      playerCount: 3,
      rank: 2,
      rawScore: 30_000,
      finalPoint: 5,
    }),
  ];

  const daily = aggregateCalendarStatistics(rows, "period", {
    groupBy: "day",
    from: "2026-01-01T15:00:00.000Z",
    to: "2026-01-05T15:00:00.000Z",
  });
  assert.deepEqual(
    daily.rows.map(({ key, gameType, matchCount }) => ({
      key,
      gameType,
      matchCount,
    })),
    [
      { key: "2026-01-02", gameType: "sanma", matchCount: 1 },
      { key: "2026-01-02", gameType: "yonma", matchCount: 1 },
      { key: "2026-01-03", gameType: "sanma", matchCount: 0 },
      { key: "2026-01-03", gameType: "yonma", matchCount: 0 },
      { key: "2026-01-04", gameType: "sanma", matchCount: 0 },
      { key: "2026-01-04", gameType: "yonma", matchCount: 0 },
      { key: "2026-01-05", gameType: "sanma", matchCount: 0 },
      { key: "2026-01-05", gameType: "yonma", matchCount: 0 },
    ],
  );
  assert.deepEqual(daily.rows[0]?.rankCounts, [
    { rank: 1, count: 0 },
    { rank: 2, count: 1 },
    { rank: 3, count: 0 },
  ]);
  assert.equal(daily.rows[2]?.averageRank, null);

  const weekdays = aggregateCalendarStatistics(rows, "weekday");
  assert.deepEqual(
    weekdays.rows.slice(0, 2).map(({ key, label, gameType }) => ({
      key,
      label,
      gameType,
    })),
    [
      { key: "mon", label: "月曜日", gameType: "sanma" },
      { key: "mon", label: "月曜日", gameType: "yonma" },
    ],
  );
  assert.equal(weekdays.rows.length, 14);
  assert.equal(
    weekdays.rows.find(
      ({ key, gameType }) => key === "fri" && gameType === "sanma",
    )?.matchCount,
    1,
  );

  const timeOfDay = aggregateCalendarStatistics(rows, "timeOfDay");
  assert.equal(timeOfDay.rows.length, 8);
  assert.equal(
    timeOfDay.rows.find(
      ({ key, gameType }) => key === "00-05" && gameType === "yonma",
    )?.matchCount,
    1,
  );
  assert.equal(
    timeOfDay.rows.find(
      ({ key, gameType }) => key === "12-17" && gameType === "sanma",
    )?.matchCount,
    1,
  );

  const monthly = aggregateCalendarStatistics(rows, "period", {
    groupBy: "month",
  });
  assert.deepEqual(
    monthly.rows.map(({ key, gameType, matchCount }) => ({
      key,
      gameType,
      matchCount,
    })),
    [
      { key: "2026-01", gameType: "sanma", matchCount: 2 },
      { key: "2026-01", gameType: "yonma", matchCount: 1 },
    ],
  );
  assert.deepEqual(
    aggregateCalendarStatistics(rows, "period", { groupBy: "year" }).rows.map(
      ({ key, gameType, matchCount }) => ({ key, gameType, matchCount }),
    ),
    [
      { key: "2026", gameType: "sanma", matchCount: 2 },
      { key: "2026", gameType: "yonma", matchCount: 1 },
    ],
  );
});

test("aggregates recent 10, 20, and 50 matches from the newest end", () => {
  const rows = Array.from({ length: 21 }, (_, index) =>
    match({
      id: `${index + 1}`,
      playedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
      matchIndex: index + 1,
      rank: 1,
      rawScore: 30_000,
      finalPoint: index + 1,
    }),
  );

  assert.deepEqual(
    aggregateRecentResults(rows).map(
      ({ windowSize, matchCount, totalPoints }) => ({
        windowSize,
        matchCount,
        totalPoints,
      }),
    ),
    [
      { windowSize: 10, matchCount: 10, totalPoints: 165 },
      { windowSize: 20, matchCount: 20, totalPoints: 230 },
      { windowSize: 50, matchCount: 21, totalPoints: 231 },
    ],
  );
});

test("selects newest tied record and counts current and longest streaks by format-aware last place", () => {
  const rows = [
    match({
      id: "1",
      playedAt: "2026-01-01T00:00:00.000Z",
      rank: 1,
      rawScore: 3_000,
      finalPoint: 10,
    }),
    match({
      id: "2",
      playedAt: "2026-01-02T00:00:00.000Z",
      rank: 4,
      rawScore: 30,
      finalPoint: -5,
    }),
    match({
      id: "3",
      playedAt: "2026-01-03T00:00:00.000Z",
      gameType: "sanma",
      playerCount: 3,
      rank: 2,
      rawScore: 1_000,
      finalPoint: 1,
    }),
    match({
      id: "4",
      playedAt: "2026-01-04T00:00:00.000Z",
      rank: 3,
      rawScore: -500,
      finalPoint: -5,
    }),
    match({
      id: "5",
      playedAt: "2026-01-05T00:00:00.000Z",
      gameType: "sanma",
      playerCount: 3,
      rank: 1,
      rawScore: 1_000,
      finalPoint: 2,
    }),
    match({
      id: "6",
      playedAt: "2026-01-06T00:00:00.000Z",
      rank: 1,
      rawScore: 3_000,
      finalPoint: 10,
    }),
    match({
      id: "7",
      playedAt: "2026-01-07T00:00:00.000Z",
      gameType: "sanma",
      playerCount: 3,
      rank: 3,
      rawScore: 2_000,
      finalPoint: 5,
    }),
  ];

  const result = aggregatePersonalRecords([...rows].reverse());
  assert.equal(result.records.highestRawScore?.value, 3_000);
  assert.equal(result.records.highestRawScore?.match.matchId, "match-6");
  assert.equal(result.records.lowestFinalPoint?.match.matchId, "match-4");
  assert.equal(
    result.streaks.find(({ type }) => type === "top")?.currentCount,
    0,
  );
  assert.equal(
    result.streaks.find(({ type }) => type === "top")?.longestCount,
    2,
  );
  assert.equal(
    result.streaks.find(({ type }) => type === "last")?.longestCount,
    1,
  );
  assert.equal(
    result.streaks.find(({ type }) => type === "last")?.currentCount,
    1,
  );
  assert.equal(
    result.streaks.find(({ type }) => type === "topTwo")?.longestCount,
    2,
  );
  assert.equal(
    result.streaks.find(({ type }) => type === "positive")?.currentCount,
    3,
  );
  assert.equal(
    result.streaks.find(({ type }) => type === "positive")?.longestCount,
    3,
  );
  assert.equal(
    result.streaks.find(({ type }) => type === "negative")?.currentCount,
    0,
  );
  assert.equal(
    result.streaks.find(({ type }) => type === "negative")?.longestCount,
    1,
  );
});

test("includes finalized opponents on record matches and bounds them by player count", () => {
  const yonmaOpponents = [1, 2, 3, 4].map((index) => ({
    userId: asOpaqueId(`yonma-opponent-${index}`),
    userName: `四麻相手${index}`,
    rank: index,
    finalPoint: index * -10,
  }));
  const sanmaOpponents = [1, 2, 3].map((index) => ({
    userId: asOpaqueId(`sanma-opponent-${index}`),
    userName: `三麻相手${index}`,
    rank: index,
    finalPoint: index * -10,
  }));
  const result = aggregatePersonalRecords([
    match({
      id: "yonma-record",
      playedAt: "2026-01-01T00:00:00.000Z",
      rank: 1,
      rawScore: 50_000,
      finalPoint: 50,
      opponents: yonmaOpponents,
    }),
    match({
      id: "sanma-record",
      playedAt: "2026-01-02T00:00:00.000Z",
      gameType: "sanma",
      playerCount: 3,
      rank: 3,
      rawScore: 1_000,
      finalPoint: -50,
      opponents: sanmaOpponents,
    }),
  ]);

  assert.deepEqual(result.records.highestRawScore?.match, {
    matchId: "match-yonma-record",
    leagueId: "league-1",
    leagueName: "リーグ",
    seasonId: "season-1",
    seasonName: "シーズン",
    sessionId: "session-1",
    sessionLabel: "session-1",
    playedAt: "2026-01-01T00:00:00.000Z",
    opponents: yonmaOpponents.slice(0, 3),
  });
  assert.equal(result.records.highestRawScore?.match.opponents.length, 3);
  assert.equal(result.records.lowestFinalPoint?.match.opponents.length, 2);
  assert.deepEqual(
    result.records.lowestFinalPoint?.match.opponents,
    sanmaOpponents.slice(0, 2),
  );
});

test("returns empty record and calendar aggregates without inventing results", () => {
  const records = aggregatePersonalRecords([]);
  assert.deepEqual(records.records, {
    highestRawScore: null,
    lowestRawScore: null,
    highestFinalPoint: null,
    lowestFinalPoint: null,
  });
  assert.deepEqual(
    records.streaks.map(({ currentCount, longestCount }) => ({
      currentCount,
      longestCount,
    })),
    Array.from({ length: 5 }, () => ({ currentCount: 0, longestCount: 0 })),
  );
  assert.deepEqual(aggregatePointProgression([], 10), []);
  assert.deepEqual(
    aggregateRecentResults([]).map(({ matchCount, totalPoints }) => ({
      matchCount,
      totalPoints,
    })),
    [
      { matchCount: 0, totalPoints: 0 },
      { matchCount: 0, totalPoints: 0 },
      { matchCount: 0, totalPoints: 0 },
    ],
  );
  assert.deepEqual(aggregateCalendarStatistics([], "weekday").rows, []);
});
