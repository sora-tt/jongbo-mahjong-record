import assert from "node:assert/strict";
import test from "node:test";
import { buildPersonalStatisticsSnapshot } from "@/domain/statistics/snapshot-builder.js";
import type { UserMatchStatistics } from "@/domain/statistics/types.js";
import { asIsoDateString, asOpaqueId } from "@/domain/shared/types.js";

const match = (input: {
  id: string;
  gameType?: UserMatchStatistics["gameType"];
  rank: number;
  rawScore: number;
  finalPoint: number;
  sessionId?: string;
  playedAt?: string;
  chomboCount?: number;
  opponents?: UserMatchStatistics["opponents"];
}): UserMatchStatistics => {
  const gameType = input.gameType ?? "yonma";
  return {
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
    matchIndex: Number(input.id.replace(/\D/g, "")) || 1,
    playedAt: asIsoDateString(
      input.playedAt ??
        `2026-01-${String(Number(input.id.replace(/\D/g, "")) || 1).padStart(2, "0")}T12:00:00.000Z`,
    ),
    gameType,
    playerCount: gameType === "sanma" ? 3 : 4,
    wind: "east",
    rank: input.rank,
    rawScore: input.rawScore,
    finalPoint: input.finalPoint,
    chomboCount: input.chomboCount ?? 0,
    opponents: input.opponents ?? [
      {
        userId: asOpaqueId("opponent-1"),
        userName: "対戦相手",
        rank: input.rank === 1 ? 2 : 1,
        finalPoint: input.finalPoint - 5,
      },
    ],
    updatedAt: asIsoDateString("2026-01-31T00:00:00.000Z"),
  };
};

const basicStats = (
  matches: readonly UserMatchStatistics[],
  currentRank: number | null = null,
) => ({
  totalMatchCount: matches.length,
  totalPoints: Number(
    matches.reduce((sum, item) => sum + item.finalPoint, 0).toFixed(1),
  ),
  chomboCount: matches.reduce((sum, item) => sum + item.chomboCount, 0),
  currentRank,
  firstCount: matches.filter((item) => item.rank === 1).length,
  secondCount: matches.filter((item) => item.rank === 2).length,
  thirdCount: matches.filter((item) => item.rank === 3).length,
  fourthCount: matches.some((item) => item.gameType === "yonma")
    ? matches.filter((item) => item.rank === 4).length
    : null,
});

const build = (
  matches: readonly UserMatchStatistics[],
  options: {
    scopeType?: "overall" | "league" | "season";
    currentRank?: number | null;
    currentStanding?: {
      source: "season" | "activeSeason";
      standings: Array<{
        userId: string;
        rank: number;
        totalPoints: number;
      }>;
    } | null;
  } = {},
) =>
  buildPersonalStatisticsSnapshot({
    targetUserId: asOpaqueId("user-1"),
    scopeType: options.scopeType ?? "overall",
    matches,
    basicStats: basicStats(matches, options.currentRank ?? null),
    currentStanding: options.currentStanding ?? null,
  });

test("creates an empty bounded snapshot with fixed overall and game-type slices", () => {
  const snapshot = build([]);

  assert.deepEqual(
    snapshot.byGameType.map(({ gameType }) => gameType),
    ["sanma", "yonma"],
  );
  assert.deepEqual(
    snapshot.all.byGameType.map(({ gameType }) => gameType),
    ["sanma", "yonma"],
  );
  assert.equal(snapshot.all.totals.totalMatchCount, 0);
  assert.equal(snapshot.all.totals.sessionCount, 0);
  assert.equal(snapshot.all.totals.averageFinalPoint, null);
  assert.equal(snapshot.all.rawScore.populationStandardDeviation, null);
  assert.equal(snapshot.all.records.highestRawScore, null);
  assert.equal(snapshot.all.currentStanding, null);
  assert.equal(snapshot.byGameType[0]?.summary.totals.totalMatchCount, 0);
  assert.deepEqual(
    snapshot.byGameType[0]?.summary.recentResults.map(
      ({ matchCount }) => matchCount,
    ),
    [0, 0, 0],
  );
  assert.equal("progression" in snapshot.all, false);
  assert.equal("breakdown" in snapshot.all, false);
  assert.equal("history" in snapshot.all, false);
  assert.equal("sessionRows" in snapshot.all, false);
  assert.equal("opponentRows" in snapshot.all, false);
});

