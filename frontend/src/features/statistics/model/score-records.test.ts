import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import {
  formatStatisticsPopulationStandardDeviation,
  formatStatisticsFinalPointValue,
  formatStatisticsRateCount,
  formatStatisticsScoreValue,
  formatStatisticsStreakCount,
  getStatisticsStreak,
  getVisibleStatisticsScoreFormats,
  getVisibleStatisticsScoreRanks,
} from "./score-records";

test("score values keep zero distinct from an unavailable value", () => {
  strictEqual(formatStatisticsScoreValue(0), "0");
  strictEqual(formatStatisticsScoreValue(12.34), "12.3");
  strictEqual(formatStatisticsScoreValue(null), "未算出");
  strictEqual(formatStatisticsFinalPointValue(0), "0");
  strictEqual(formatStatisticsFinalPointValue(12.34), "+12.3");
  strictEqual(formatStatisticsFinalPointValue(-12.34), "-12.3");
});

test("population standard deviation is not applicable below two matches", () => {
  strictEqual(
    formatStatisticsPopulationStandardDeviation({
      matchCount: 1,
      populationStandardDeviation: null,
    }),
    "対象外（2対局以上）"
  );
  strictEqual(
    formatStatisticsPopulationStandardDeviation({
      matchCount: 2,
      populationStandardDeviation: null,
    }),
    "未算出"
  );
  strictEqual(
    formatStatisticsPopulationStandardDeviation({
      matchCount: 2,
      populationStandardDeviation: 0,
    }),
    "0"
  );
});

test("sign distribution keeps API count, rate and denominator distinct", () => {
  deepStrictEqual(
    formatStatisticsRateCount({ count: 0, denominator: 5, rate: 0 }),
    { count: "0回", rate: "0.0%", denominator: "分母: 5対局" }
  );
  deepStrictEqual(
    formatStatisticsRateCount({ count: 0, denominator: 0, rate: null }),
    { count: "0回", rate: "未算出", denominator: "分母: 0対局" }
  );
});

test("score-by-rank rows only include applicable ranks for a format", () => {
  const rows = [
    {
      gameType: "sanma" as const,
      rank: 1,
      matchCount: 3,
      averageRawScore: 30_000,
      averageFinalPoint: 40,
    },
    {
      gameType: "sanma" as const,
      rank: 4,
      matchCount: 1,
      averageRawScore: 0,
      averageFinalPoint: 0,
    },
    {
      gameType: "yonma" as const,
      rank: 4,
      matchCount: 2,
      averageRawScore: 10_000,
      averageFinalPoint: -20,
    },
  ];

  deepStrictEqual(
    getVisibleStatisticsScoreRanks("sanma", rows).map(({ rank }) => rank),
    [1]
  );
  deepStrictEqual(
    getVisibleStatisticsScoreRanks("yonma", rows).map(({ rank }) => rank),
    [4]
  );
});

test("score panels only include formats with matching score results", () => {
  const formats = [
    {
      gameType: "sanma" as const,
      rawScore: { matchCount: 2 },
      finalPoint: { matchCount: 2 },
    },
    {
      gameType: "yonma" as const,
      rawScore: { matchCount: 0 },
      finalPoint: { matchCount: 0 },
    },
  ];

  deepStrictEqual(
    getVisibleStatisticsScoreFormats(formats).map(({ gameType }) => gameType),
    ["sanma"]
  );
});

test("a missing streak remains unavailable instead of becoming zero", () => {
  strictEqual(getStatisticsStreak([], "last"), null);
  strictEqual(formatStatisticsStreakCount(0), "0対局");
  strictEqual(formatStatisticsStreakCount(null), "未算出");
  deepStrictEqual(
    getStatisticsStreak(
      [{ type: "last", currentCount: 2, longestCount: 4 }],
      "last"
    ),
    { type: "last", currentCount: 2, longestCount: 4 }
  );
});
