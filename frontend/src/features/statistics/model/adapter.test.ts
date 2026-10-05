import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import {
  toPersonalStatisticsAnalysisView,
  toPersonalStatisticsSummaryView,
  toPointProgressionChart,
  toStatisticsMatchHistoryView,
  toStandingRows,
  toUserStats,
} from "./adapter";

import type {
  PersonalStatisticsAnalysisResponse,
  PersonalStatisticsSummaryResponse,
  StatisticsMatchHistoryResponse,
} from "@/features/statistics/api";
import type { ApiSeason, ApiUserStats } from "@/lib/api/contracts";

const userStats = (overrides: Partial<ApiUserStats> = {}): ApiUserStats =>
  ({
    id: "stats-1",
    userId: "user-1",
    userName: "テスト太郎",
    scopeType: "season",
    leagueId: "league-1",
    seasonId: "season-1",
    leagueName: "テストリーグ",
    seasonName: "春シーズン",
    totalPoints: 12.3,
    totalMatchCount: 4,
    averageRank: 2.25,
    currentRank: 2,
    firstCount: 1,
    secondCount: 1,
    thirdCount: 1,
    fourthCount: 1,
    firstRate: 25,
    secondRate: 25,
    thirdRate: 25,
    fourthRate: 25,
    highestScore: 32000,
    lowestScore: 18000,
    averageScore: 25000,
    winStreak: 2,
    loseStreak: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  }) as ApiUserStats;

test("toUserStats keeps nullable BE values instead of filling defaults", () => {
  const view = toUserStats(
    userStats({
      currentRank: null,
      fourthCount: null,
      fourthRate: null,
      highestScore: null,
      lowestScore: null,
      averageScore: null,
      winStreak: null,
      loseStreak: null,
    })
  );

  strictEqual(view.currentRank, null);
  strictEqual(view.fourthCount, null);
  strictEqual(view.fourthRate, null);
  strictEqual(view.highestScore, null);
  strictEqual(view.createdAt, "2026-01-01T00:00:00.000Z");
});

test("toStandingRows preserves BE order and nullable fourth values", () => {
  const standings = [
    {
      rank: 2,
      userId: "user-2",
      userName: "二郎",
      totalPoints: 1,
      matchCount: 1,
      firstCount: 0,
      secondCount: 1,
      thirdCount: 0,
      fourthCount: null,
    },
    {
      rank: 1,
      userId: "user-1",
      userName: "一郎",
      totalPoints: 2,
      matchCount: 1,
      firstCount: 1,
      secondCount: 0,
      thirdCount: 0,
      fourthCount: null,
    },
  ] as ApiSeason["standings"];

  const rows = toStandingRows(standings);

  deepStrictEqual(
    rows.map((row) => row.userName),
    ["二郎", "一郎"]
  );
  strictEqual(rows[0]?.rank, 2);
  strictEqual(rows[0]?.fourthCount, null);
});

test("toPointProgressionChart keeps missing points as null without filling values", () => {
  const chart = toPointProgressionChart([
    {
      userId: "user-1",
      userName: "一郎",
      points: [
        { matchIndex: 1, totalPoints: 10 },
        { matchIndex: 3, totalPoints: 30 },
      ],
    },
    {
      userId: "user-2",
      userName: "二郎",
      points: [{ matchIndex: 1, totalPoints: -10 }],
    },
  ] as ApiSeason["pointProgressions"]);

  deepStrictEqual(
    chart.data.map((row) => row.matchIndex),
    [1, 3]
  );
  strictEqual(chart.data[0]?.["user-1"], 10);
  strictEqual(chart.data[1]?.["user-1"], 30);
  strictEqual(chart.data[1]?.["user-2"], null);
  strictEqual(
    chart.data.some((row) => row.matchIndex === 2),
    false
  );
});

test("toPointProgressionChart distinguishes uncomputed series from empty series", () => {
  const uncomputed = toPointProgressionChart(
    [
      { userId: "user-1", userName: "一郎", points: [] },
    ] as unknown as ApiSeason["pointProgressions"],
    1
  );
  const zeroMatch = toPointProgressionChart(
    [
      { userId: "user-1", userName: "一郎", points: [] },
    ] as unknown as ApiSeason["pointProgressions"],
    0
  );
  const empty = toPointProgressionChart([]);

  strictEqual(uncomputed.isEmpty, true);
  strictEqual(uncomputed.isUncomputed, true);
  strictEqual(zeroMatch.isEmpty, true);
  strictEqual(zeroMatch.isUncomputed, false);
  strictEqual(empty.isEmpty, true);
  strictEqual(empty.isUncomputed, false);
});

