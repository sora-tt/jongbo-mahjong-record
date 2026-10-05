import type {
  PersonalStatisticsSummary,
  StatisticsAnalysis,
  StatisticsBreakdown,
  StatisticsRecordMatchReference,
  UserMatchStatistics,
} from "@/domain/statistics/types.js";
import { aggregateRankAndScoreStatistics } from "@/domain/statistics/aggregation.js";

export type TemporalDimension = "period" | "weekday" | "timeOfDay";
export type CalendarGroupBy = "day" | "month" | "year";

export type CalendarStatisticsOptions = {
  groupBy?: CalendarGroupBy;
  from?: string;
  to?: string;
};

export type TemporalBreakdownRow = {
  key: string;
  label: string;
  gameType: UserMatchStatistics["gameType"];
  matchCount: number;
  denominator: number;
  totalPoints: number;
  averageRank: number | null;
  topRate: number | null;
  averageFinalPoint: number | null;
  rankCounts: Array<{ rank: number; count: number }>;
};

export type TemporalStatisticsBreakdown = {
  dimension: TemporalDimension;
  rows: TemporalBreakdownRow[];
  nextCursor: null;
} & Extract<StatisticsBreakdown, { nextCursor: null }>;

const timeZone = "Asia/Tokyo";
const gameTypeOrder: UserMatchStatistics["gameType"][] = ["sanma", "yonma"];
const datePartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
  hour: "2-digit",
  hourCycle: "h23",
});

const weekdayBuckets = [
  { key: "mon", label: "月曜日" },
  { key: "tue", label: "火曜日" },
  { key: "wed", label: "水曜日" },
  { key: "thu", label: "木曜日" },
  { key: "fri", label: "金曜日" },
  { key: "sat", label: "土曜日" },
  { key: "sun", label: "日曜日" },
] as const;

const timeOfDayBuckets = [
  { key: "00-05", label: "00–05時", startHour: 0 },
  { key: "06-11", label: "06–11時", startHour: 6 },
  { key: "12-17", label: "12–17時", startHour: 12 },
  { key: "18-23", label: "18–23時", startHour: 18 },
] as const;

type TokyoCalendarParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  weekday: string;
};

const getTokyoCalendarParts = (value: string): TokyoCalendarParts => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new TypeError("statistics projection playedAt must be a valid date");
  }

  const parts = Object.fromEntries(
    datePartsFormatter
      .formatToParts(date)
      .map(({ type, value: partValue }) => [type, partValue]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    weekday: parts.weekday ?? "",
  };
};

const getTimestamp = (value: string): number => {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new TypeError("statistics projection playedAt must be a valid date");
  }
  return timestamp;
};

const compareText = (left: string, right: string): number =>
  left.localeCompare(right);

const validateMatch = (match: UserMatchStatistics): number => {
  const expectedPlayerCount = match.gameType === "sanma" ? 3 : 4;
  if (match.playerCount !== expectedPlayerCount) {
    throw new TypeError(
      "statistics projection game type/player count mismatch",
    );
  }
  if (
    !Number.isInteger(match.rank) ||
    match.rank < 1 ||
    match.rank > match.playerCount
  ) {
    throw new TypeError("statistics projection rank is out of range");
  }
  if (
    !Number.isInteger(match.matchIndex) ||
    match.matchIndex < 0 ||
    !Number.isFinite(match.rawScore) ||
    !Number.isFinite(match.finalPoint)
  ) {
    throw new TypeError("statistics projection has invalid match values");
  }
  return getTimestamp(match.playedAt);
};

export const orderUserMatchStatistics = (
  matches: readonly UserMatchStatistics[],
): UserMatchStatistics[] =>
  [...matches]
    .map((match) => ({ match, timestamp: validateMatch(match) }))
    .sort(
      (left, right) =>
        left.timestamp - right.timestamp ||
        compareText(left.match.sessionId, right.match.sessionId) ||
        left.match.matchIndex - right.match.matchIndex ||
        compareText(left.match.matchId, right.match.matchId),
    )
    .map(({ match }) => match);