test("builds sanma-only results without a fourth-place result or north seat", () => {
  const matches = [
    match({
      id: "sanma-1",
      gameType: "sanma",
      rank: 3,
      rawScore: 10_000,
      finalPoint: -20,
      chomboCount: 1,
    }),
    match({
      id: "sanma-2",
      gameType: "sanma",
      rank: 1,
      rawScore: 45_000,
      finalPoint: 30,
      sessionId: "session-2",
    }),
  ];
  const snapshot = build(matches, {
    scopeType: "season",
    currentRank: 2,
    currentStanding: {
      source: "season",
      standings: [
        { userId: "above", rank: 1, totalPoints: 25 },
        { userId: "user-1", rank: 2, totalPoints: 10 },
        { userId: "below", rank: 3, totalPoints: 4 },
      ],
    },
  });

  const sanma = snapshot.byGameType[0]?.summary;
  assert.equal(sanma?.totals.totalMatchCount, 2);
  assert.equal(sanma?.totals.totalPoints, 10);
  assert.equal(sanma?.totals.sessionCount, 2);
  assert.equal(sanma?.totals.chomboCount, 1);
  assert.deepEqual(
    snapshot.all.byGameType[0]?.ranks.map(({ rank }) => rank),
    [1, 2, 3],
  );
  assert.equal(snapshot.all.byGameType[0]?.topThreeRate, null);
  assert.deepEqual(
    sanma?.scoreByRank.map(({ rank }) => rank),
    [1, 2, 3],
  );
  assert.equal(sanma?.currentStanding?.pointsBehindAbove, 15);
  assert.equal(sanma?.currentStanding?.pointsAheadBelow, 6);
  assert.equal(sanma?.records.highestRawScore?.match.opponents.length, 1);
  assert.equal(
    sanma?.records.highestRawScore?.match.opponents[0]?.userName,
    "対戦相手",
  );
});

test("keeps a fixed empty sanma slice when only yonma matches exist", () => {
  const snapshot = build([
    match({ id: "yonma-1", rank: 4, rawScore: 8_000, finalPoint: -30 }),
  ]);

  assert.deepEqual(
    snapshot.byGameType.map(({ gameType }) => gameType),
    ["sanma", "yonma"],
  );
  assert.equal(snapshot.byGameType[0]?.summary.totals.totalMatchCount, 0);
  assert.equal(snapshot.byGameType[0]?.summary.rawScore.average, null);
  assert.deepEqual(
    snapshot.all.byGameType[0]?.ranks.map(({ rank }) => rank),
    [1, 2, 3],
  );
  assert.deepEqual(
    snapshot.all.byGameType[1]?.ranks.map(({ rank }) => rank),
    [1, 2, 3, 4],
  );
  assert.equal(snapshot.all.byGameType[1]?.lastRate, 1);
  assert.equal(
    snapshot.all.totals.totalMatchCount,
    basicStats([
      match({ id: "yonma-1", rank: 4, rawScore: 8_000, finalPoint: -30 }),
    ]).totalMatchCount,
  );
});

test("keeps mixed-format slices consistent with existing stats and finds standing neighbors", () => {
  const matches = [
    match({
      id: "mixed-1",
      gameType: "sanma",
      rank: 1,
      rawScore: 40_000,
      finalPoint: 20,
      sessionId: "session-a",
      chomboCount: 1,
    }),
    match({
      id: "mixed-2",
      gameType: "yonma",
      rank: 4,
      rawScore: 10_000,
      finalPoint: -10,
      sessionId: "session-b",
    }),
  ];
  const snapshot = build(matches, {
    scopeType: "league",
    currentRank: 2,
    currentStanding: {
      source: "activeSeason",
      standings: [
        { userId: "above", rank: 1, totalPoints: 50 },
        { userId: "user-1", rank: 2, totalPoints: 10 },
        { userId: "below", rank: 3, totalPoints: -15 },
      ],
    },
  });

  assert.equal(
    snapshot.all.totals.totalMatchCount,
    basicStats(matches, 2).totalMatchCount,
  );
  assert.equal(
    snapshot.all.totals.totalPoints,
    basicStats(matches, 2).totalPoints,
  );
  assert.equal(
    snapshot.all.totals.chomboCount,
    basicStats(matches, 2).chomboCount,
  );
  assert.deepEqual(
    snapshot.all.byGameType.map(({ gameType, matchCount }) => ({
      gameType,
      matchCount,
    })),
    [
      { gameType: "sanma", matchCount: 1 },
      { gameType: "yonma", matchCount: 1 },
    ],
  );
  assert.equal(snapshot.all.currentStanding?.source, "activeSeason");
  assert.equal(snapshot.all.currentStanding?.pointsBehindAbove, 40);
  assert.equal(snapshot.all.currentStanding?.pointsAheadBelow, 25);
  assert.equal(snapshot.byGameType[1]?.summary.finalPoint.negative.count, 1);
  assert.equal(snapshot.byGameType[0]?.summary.finalPoint.positive.count, 1);
});

