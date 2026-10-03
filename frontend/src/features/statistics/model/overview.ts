export type StatisticsRank = {
  rank: number;
  count: number;
  rate: number | null;
};

type StatisticsOverviewTotals = {
  totalMatchCount: number;
  sessionCount: number;
  totalPoints: number;
  averageFinalPoint: number | null;
};

type StatisticsOverviewFormat = {
  gameType: "sanma" | "yonma";
  matchCount: number;
  averageRank: number | null;
  topRate: number | null;
  topTwoRate: number | null;
  topThreeRate: number | null;
  lastRate: number | null;
  lastAvoidanceRate: number | null;
  ranks: readonly StatisticsRank[];
};

export type StatisticsOverviewHeadlineMetric = {
  id: string;
  label: string;
  value: number | string;
  unit: string;
  description?: string;
};

export const formatStatisticsOverviewNumber = (
  value: number | null,
  digits = 2
) => (value === null ? "—" : value.toFixed(digits));

export const formatStatisticsOverviewRate = (
  rate: number | null,
  digits = 1
) => (rate === null ? "—" : `${(rate * 100).toFixed(digits)}%`);

export const getStatisticsOverviewRateBarWidth = (rate: number | null) =>
  rate === null ? null : `${(rate * 100).toFixed(2)}%`;

export const formatStatisticsOverviewPoints = (value: number | null) => {
  if (value === null) return "—";

  const sign = value > 0 ? "+" : "";
  return `${sign}${formatStatisticsOverviewNumber(value)}`;
};

export const getStatisticsOverviewModel = <
  TFormat extends StatisticsOverviewFormat,
>(summary: {
  totals: StatisticsOverviewTotals;
  byGameType: readonly TFormat[];
}) => {
  const formatDetails = summary.byGameType.filter(
    (format) => format.matchCount > 0
  );

  return {
    primaryTotals: [
      {
        id: "match-count",
        label: "対局数",
        value: summary.totals.totalMatchCount,
        unit: "対局",
      },
      {
        id: "total-points",
        label: "総合ポイント",
        value: formatStatisticsOverviewPoints(summary.totals.totalPoints),
        unit: "pt",
        description: `対象${summary.totals.totalMatchCount}対局の合計`,
      },
    ] satisfies StatisticsOverviewHeadlineMetric[],
    formatPriorities: formatDetails.map((format) => ({
      gameType: format.gameType,
      matchCount: format.matchCount,
      averageRank: formatStatisticsOverviewNumber(format.averageRank),
      topRate: formatStatisticsOverviewRate(format.topRate),
    })),
    secondaryTotals: [
      {
        id: "session-count",
        label: "参加セッション数",
        value: summary.totals.sessionCount,
        unit: "セッション",
      },
      {
        id: "average-final-point",
        label: "平均最終ポイント",
        value: formatStatisticsOverviewNumber(summary.totals.averageFinalPoint),
        unit: "pt",
        description: `分母: ${summary.totals.totalMatchCount}対局`,
      },
    ] satisfies StatisticsOverviewHeadlineMetric[],
    formatDetails,
  };
};

export const getVisibleStatisticsRanks = (
  gameType: "sanma" | "yonma",
  ranks: readonly StatisticsRank[]
) => {
  const maximumRank = gameType === "sanma" ? 3 : 4;
  return ranks.filter(
    ({ rank }) => Number.isInteger(rank) && rank >= 1 && rank <= maximumRank
  );
};

export const getStatisticsStandingSourceLabel = (
  source: "season" | "activeSeason"
) => (source === "season" ? "対象シーズン" : "現在のシーズン");
