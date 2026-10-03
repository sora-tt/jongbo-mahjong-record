import type { StatisticsScopeFilters } from "./query-cache";

export type StatisticsScopeOption = {
  leagueId: string;
  leagueName: string;
  seasonId: string;
  seasonName: string;
};

export type StatisticsLeagueOption = {
  id: string;
  name: string;
};

export type StatisticsSeasonOption = StatisticsScopeOption & {
  value: string;
};

export type StatisticsDateRangeInputValues = {
  from: string;
  to: string;
};

const withCommonFilters = (
  current: StatisticsScopeFilters,
  scopeType: StatisticsScopeFilters["scopeType"]
): StatisticsScopeFilters => ({
  scopeType,
  ...(current.from === undefined ? {} : { from: current.from }),
  ...(current.to === undefined ? {} : { to: current.to }),
  gameType: current.gameType,
});

export const getStatisticsLeagueOptions = (
  scopeOptions: readonly StatisticsScopeOption[]
): StatisticsLeagueOption[] => {
  const options = new Map<string, string>();

  scopeOptions.forEach((option) => {
    if (!options.has(option.leagueId)) {
      options.set(option.leagueId, option.leagueName);
    }
  });

  return Array.from(options, ([id, name]) => ({ id, name }));
};

export const getStatisticsSeasonOptionValue = (
  option: Pick<StatisticsScopeOption, "leagueId" | "seasonId">
) => JSON.stringify([option.leagueId, option.seasonId]);

export const getStatisticsSeasonOptions = (
  scopeOptions: readonly StatisticsScopeOption[]
): StatisticsSeasonOption[] =>
  scopeOptions.map((option) => ({
    ...option,
    value: getStatisticsSeasonOptionValue(option),
  }));

export const selectStatisticsFilterScopeType = (
  current: StatisticsScopeFilters,
  scopeType: StatisticsScopeFilters["scopeType"],
  scopeOptions: readonly StatisticsScopeOption[]
): StatisticsScopeFilters | null => {
  if (scopeType === current.scopeType) return current;
  if (scopeType === "overall") return withCommonFilters(current, "overall");

  if (scopeType === "league") {
    const leagues = getStatisticsLeagueOptions(scopeOptions);
    const selectedLeague =
      leagues.find((option) => option.id === current.leagueId) ?? leagues[0];

    return selectedLeague
      ? {
          ...withCommonFilters(current, "league"),
          leagueId: selectedLeague.id,
        }
      : null;
  }

  const seasons = getStatisticsSeasonOptions(scopeOptions);
  const selectedSeason =
    seasons.find(
      (option) =>
        option.leagueId === current.leagueId &&
        option.seasonId === current.seasonId
    ) ??
    seasons.find((option) => option.leagueId === current.leagueId) ??
    seasons[0];

  return selectedSeason
    ? {
        ...withCommonFilters(current, "season"),
        leagueId: selectedSeason.leagueId,
        seasonId: selectedSeason.seasonId,
      }
    : null;
};

export const selectStatisticsFilterLeague = (
  current: StatisticsScopeFilters,
  leagueId: string,
  scopeOptions: readonly StatisticsScopeOption[]
): StatisticsScopeFilters | null => {
  const league = getStatisticsLeagueOptions(scopeOptions).find(
    (option) => option.id === leagueId
  );

  return league
    ? { ...withCommonFilters(current, "league"), leagueId: league.id }
    : null;
};

export const selectStatisticsFilterSeason = (
  current: StatisticsScopeFilters,
  seasonOptionValue: string,
  scopeOptions: readonly StatisticsScopeOption[]
): StatisticsScopeFilters | null => {
  const season = getStatisticsSeasonOptions(scopeOptions).find(
    (option) => option.value === seasonOptionValue
  );

  return season
    ? {
        ...withCommonFilters(current, "season"),
        leagueId: season.leagueId,
        seasonId: season.seasonId,
      }
    : null;
};

const isCalendarDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};

const shiftCalendarDate = (value: string, days: number) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const formatTokyoDate = (value: string | undefined) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : "";
};

export const getStatisticsDateRangeFromInput = (
  fromDate: string,
  throughDate: string
): Pick<StatisticsScopeFilters, "from" | "to"> | null => {
  if (
    (fromDate && !isCalendarDate(fromDate)) ||
    (throughDate && !isCalendarDate(throughDate)) ||
    (fromDate && throughDate && fromDate > throughDate)
  ) {
    return null;
  }

  return {
    ...(fromDate ? { from: `${fromDate}T00:00:00+09:00` } : {}),
    ...(throughDate
      ? { to: `${shiftCalendarDate(throughDate, 1)}T00:00:00+09:00` }
      : {}),
  };
};

export const getStatisticsDateRangeInputValues = (range: {
  from?: string;
  to?: string;
}): StatisticsDateRangeInputValues => {
  const from = formatTokyoDate(range.from);
  const exclusiveTo = formatTokyoDate(range.to);

  return {
    from,
    to: exclusiveTo ? shiftCalendarDate(exclusiveTo, -1) : "",
  };
};
