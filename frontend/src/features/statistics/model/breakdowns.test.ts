import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import {
  formatStatisticsBreakdownFormatCount,
  formatStatisticsBreakdownMatchCount,
  getStatisticsBreakdownModel,
  statisticsBreakdownDimensions,
} from "./breakdowns";

import type { StatisticsBreakdown } from "./breakdowns";
import type { PersonalStatisticsAnalysisResponse } from "../api";

type OpponentUserId = Extract<
  StatisticsBreakdown,
  { dimension: "opponent" }
>["rows"][number]["userId"];

const periodRows = [
  {
    key: "2026-10-01",
    label: "2026/10/01",
    gameType: "yonma" as const,
    matchCount: 2,
    denominator: 2,
    totalPoints: 0,
    averageRank: null,
    topRate: 0,
    averageFinalPoint: null,
    rankCounts: [
      { rank: 1, count: 0 },
      { rank: 2, count: 2 },
    ],
  },
];

const makeAnalysis = (
  breakdown: Exclude<
    PersonalStatisticsAnalysisResponse,
    { status: "uncomputed" }
  >["breakdown"],
  status: "ready" | "empty" = "ready"
): Exclude<PersonalStatisticsAnalysisResponse, { status: "uncomputed" }> =>
  ({
    status,
    scope: {
      scopeType: "season",
      leagueId: "league-1",
      seasonId: "season-1",
      from: "2026-10-01T00:00:00.000Z",
      to: "2026-11-01T00:00:00.000Z",
      gameType: "all",
    },
    generatedAt: "2026-10-04T00:00:00.000Z",
    timeZone: "Asia/Tokyo",
    windowSize: 20,
    progression: [],
    breakdown,
  }) as unknown as Exclude<
    PersonalStatisticsAnalysisResponse,
    { status: "uncomputed" }
  >;

test("breakdown dimension options expose each supported analysis slice", () => {
  deepStrictEqual(
    statisticsBreakdownDimensions.map(({ value, label }) => ({ value, label })),
    [
      { value: "period", label: "期間" },
      { value: "weekday", label: "曜日" },
      { value: "timeOfDay", label: "時間帯" },
      { value: "seat", label: "席" },
      { value: "opponent", label: "対戦相手" },
      { value: "session", label: "セッション" },
    ]
  );
});

test("match count and its denominator are labeled in matches", () => {
  strictEqual(formatStatisticsBreakdownMatchCount(0), "0対局");
  strictEqual(formatStatisticsBreakdownMatchCount(12), "12対局");
  strictEqual(
    formatStatisticsBreakdownFormatCount("yonma", 3),
    "四麻（3対局）"
  );
});

test("ready model keeps API rows, zero values, null values, and denominator intact", () => {
  const analysis = makeAnalysis({
    dimension: "period",
    rows: periodRows,
    nextCursor: null,
  });
  const model = getStatisticsBreakdownModel({
    analysis,
    dimension: "period",
    groupBy: "day",
    subjectLabel: "Hanako",
  });

  strictEqual(model.status, "ready");
  strictEqual(model.breakdown, analysis.breakdown);
  if (model.breakdown?.dimension !== "period") {
    throw new Error("period breakdown was not returned");
  }
  strictEqual(model.breakdown.rows, periodRows);
  deepStrictEqual(
    [
      model.breakdown.rows[0].matchCount,
      model.breakdown.rows[0].denominator,
      model.breakdown.rows[0].totalPoints,
      model.breakdown.rows[0].averageRank,
      model.breakdown.rows[0].topRate,
    ],
    [2, 2, 0, null, 0]
  );
  strictEqual(model.contextLabel.includes("Hanako"), true);
  strictEqual(model.contextLabel.includes("リーグ"), true);
  strictEqual(model.contextLabel.includes("三麻"), false);
});

test("model exposes a cursor only for a matching opponent or session slice", () => {
  const nextCursor = "opaque%2Fcursor";
  const opponentAnalysis = makeAnalysis({
    dimension: "opponent",
    rows: [
      {
        userId: "opponent-1" as unknown as OpponentUserId,
        userName: "Taro",
        gameType: "sanma",
        encounterCount: 3,
        aboveRate: null,
        tieCount: 1,
        totalPointDifference: 0,
        averagePointDifference: 0,
      },
    ],
    nextCursor,
  });
  const opponentModel = getStatisticsBreakdownModel({
    analysis: opponentAnalysis,
    dimension: "opponent",
    groupBy: "day",
  });

  strictEqual(opponentModel.nextCursor, nextCursor);
  if (opponentModel.breakdown?.dimension !== "opponent") {
    throw new Error("opponent breakdown was not returned");
  }
  strictEqual(opponentModel.breakdown.rows[0].aboveRate, null);
  strictEqual(opponentModel.breakdown.rows[0].totalPointDifference, 0);

  const staleModel = getStatisticsBreakdownModel({
    analysis: opponentAnalysis,
    dimension: "session",
    groupBy: "day",
  });
  strictEqual(staleModel.status, "loading");
  strictEqual(staleModel.breakdown, null);
  strictEqual(staleModel.nextCursor, null);
});

test("model distinguishes loading, uncomputed, empty scope, and empty breakdown", () => {
  strictEqual(
    getStatisticsBreakdownModel({
      analysis: null,
      dimension: "period",
      groupBy: "day",
    }).status,
    "loading"
  );
  strictEqual(
    getStatisticsBreakdownModel({
      analysis: {
        status: "uncomputed",
        scope: { scopeType: "overall" },
        generatedAt: null,
        timeZone: "Asia/Tokyo",
        windowSize: 10,
      },
      dimension: "period",
      groupBy: "day",
    }).status,
    "uncomputed"
  );
  strictEqual(
    getStatisticsBreakdownModel({
      analysis: makeAnalysis(
        {
          dimension: "weekday",
          rows: [],
          nextCursor: null,
        },
        "empty"
      ),
      dimension: "weekday",
      groupBy: "day",
    }).status,
    "empty"
  );
  strictEqual(
    getStatisticsBreakdownModel({
      analysis: makeAnalysis({
        dimension: "weekday",
        rows: [],
        nextCursor: null,
      }),
      dimension: "weekday",
      groupBy: "day",
    }).status,
    "ready"
  );
});
