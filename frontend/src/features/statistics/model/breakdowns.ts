import { getStatisticsTrendContext } from "@/features/statistics/model/trend";

import type { PersonalStatisticsAnalysisResponse } from "../api";

type ReadyAnalysis = Exclude<
  PersonalStatisticsAnalysisResponse,
  { status: "uncomputed" }
>;

export type StatisticsBreakdown = ReadyAnalysis["breakdown"];
export type StatisticsBreakdownDimension = StatisticsBreakdown["dimension"];
export type StatisticsBreakdownGroupBy = "day" | "month" | "year";

export const statisticsBreakdownDimensions = [
  { value: "period", label: "期間" },
  { value: "weekday", label: "曜日" },
  { value: "timeOfDay", label: "時間帯" },
  { value: "seat", label: "席" },
  { value: "opponent", label: "対戦相手" },
  { value: "session", label: "セッション" },
] as const satisfies ReadonlyArray<{
  value: StatisticsBreakdownDimension;
  label: string;
}>;

export const statisticsBreakdownGroupings = [
  { value: "day", label: "日別" },
  { value: "month", label: "月別" },
  { value: "year", label: "年別" },
] as const satisfies ReadonlyArray<{
  value: StatisticsBreakdownGroupBy;
  label: string;
}>;

export const formatStatisticsBreakdownMatchCount = (matchCount: number) =>
  `${matchCount}対局`;

export const formatStatisticsBreakdownFormatCount = (
  gameType: "sanma" | "yonma",
  matchCount: number
) =>
  `${gameType === "sanma" ? "三麻" : "四麻"}（${formatStatisticsBreakdownMatchCount(matchCount)}）`;

export type StatisticsBreakdownModel = {
  status: "loading" | "uncomputed" | "empty" | "ready";
  breakdown: StatisticsBreakdown | null;
  nextCursor: string | null;
  title: string;
  contextLabel: string;
};

const dimensionLabels: Record<StatisticsBreakdownDimension, string> = {
  period: "期間別成績",
  weekday: "曜日別成績",
  timeOfDay: "時間帯別成績",
  seat: "席別成績",
  opponent: "対戦相手別成績",
  session: "セッション別成績",
};

const groupByLabels: Record<StatisticsBreakdownGroupBy, string> = {
  day: "日別",
  month: "月別",
  year: "年別",
};

const getTitle = (
  dimension: StatisticsBreakdownDimension,
  groupBy: StatisticsBreakdownGroupBy
) =>
  dimension === "period"
    ? `${groupByLabels[groupBy]}の成績`
    : dimensionLabels[dimension];

const getContextLabel = (
  analysis: PersonalStatisticsAnalysisResponse | null,
  subjectLabel: string | undefined,
  scopeLabel: string | undefined
) => {
  if (!analysis) return "選択中の条件で読み込み中";

  const context = getStatisticsTrendContext({
    scope: analysis.scope,
    scopeLabel,
  });
  return `${subjectLabel ?? "表示対象者"} / ${context}`;
};

export const getStatisticsBreakdownModel = (input: {
  analysis: PersonalStatisticsAnalysisResponse | null;
  dimension: StatisticsBreakdownDimension;
  groupBy: StatisticsBreakdownGroupBy;
  subjectLabel?: string;
  scopeLabel?: string;
}): StatisticsBreakdownModel => {
  const { analysis, dimension, groupBy } = input;
  const title = getTitle(dimension, groupBy);
  const contextLabel = getContextLabel(
    analysis,
    input.subjectLabel,
    input.scopeLabel
  );

  if (!analysis) {
    return {
      status: "loading",
      breakdown: null,
      nextCursor: null,
      title,
      contextLabel,
    };
  }

  if (analysis.status === "uncomputed") {
    return {
      status: "uncomputed",
      breakdown: null,
      nextCursor: null,
      title,
      contextLabel,
    };
  }

  if (analysis.status === "empty") {
    return {
      status: "empty",
      breakdown: null,
      nextCursor: null,
      title,
      contextLabel,
    };
  }

  if (analysis.breakdown.dimension !== dimension) {
    return {
      status: "loading",
      breakdown: null,
      nextCursor: null,
      title,
      contextLabel,
    };
  }

  return {
    status: "ready",
    breakdown: analysis.breakdown,
    nextCursor: analysis.breakdown.nextCursor,
    title,
    contextLabel,
  };
};