test("statistics summary adapter preserves null values, status, scope, and target identity", () => {
  const response = {
    status: "uncomputed",
    scope: { scopeType: "season", leagueId: "league-1", seasonId: "season-1" },
    generatedAt: null,
    timeZone: "Asia/Tokyo",
  } as PersonalStatisticsSummaryResponse;

  const view = toPersonalStatisticsSummaryView(response, "user-1");

  strictEqual(view.status, "uncomputed");
  strictEqual(view.generatedAt, null);
  strictEqual(view.scope.scopeType, "season");
  strictEqual(view.scope.leagueId, "league-1");
  strictEqual(view.scope.seasonId, "season-1");
  strictEqual(view.targetUserId, "user-1");
});

test("statistics analysis adapter preserves ordered rows, nullable values, and cursor", () => {
  const response = {
    status: "ready",
    scope: { scopeType: "overall" },
    generatedAt: "2026-02-01T00:00:00.000Z",
    timeZone: "Asia/Tokyo",
    windowSize: 10,
    progression: [
      {
        playedAt: "2026-01-01T00:00:00.000Z",
        matchId: "match-2",
        matchIndex: 2,
        gameType: "sanma",
        point: 3,
        cumulativePoint: 7,
      },
      {
        playedAt: "2026-01-01T00:00:00.000Z",
        matchId: "match-1",
        matchIndex: 1,
        gameType: "sanma",
        point: -1,
        cumulativePoint: 4,
      },
    ],
    breakdown: {
      dimension: "opponent",
      rows: [
        {
          userId: "opponent-2",
          userName: "二郎",
          gameType: "sanma",
          encounterCount: 2,
          aboveRate: null,
          tieCount: 1,
          totalPointDifference: 0,
          averagePointDifference: 0,
        },
        {
          userId: "opponent-1",
          userName: "一郎",
          gameType: "sanma",
          encounterCount: 1,
          aboveRate: 1,
          tieCount: 0,
          totalPointDifference: 2,
          averagePointDifference: 2,
        },
      ],
      nextCursor: "opaque-next-cursor",
    },
  } as unknown as PersonalStatisticsAnalysisResponse;

  const view = toPersonalStatisticsAnalysisView(response, "user-1");

  strictEqual(view.targetUserId, "user-1");
  if (view.status !== "uncomputed" && view.breakdown.dimension === "opponent") {
    strictEqual(view.progression[0]?.matchId, "match-2");
    strictEqual(view.breakdown.rows[0]?.userId, "opponent-2");
    strictEqual(view.breakdown.rows[0]?.aboveRate, null);
    strictEqual(view.breakdown.nextCursor, "opaque-next-cursor");
  }
});

test("statistics history adapter preserves ready status, item order, null labels, and cursor", () => {
  const response = {
    status: "ready",
    scope: { scopeType: "overall" },
    generatedAt: "2026-02-01T00:00:00.000Z",
    timeZone: "Asia/Tokyo",
    items: [
      {
        match: {
          matchId: "match-2",
          leagueId: "league-1",
          leagueName: "リーグ",
          seasonId: "season-1",
          seasonName: "シーズン",
          sessionId: "session-1",
          sessionLabel: null,
          playedAt: "2026-02-01T00:00:00.000Z",
        },
        gameType: "sanma",
        wind: "east",
        rank: 2,
        rawScore: 35000,
        finalPoint: 3,
        opponents: [],
      },
      {
        match: {
          matchId: "match-1",
          leagueId: "league-1",
          leagueName: "リーグ",
          seasonId: "season-1",
          seasonName: "シーズン",
          sessionId: "session-1",
          sessionLabel: "第一部",
          playedAt: "2026-01-31T00:00:00.000Z",
        },
        gameType: "sanma",
        wind: "south",
        rank: 1,
        rawScore: 40000,
        finalPoint: 5,
        opponents: [],
      },
    ],
    nextCursor: "history-cursor",
  } as unknown as StatisticsMatchHistoryResponse;

  const view = toStatisticsMatchHistoryView(response, "user-1");

  strictEqual(view.status, "ready");
  strictEqual(view.targetUserId, "user-1");
  strictEqual(view.items[0]?.match.matchId, "match-2");
  strictEqual(view.items[0]?.match.sessionLabel, null);
  strictEqual(view.nextCursor, "history-cursor");
});
