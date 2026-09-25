import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import {
  toPointProgressionChart,
  toStandingRows,
  toUserStats,
} from "./adapter";

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