test("calculates streaks and recent windows from deterministic chronological input", () => {
  const matches = Array.from({ length: 12 }, (_, index) => {
    const sequence = index + 1;
    return match({
      id: `recent-${sequence}`,
      rank: sequence <= 10 ? 1 : 4,
      rawScore: sequence * 1_000,
      finalPoint: sequence <= 10 ? 1 : -1,
      sessionId: sequence <= 6 ? "session-a" : "session-b",
    });
  });
  const snapshot = build(matches);
  const summary = snapshot.all;

  assert.equal(summary.totals.sessionCount, 2);
  assert.deepEqual(
    summary.recentResults.map(({ windowSize, matchCount }) => ({
      windowSize,
      matchCount,
    })),
    [
      { windowSize: 10, matchCount: 10 },
      { windowSize: 20, matchCount: 12 },
      { windowSize: 50, matchCount: 12 },
    ],
  );
  assert.deepEqual(
    summary.streaks.map(({ type, currentCount, longestCount }) => ({
      type,
      currentCount,
      longestCount,
    })),
    [
      { type: "top", currentCount: 0, longestCount: 10 },
      { type: "last", currentCount: 2, longestCount: 2 },
      { type: "topTwo", currentCount: 0, longestCount: 10 },
      { type: "positive", currentCount: 0, longestCount: 10 },
      { type: "negative", currentCount: 2, longestCount: 2 },
    ],
  );
  assert.equal(summary.records.highestFinalPoint?.value, 1);
  assert.equal(
    summary.records.highestFinalPoint?.match.matchId,
    asOpaqueId("match-recent-10"),
  );
});

test("returns null standing for overall or when the target is outside scope", () => {
  const matches = [
    match({ id: "standing", rank: 2, rawScore: 30_000, finalPoint: 0 }),
  ];
  const standings = [
    { userId: "other", rank: 1, totalPoints: 10 },
    { userId: "someone-else", rank: 2, totalPoints: 0 },
  ];

  const overall = build(matches, {
    currentStanding: { source: "season", standings },
  });
  const absent = build(matches, {
    scopeType: "season",
    currentStanding: { source: "season", standings },
  });

  assert.equal(overall.all.currentStanding, null);
  assert.equal(absent.all.currentStanding, null);
  assert.equal(absent.byGameType[1]?.summary.currentStanding, null);
});

test("leaves one neighbor gap null at the top and bottom of standings", () => {
  const matches = [
    match({ id: "standing-edge", rank: 2, rawScore: 30_000, finalPoint: 0 }),
  ];
  const atTop = build(matches, {
    scopeType: "season",
    currentRank: 1,
    currentStanding: {
      source: "season",
      standings: [
        { userId: "user-1", rank: 1, totalPoints: 20 },
        { userId: "below", rank: 2, totalPoints: 12 },
      ],
    },
  });
  const atBottom = build(matches, {
    scopeType: "league",
    currentRank: 2,
    currentStanding: {
      source: "activeSeason",
      standings: [
        { userId: "above", rank: 1, totalPoints: 25 },
        { userId: "user-1", rank: 2, totalPoints: 8 },
      ],
    },
  });

  assert.equal(atTop.all.currentStanding?.pointsBehindAbove, null);
  assert.equal(atTop.all.currentStanding?.pointsAheadBelow, 8);
  assert.equal(atBottom.all.currentStanding?.pointsBehindAbove, 17);
  assert.equal(atBottom.all.currentStanding?.pointsAheadBelow, null);
});

test("rejects disagreement between projections, legacy rollup, and standing source", () => {
  const oneMatch = match({
    id: "bad-input",
    rank: 1,
    rawScore: 35_000,
    finalPoint: 15,
  });
  const valid = {
    targetUserId: asOpaqueId("user-1"),
    scopeType: "season" as const,
    matches: [oneMatch],
    basicStats: basicStats([oneMatch]),
    currentStanding: {
      source: "activeSeason" as const,
      standings: [{ userId: "user-1", rank: 1, totalPoints: 15 }],
    },
  };

  assert.throws(
    () => buildPersonalStatisticsSnapshot(valid),
    /standing source does not match statistics scope/,
  );
  assert.throws(
    () =>
      buildPersonalStatisticsSnapshot({
        ...valid,
        currentStanding: null,
        basicStats: { ...valid.basicStats, totalMatchCount: 2 },
      }),
    /existing user stats do not match the projection input/,
  );
});
