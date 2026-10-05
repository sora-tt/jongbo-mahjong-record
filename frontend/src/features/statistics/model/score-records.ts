export type StatisticsScoreGameType = "sanma" | "yonma";

export type StatisticsScoreFormatSummary = {
  gameType: StatisticsScoreGameType;
  rawScore: { matchCount: number };
  finalPoint: { matchCount: number };
};

export type StatisticsScoreRankRow = {
  gameType: StatisticsScoreGameType;
  rank: number;
  matchCount: number;
  averageRawScore: number | null;
  averageFinalPoint: number | null;
};

export type StatisticsScoreStreak = {
  type: "top" | "last" | "topTwo" | "positive" | "negative";
  currentCount: number;
  longestCount: number;
};

export type StatisticsRateCount = {
  count: number;
  denominator: number;
  rate: number | null;
};

export const formatStatisticsScoreValue = (value: number | null) =>
  value === null
    ? "未算出"
    : new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 }).format(
        value
      );

export const formatStatisticsFinalPointValue = (value: number | null) => {
  if (value === null) return "未算出";

  const formattedValue = formatStatisticsScoreValue(value);
  return value > 0 ? `+${formattedValue}` : formattedValue;
};

export const formatStatisticsPopulationStandardDeviation = (input: {
  matchCount: number;
  populationStandardDeviation: number | null;
}) =>
  input.matchCount < 2
    ? "対象外（2対局以上）"
    : formatStatisticsScoreValue(input.populationStandardDeviation);

export const formatStatisticsRateCount = (input: StatisticsRateCount) => ({
  count: `${input.count}回`,
  rate: input.rate === null ? "未算出" : `${(input.rate * 100).toFixed(1)}%`,
  denominator: `分母: ${input.denominator}対局`,
});

export const formatStatisticsStreakCount = (count: number | null) =>
  count === null ? "未算出" : `${count}対局`;

export const getVisibleStatisticsScoreRanks = <
  T extends StatisticsScoreRankRow,
>(
  gameType: StatisticsScoreGameType,
  rows: readonly T[]
) => {
  const maximumRank = gameType === "sanma" ? 3 : 4;

  return rows.filter(
    ({ gameType: rowGameType, rank }) =>
      rowGameType === gameType &&
      Number.isInteger(rank) &&
      rank >= 1 &&
      rank <= maximumRank
  );
};

export const getVisibleStatisticsScoreFormats = <
  T extends StatisticsScoreFormatSummary,
>(
  formats: readonly T[]
) => formats.filter(({ rawScore }) => rawScore.matchCount > 0);

export const getStatisticsStreak = <T extends StatisticsScoreStreak>(
  streaks: readonly T[],
  type: StatisticsScoreStreak["type"]
) => streaks.find((streak) => streak.type === type) ?? null;

export const formatStatisticsRecordDate = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