export const aggregatePointProgression = (
  matches: readonly UserMatchStatistics[],
  windowSize: 10 | 20 | 50,
): StatisticsAnalysis["progression"] => {
  const orderedMatches = orderUserMatchStatistics(matches);
  const firstIncludedIndex = Math.max(0, orderedMatches.length - windowSize);
  let cumulativePoint = 0;
  const progression: StatisticsAnalysis["progression"] = [];
  orderedMatches.forEach((match, index) => {
    cumulativePoint += match.finalPoint;
    if (index < firstIncludedIndex) return;
    progression.push({
      playedAt: match.playedAt,
      matchId: match.matchId,
      matchIndex: match.matchIndex,
      gameType: match.gameType,
      point: match.finalPoint,
      cumulativePoint,
    });
  });
  return progression;
};

const calendarKey = (
  parts: TokyoCalendarParts,
  groupBy: CalendarGroupBy,
): string => {
  const year = String(parts.year).padStart(4, "0");
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  if (groupBy === "year") return year;
  if (groupBy === "month") return `${year}-${month}`;
  return `${year}-${month}-${day}`;
};

const parseCalendarKey = (
  key: string,
  groupBy: CalendarGroupBy,
): { year: number; month: number; day: number } => {
  const [yearPart, monthPart, dayPart] = key.split("-");
  return {
    year: Number(yearPart),
    month: groupBy === "year" ? 1 : Number(monthPart),
    day: groupBy === "day" ? Number(dayPart) : 1,
  };
};

const nextCalendarKey = (key: string, groupBy: CalendarGroupBy): string => {
  const { year, month, day } = parseCalendarKey(key, groupBy);
  const nextDate =
    groupBy === "year"
      ? new Date(Date.UTC(year + 1, 0, 1))
      : groupBy === "month"
        ? new Date(Date.UTC(year, month, 1))
        : new Date(Date.UTC(year, month - 1, day + 1));
  return calendarKey(
    {
      year: nextDate.getUTCFullYear(),
      month: nextDate.getUTCMonth() + 1,
      day: nextDate.getUTCDate(),
      hour: 0,
      weekday: "",
    },
    groupBy,
  );
};

const enumerateCalendarKeys = (
  matches: readonly UserMatchStatistics[],
  groupBy: CalendarGroupBy,
  from?: string,
  to?: string,
): string[] => {
  if (from === undefined || to === undefined) {
    return [
      ...new Set(
        matches.map((match) =>
          calendarKey(getTokyoCalendarParts(match.playedAt), groupBy),
        ),
      ),
    ].sort(compareText);
  }

  const fromTimestamp = getTimestamp(from);
  const toTimestamp = getTimestamp(to);
  if (fromTimestamp >= toTimestamp) {
    throw new RangeError("statistics date range must have from before to");
  }
  const firstKey = calendarKey(getTokyoCalendarParts(from), groupBy);
  const lastIncludedInstant = new Date(toTimestamp - 1).toISOString();
  const lastKey = calendarKey(
    getTokyoCalendarParts(lastIncludedInstant),
    groupBy,
  );
  const keys: string[] = [];
  for (
    let key = firstKey;
    compareText(key, lastKey) <= 0;
    key = nextCalendarKey(key, groupBy)
  ) {
    keys.push(key);
  }
  return keys;
};

const filterDateRange = (
  matches: readonly UserMatchStatistics[],
  from?: string,
  to?: string,
): UserMatchStatistics[] => {
  const fromTimestamp = from === undefined ? null : getTimestamp(from);
  const toTimestamp = to === undefined ? null : getTimestamp(to);
  if (
    fromTimestamp !== null &&
    toTimestamp !== null &&
    fromTimestamp >= toTimestamp
  ) {
    throw new RangeError("statistics date range must have from before to");
  }
  return matches.filter((match) => {
    const timestamp = validateMatch(match);
    return (
      (fromTimestamp === null || timestamp >= fromTimestamp) &&
      (toTimestamp === null || timestamp < toTimestamp)
    );
  });
};

