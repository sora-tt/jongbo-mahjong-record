import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import {
  formatStatisticsTrendRate,
  getStatisticsTrendContext,
  getStatisticsTrendModel,
} from "./trend";

import type {
  PersonalStatisticsAnalysisResponse,
  PersonalStatisticsSummaryResponse,
} from "../api";

const analysis = {
  status: "ready",
  scope: {
    scopeType: "overall",
    from: "2026-01-01T00:00:00+09:00",
    to: "2026-02-01T00:00:00+09:00",
    gameType: "all",
  },
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
    {
      playedAt: "2026-01-02T01:00:00.000Z",
      matchId: "match-3",
      matchIndex: 1,
      gameType: "sanma",
      point: 2,
      cumulativePoint: 9,
    },
    {
      playedAt: "2026-01-03T01:00:00.000Z",
      matchId: "match-4",
      matchIndex: 1,
      gameType: "sanma",
      point: -2,
      cumulativePoint: 7,
    },
  ],
  breakdown: {
    dimension: "period",
    rows: [
      {
        key: "2026-01-01",
        label: "2026年1月1日",
        gameType: "sanma",
        matchCount: 2,
        denominator: 2,
        totalPoints: 2,
        averageRank: 1.5,
        topRate: 0.5,
        averageFinalPoint: 1,
        rankCounts: [
          { rank: 1, count: 1 },
          { rank: 2, count: 1 },
          { rank: 3, count: 0 },
        ],
      },
    ],
    nextCursor: null,
  },
} as unknown as Extract<
  PersonalStatisticsAnalysisResponse,
  { progression: unknown }
>;

const summary = {
  status: "ready",
  scope: analysis.scope,
  generatedAt: "2026-02-01T00:00:00.000Z",
  timeZone: "Asia/Tokyo",
  totals: {
    totalMatchCount: 12,
    sessionCount: 4,
    totalPoints: 15,
    averageFinalPoint: 1.25,
    chomboCount: 0,
  },
  byGameType: [],
  rawScore: {},
  finalPoint: {},
  scoreByRank: [],
  records: {},
  streaks: [],
  recentResults: [
    { windowSize: 10, matchCount: 10, totalPoints: 15, byGameType: [] },
    { windowSize: 20, matchCount: 12, totalPoints: 15, byGameType: [] },
    { windowSize: 50, matchCount: 12, totalPoints: 15, byGameType: [] },
  ],
  currentStanding: null,
} as unknown as Extract<
  PersonalStatisticsSummaryResponse,
  { recentResults: unknown }
>;

test("trend model preserves backend progression order and cumulative values", () => {
  const model = getStatisticsTrendModel({
    analysis,
    summary,
    windowSize: 10,
    scopeLabel: "全体",
  });

  strictEqual(model.displayMode, "chart");
  deepStrictEqual(
    model.progression.map(({ matchId, displayOrder, cumulativePoint }) => ({
      matchId,
      displayOrder,
      cumulativePoint,
    })),
    [
      { matchId: "match-2", displayOrder: 1, cumulativePoint: 7 },
      { matchId: "match-1", displayOrder: 2, cumulativePoint: 4 },
      { matchId: "match-3", displayOrder: 3, cumulativePoint: 9 },
      { matchId: "match-4", displayOrder: 4, cumulativePoint: 7 },
    ]
  );
  strictEqual(model.progression[0]?.playedAtLabel, "2026/01/01 09:00");
  strictEqual(model.breakdown?.dimension, "period");
  strictEqual(model.breakdown?.rows[0]?.rankCounts[1]?.count, 1);
});

test("trend model switches to a score summary when fewer than four points exist", () => {
  const shortAnalysis = {
    ...analysis,
    progression: analysis.progression.slice(0, 3),
  } as unknown as Extract<
    PersonalStatisticsAnalysisResponse,
    { progression: unknown }
  >;
  const model = getStatisticsTrendModel({
    analysis: shortAnalysis,
    summary,
    windowSize: 10,
  });

  strictEqual(model.displayMode, "summary");
  strictEqual(model.selectedRecentResult, summary.recentResults[0]);
});

test("trend context identifies scope, selected date interval and game type", () => {
  strictEqual(
    getStatisticsTrendContext({
      scope: analysis.scope,
      scopeLabel: "全体",
    }),
    "全体 / 2026/01/01以降〜2026/02/01未満 / 全ての形式"
  );
});

test("trend rate formatting retains unavailable values and shows percentages", () => {
  strictEqual(formatStatisticsTrendRate(null), "未算出");
  strictEqual(formatStatisticsTrendRate(0.125), "12.5%");
});
