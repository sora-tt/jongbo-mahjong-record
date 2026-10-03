import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import {
  formatStatisticsOverviewNumber,
  formatStatisticsOverviewPoints,
  formatStatisticsOverviewRate,
  getStatisticsOverviewModel,
  getStatisticsStandingSourceLabel,
  getStatisticsOverviewRateBarWidth,
  getVisibleStatisticsRanks,
} from "./overview";

const makeOverviewFormat = (
  gameType: "sanma" | "yonma",
  overrides: Partial<{
    matchCount: number;
    averageRank: number | null;
    topRate: number | null;
  }> = {}
) => ({
  gameType,
  matchCount: 8,
  totalPoints: 4.5,
  averageFinalPoint: 0.56,
  averageRank: 2,
  ranks: [{ rank: 1, count: 2, rate: 0.25 }],
  topRate: 0.25,
  topTwoRate: 0.5,
  topThreeRate: gameType === "yonma" ? 0.75 : null,
  lastRate: 0.25,
  lastAvoidanceRate: 0.75,
  ...overrides,
});

test("overview metric groups prioritize totals, then each format, then secondary totals", () => {
  const model = getStatisticsOverviewModel({
    totals: {
      totalMatchCount: 12,
      sessionCount: 4,
      totalPoints: 25.5,
      averageFinalPoint: 2.125,
    },
    byGameType: [
      makeOverviewFormat("sanma", { averageRank: 1.5, topRate: 0.5 }),
      makeOverviewFormat("yonma", { averageRank: 2.5, topRate: 0.25 }),
    ],
  });

  deepStrictEqual(
    model.primaryTotals.map(({ id, label, value, unit }) => ({
      id,
      label,
      value,
      unit,
    })),
    [
      {
        id: "match-count",
        label: "対局数",
        value: 12,
        unit: "対局",
      },
      {
        id: "total-points",
        label: "総合ポイント",
        value: "+25.50",
        unit: "pt",
      },
    ]
  );
  deepStrictEqual(
    model.formatPriorities.map(
      ({ gameType, matchCount, averageRank, topRate }) => ({
        gameType,
        matchCount,
        averageRank,
        topRate,
      })
    ),
    [
      {
        gameType: "sanma",
        matchCount: 8,
        averageRank: "1.50",
        topRate: "50.0%",
      },
      {
        gameType: "yonma",
        matchCount: 8,
        averageRank: "2.50",
        topRate: "25.0%",
      },
    ]
  );
  deepStrictEqual(
    model.secondaryTotals.map(({ id, label, value, unit, description }) => ({
      id,
      label,
      value,
      unit,
      description,
    })),
    [
      {
        id: "session-count",
        label: "参加セッション数",
        value: 4,
        unit: "セッション",
        description: undefined,
      },
      {
        id: "average-final-point",
        label: "平均最終ポイント",
        value: "2.13",
        unit: "pt",
        description: "分母: 12対局",
      },
    ]
  );
  deepStrictEqual(
    model.formatDetails.map(({ gameType }) => gameType),
    ["sanma", "yonma"]
  );
});

test("secondary average final points show null as unavailable and keep denominator", () => {
  const model = getStatisticsOverviewModel({
    totals: {
      totalMatchCount: 0,
      sessionCount: 0,
      totalPoints: 0,
      averageFinalPoint: null,
    },
    byGameType: [],
  });
  const averageFinalPoint = model.secondaryTotals.find(
    ({ id }) => id === "average-final-point"
  );

  strictEqual(averageFinalPoint?.value, "—");
  strictEqual(averageFinalPoint?.unit, "pt");
  strictEqual(averageFinalPoint?.description, "分母: 0対局");
});

test("overview number formatting distinguishes null from zero", () => {
  strictEqual(formatStatisticsOverviewNumber(null), "—");
  strictEqual(formatStatisticsOverviewNumber(0), "0.00");
  strictEqual(formatStatisticsOverviewNumber(12.345), "12.35");
});

test("point totals preserve negative, zero, positive, and null values", () => {
  strictEqual(formatStatisticsOverviewPoints(null), "—");
  strictEqual(formatStatisticsOverviewPoints(-12.345), "-12.35");
  strictEqual(formatStatisticsOverviewPoints(0), "0.00");
  strictEqual(formatStatisticsOverviewPoints(12.345), "+12.35");
});

test("overview rates render backend proportions as percentages and preserve null", () => {
  strictEqual(formatStatisticsOverviewRate(null), "—");
  strictEqual(formatStatisticsOverviewRate(0), "0.0%");
  strictEqual(formatStatisticsOverviewRate(0.275), "27.5%");
});

test("rank bar width reflects the supplied rate and omits unavailable values", () => {
  strictEqual(getStatisticsOverviewRateBarWidth(null), null);
  strictEqual(getStatisticsOverviewRateBarWidth(0), "0.00%");
  strictEqual(getStatisticsOverviewRateBarWidth(0.275), "27.50%");
});

test("rank display uses supplied rows and never renders fourth place for sanma", () => {
  const ranks = [
    { rank: 1, count: 2, rate: 0.5 },
    { rank: 3, count: 2, rate: 0.5 },
    { rank: 4, count: 0, rate: 0 },
  ];

  deepStrictEqual(getVisibleStatisticsRanks("sanma", ranks), ranks.slice(0, 2));
  deepStrictEqual(getVisibleStatisticsRanks("yonma", ranks), ranks);
  deepStrictEqual(getVisibleStatisticsRanks("sanma", [ranks[0]!]), [ranks[0]]);
});

test("standing source labels explain the scope used for the rank", () => {
  strictEqual(getStatisticsStandingSourceLabel("season"), "対象シーズン");
  strictEqual(
    getStatisticsStandingSourceLabel("activeSeason"),
    "現在のシーズン"
  );
});