const formatLabel = (key: string, groupBy: CalendarGroupBy): string => {
  if (groupBy === "year") return `${key}年`;
  if (groupBy === "month") return key.replace("-", "年") + "月";
  return key.replaceAll("-", "/");
};

const summarizeBreakdownRow = (
  key: string,
  label: string,
  gameType: UserMatchStatistics["gameType"],
  matches: readonly UserMatchStatistics[],
): TemporalBreakdownRow => {
  const formatSummary = aggregateRankAndScoreStatistics(matches).byGameType[0];
  const rankCount = gameType === "sanma" ? 3 : 4;
  const rankCounts =
    formatSummary?.ranks.map(({ rank, count }) => ({ rank, count })) ??
    Array.from({ length: rankCount }, (_, index) => ({
      rank: index + 1,
      count: 0,
    }));
  const matchCount = matches.length;
  return {
    key,
    label,
    gameType,
    matchCount,
    denominator: matchCount,
    totalPoints: matches.reduce((sum, match) => sum + match.finalPoint, 0),
    averageRank: formatSummary?.averageRank ?? null,
    topRate: formatSummary?.topRate ?? null,
    averageFinalPoint: formatSummary?.averageFinalPoint ?? null,
    rankCounts,
  };
};

export const aggregateCalendarStatistics = (
  matches: readonly UserMatchStatistics[],
  dimension: TemporalDimension,
  options: CalendarStatisticsOptions = {},
): TemporalStatisticsBreakdown => {
  const rangedMatches = filterDateRange(matches, options.from, options.to);
  const gameTypes = gameTypeOrder.filter((gameType) =>
    rangedMatches.some((match) => match.gameType === gameType),
  );
  const groups: Array<{
    key: string;
    label: string;
    matches: UserMatchStatistics[];
  }> = [];

  if (dimension === "period") {
    const groupBy = options.groupBy ?? "day";
    const matchesByKey = new Map<string, UserMatchStatistics[]>();
    rangedMatches.forEach((match) => {
      const key = calendarKey(getTokyoCalendarParts(match.playedAt), groupBy);
      const group = matchesByKey.get(key) ?? [];
      group.push(match);
      matchesByKey.set(key, group);
    });
    const keys = enumerateCalendarKeys(
      rangedMatches,
      groupBy,
      options.from,
      options.to,
    );
    keys.forEach((key) => {
      groups.push({
        key,
        label: formatLabel(key, groupBy),
        matches: matchesByKey.get(key) ?? [],
      });
    });
  } else if (dimension === "weekday") {
    const matchesByKey = new Map<string, UserMatchStatistics[]>();
    rangedMatches.forEach((match) => {
      const weekday = getTokyoCalendarParts(
        match.playedAt,
      ).weekday.toLowerCase();
      const key = weekday.slice(0, 3);
      const group = matchesByKey.get(key) ?? [];
      group.push(match);
      matchesByKey.set(key, group);
    });
    weekdayBuckets.forEach(({ key, label }) => {
      groups.push({ key, label, matches: matchesByKey.get(key) ?? [] });
    });
  } else {
    const matchesByKey = new Map<string, UserMatchStatistics[]>();
    rangedMatches.forEach((match) => {
      const hour = getTokyoCalendarParts(match.playedAt).hour;
      const bucket = timeOfDayBuckets[Math.floor(hour / 6)];
      if (bucket === undefined) {
        throw new RangeError("statistics projection hour is out of range");
      }
      const group = matchesByKey.get(bucket.key) ?? [];
      group.push(match);
      matchesByKey.set(bucket.key, group);
    });
    timeOfDayBuckets.forEach(({ key, label }) => {
      groups.push({ key, label, matches: matchesByKey.get(key) ?? [] });
    });
  }

  const rows = groups.flatMap(({ key, label, matches: groupMatches }) =>
    gameTypes.map((gameType) =>
      summarizeBreakdownRow(
        key,
        label,
        gameType,
        groupMatches.filter((match) => match.gameType === gameType),
      ),
    ),
  );
  return { dimension, rows, nextCursor: null };
};

