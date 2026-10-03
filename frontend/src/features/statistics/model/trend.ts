import type {
  PersonalStatisticsAnalysisResponse,
  PersonalStatisticsSummaryResponse,
} from "../api";

type ReadyAnalysis = Extract<
  PersonalStatisticsAnalysisResponse,
  { progression: unknown }
>;
type ReadySummary = Extract<
  PersonalStatisticsSummaryResponse,
  { recentResults: unknown }
>;
type TrendWindowSize = 10 | 20 | 50;

export type StatisticsTrendProgressionPoint =
  ReadyAnalysis["progression"][number] & {
    displayOrder: number;
    playedAtLabel: string;
  };

export type StatisticsTrendModel = {
  displayMode: "chart" | "summary";
  progression: StatisticsTrendProgressionPoint[];
  breakdown: ReadyAnalysis["breakdown"] | null;
  selectedRecentResult: ReadySummary["recentResults"][number] | null;
  contextLabel: string;
  windowSize: TrendWindowSize;
};

const tokyoDateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const tokyoDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const isValidDate = (value: string) => !Number.isNaN(new Date(value).getTime());

export const formatStatisticsTrendDateTime = (value: string) =>
  isValidDate(value) ? tokyoDateTimeFormatter.format(new Date(value)) : "—";

const formatTokyoDate = (value: string | undefined) => {
  if (!value || !isValidDate(value)) return null;
  return tokyoDateFormatter.format(new Date(value));
};

export const getStatisticsTrendContext = (input: {
  scope: PersonalStatisticsAnalysisResponse["scope"];
  scopeLabel?: string;
}) => {
  const { scope } = input;
  const scopeLabel =
    input.scopeLabel ??
    (scope.scopeType === "overall"
      ? "全体"
      : scope.scopeType === "league"
        ? `リーグ（${scope.leagueId}）`
        : `シーズン（${scope.seasonId} / リーグ ${scope.leagueId}）`);
  const from = formatTokyoDate(scope.from);
  const to = formatTokyoDate(scope.to);
  const periodLabel =
    from && to
      ? `${from}以降〜${to}未満`
      : from
        ? `${from}以降`
        : to
          ? `${to}未満`
          : "全期間";
  const gameTypeLabel =
    scope.gameType === "sanma"
      ? "三麻"
      : scope.gameType === "yonma"
        ? "四麻"
        : "全ての形式";

  return `${scopeLabel} / ${periodLabel} / ${gameTypeLabel}`;
};

export const getStatisticsTrendModel = (input: {
  analysis: PersonalStatisticsAnalysisResponse | null;
  summary: PersonalStatisticsSummaryResponse | null;
  windowSize: TrendWindowSize;
  scopeLabel?: string;
}): StatisticsTrendModel => {
  const analysis =
    input.analysis && input.analysis.status !== "uncomputed"
      ? input.analysis
      : null;
  const summary =
    input.summary && input.summary.status !== "uncomputed"
      ? input.summary
      : null;
  const progression =
    analysis?.progression.map((point, index) => ({
      ...point,
      displayOrder: index + 1,
      playedAtLabel: formatStatisticsTrendDateTime(point.playedAt),
    })) ?? [];
  const scope = input.analysis?.scope ?? input.summary?.scope;

  return {
    displayMode: progression.length >= 4 ? "chart" : "summary",
    progression,
    breakdown: analysis?.breakdown ?? null,
    selectedRecentResult:
      summary?.recentResults.find(
        (result) => result.windowSize === input.windowSize
      ) ?? null,
    contextLabel: scope
      ? getStatisticsTrendContext({ scope, scopeLabel: input.scopeLabel })
      : "全体 / 全期間 / 全ての形式",
    windowSize: input.windowSize,
  };
};

export const formatStatisticsTrendRate = (rate: number | null) =>
  rate === null
    ? "未算出"
    : new Intl.NumberFormat("ja-JP", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(rate);

export const formatStatisticsTrendNumber = (value: number | null) =>
  value === null
    ? "未算出"
    : new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 }).format(
        value
      );

export const formatStatisticsTrendPoints = (value: number | null) => {
  if (value === null) return "未算出";
  const formatted = formatStatisticsTrendNumber(value);
  return value > 0 ? `+${formatted}` : formatted;
};