export const aggregateRecentResults = (
  matches: readonly UserMatchStatistics[],
): PersonalStatisticsSummary["recentResults"] => {
  const orderedMatches = orderUserMatchStatistics(matches);
  return ([10, 20, 50] as const).map((windowSize) => {
    const recentMatches = orderedMatches.slice(-windowSize);
    const aggregation = aggregateRankAndScoreStatistics(recentMatches);
    return {
      windowSize,
      matchCount: recentMatches.length,
      totalPoints: aggregation.totalPoints,
      byGameType: aggregation.byGameType,
    };
  });
};

const matchReference = (
  match: UserMatchStatistics,
): StatisticsRecordMatchReference => ({
  matchId: match.matchId,
  leagueId: match.leagueId,
  leagueName: match.leagueName,
  seasonId: match.seasonId,
  seasonName: match.seasonName,
  sessionId: match.sessionId,
  sessionLabel: match.sessionLabel,
  playedAt: match.playedAt,
  opponents: match.opponents
    .slice(0, match.playerCount - 1)
    .map(({ userId, userName, rank, finalPoint }) => ({
      userId,
      userName,
      rank,
      finalPoint,
    })),
});

const selectRecord = (
  matches: readonly UserMatchStatistics[],
  field: "rawScore" | "finalPoint",
  direction: "highest" | "lowest",
): NonNullable<
  PersonalStatisticsSummary["records"]["highestRawScore"]
> | null => {
  if (matches.length === 0) return null;
  const extremeValue = matches.reduce(
    (extreme, match) =>
      direction === "highest"
        ? Math.max(extreme, match[field])
        : Math.min(extreme, match[field]),
    matches[0]?.[field] ?? 0,
  );
  const latestMatch = [...matches]
    .reverse()
    .find((match) => match[field] === extremeValue);
  if (latestMatch === undefined) return null;
  return { value: extremeValue, match: matchReference(latestMatch) };
};

const streakCount = (
  matches: readonly UserMatchStatistics[],
  predicate: (match: UserMatchStatistics) => boolean,
): { currentCount: number; longestCount: number } => {
  let runLength = 0;
  let longestCount = 0;
  for (const match of matches) {
    if (predicate(match)) {
      runLength += 1;
      longestCount = Math.max(longestCount, runLength);
    } else {
      runLength = 0;
    }
  }

  let currentCount = 0;
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index];
    if (match === undefined || !predicate(match)) break;
    currentCount += 1;
  }
  return { currentCount, longestCount };
};

export const aggregatePersonalRecords = (
  matches: readonly UserMatchStatistics[],
): Pick<PersonalStatisticsSummary, "records" | "streaks"> => {
  const orderedMatches = orderUserMatchStatistics(matches);
  return {
    records: {
      highestRawScore: selectRecord(orderedMatches, "rawScore", "highest"),
      lowestRawScore: selectRecord(orderedMatches, "rawScore", "lowest"),
      highestFinalPoint: selectRecord(orderedMatches, "finalPoint", "highest"),
      lowestFinalPoint: selectRecord(orderedMatches, "finalPoint", "lowest"),
    },
    streaks: [
      {
        type: "top",
        ...streakCount(orderedMatches, (match) => match.rank === 1),
      },
      {
        type: "last",
        ...streakCount(
          orderedMatches,
          (match) => match.rank === match.playerCount,
        ),
      },
      {
        type: "topTwo",
        ...streakCount(orderedMatches, (match) => match.rank <= 2),
      },
      {
        type: "positive",
        ...streakCount(orderedMatches, (match) => match.finalPoint > 0),
      },
      {
        type: "negative",
        ...streakCount(orderedMatches, (match) => match.finalPoint < 0),
      },
    ],
  };
};
