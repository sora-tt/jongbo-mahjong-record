import type {
  StatisticsBreakdown,
  StatisticsGameType,
  UserMatchStatistics,
} from "@/domain/statistics/types.js";
import type { Wind } from "@/domain/shared/types.js";
import { aggregateRankAndScoreStatistics } from "@/domain/statistics/aggregation.js";
import { orderUserMatchStatistics } from "@/domain/statistics/temporal-aggregation.js";

type SeatBreakdown = Extract<
  StatisticsBreakdown,
  { dimension: "period" | "weekday" | "timeOfDay" | "seat" }
> & { dimension: "seat" };
type OpponentBreakdown = Extract<
  StatisticsBreakdown,
  { dimension: "opponent" }
>;
type SessionBreakdown = Extract<StatisticsBreakdown, { dimension: "session" }>;

type OpponentAccumulator = {
  userId: UserMatchStatistics["opponents"][number]["userId"];
  userName: string;
  gameType: StatisticsGameType;
  encounterCount: number;
  aboveCount: number;
  tieCount: number;
  totalPointDifference: number;
};

type SessionAccumulator = {
  sessionId: UserMatchStatistics["sessionId"];
  label: string;
  matches: UserMatchStatistics[];
};

const gameTypeOrder: StatisticsGameType[] = ["sanma", "yonma"];
const windsByGameType: Record<StatisticsGameType, readonly Wind[]> = {
  sanma: ["east", "south", "west"],
  yonma: ["east", "south", "west", "north"],
};
const windLabels: Record<Wind, string> = {
  east: "東家",
  south: "南家",
  west: "西家",
  north: "北家",
};
const compareText = (left: string, right: string): number =>
  left.localeCompare(right);

const validateOpponent = (
  match: UserMatchStatistics,
  opponent: UserMatchStatistics["opponents"][number],
): void => {
  if (
    opponent.userId === match.userId ||
    opponent.userId.length === 0 ||
    !Number.isInteger(opponent.rank) ||
    opponent.rank < 1 ||
    opponent.rank > match.playerCount ||
    !Number.isFinite(opponent.finalPoint)
  ) {
    throw new TypeError("statistics projection has invalid opponent values");
  }
};

export const aggregateSeatStatistics = (
  matches: readonly UserMatchStatistics[],
): SeatBreakdown => {
  const orderedMatches = orderUserMatchStatistics(matches);
  const gameTypes = gameTypeOrder.filter((gameType) =>
    orderedMatches.some((match) => match.gameType === gameType),
  );
  const rows: SeatBreakdown["rows"] = [];

  gameTypes.forEach((gameType) => {
    windsByGameType[gameType].forEach((wind) => {
      const seatMatches = orderedMatches.filter(
        (match) => match.gameType === gameType && match.wind === wind,
      );
      const denominator = seatMatches.length;
      const playerCount = gameType === "sanma" ? 3 : 4;
      rows.push({
        key: wind,
        label: windLabels[wind],
        gameType,
        matchCount: denominator,
        denominator,
        totalPoints: seatMatches.reduce(
          (sum, match) => sum + match.finalPoint,
          0,
        ),
        averageRank:
          denominator === 0
            ? null
            : seatMatches.reduce((sum, match) => sum + match.rank, 0) /
              denominator,
        topRate:
          denominator === 0
            ? null
            : seatMatches.filter((match) => match.rank === 1).length /
              denominator,
        averageFinalPoint:
          denominator === 0
            ? null
            : seatMatches.reduce((sum, match) => sum + match.finalPoint, 0) /
              denominator,
        rankCounts: Array.from({ length: playerCount }, (_, index) => ({
          rank: index + 1,
          count: seatMatches.filter((match) => match.rank === index + 1).length,
        })),
      });
    });
  });

  return { dimension: "seat", rows, nextCursor: null };
};

export const aggregateOpponentStatistics = (
  matches: readonly UserMatchStatistics[],
): OpponentBreakdown => {
  const orderedMatches = orderUserMatchStatistics(matches);
  const grouped = new Map<string, OpponentAccumulator>();

  orderedMatches.forEach((match) => {
    const seenInMatch = new Set<string>();
    match.opponents.forEach((opponent) => {
      validateOpponent(match, opponent);
      if (seenInMatch.has(opponent.userId)) {
        throw new TypeError(
          "statistics projection contains duplicate opponent",
        );
      }
      seenInMatch.add(opponent.userId);
      const groupKey = `${match.gameType}\u0000${opponent.userId}`;
      const group = grouped.get(groupKey) ?? {
        userId: opponent.userId,
        userName: opponent.userName,
        gameType: match.gameType,
        encounterCount: 0,
        aboveCount: 0,
        tieCount: 0,
        totalPointDifference: 0,
      };
      group.userName = opponent.userName;
      group.encounterCount += 1;
      if (match.rank < opponent.rank) group.aboveCount += 1;
      if (match.rank === opponent.rank) group.tieCount += 1;
      group.totalPointDifference += match.finalPoint - opponent.finalPoint;
      grouped.set(groupKey, group);
    });
  });

  // Stable key order keeps reader-side cursor pagination independent of scores.
  const rows = [...grouped.values()]
    .sort(
      (left, right) =>
        gameTypeOrder.indexOf(left.gameType) -
          gameTypeOrder.indexOf(right.gameType) ||
        compareText(left.userId, right.userId),
    )
    .map(({ aboveCount, ...group }) => ({
      ...group,
      aboveRate:
        group.encounterCount === 0 ? null : aboveCount / group.encounterCount,
      averagePointDifference: group.totalPointDifference / group.encounterCount,
    }));
  return { dimension: "opponent", rows, nextCursor: null };
};

const sessionLabelFor = (match: UserMatchStatistics): string =>
  match.sessionLabel?.trim() || match.sessionId;

const chooseSessionLabel = (current: string, candidate: string): string =>
  compareText(candidate, current) < 0 ? candidate : current;

const sessionSummaries = (
  matches: readonly UserMatchStatistics[],
): {
  averageRankByGameType: ReturnType<
    typeof aggregateRankAndScoreStatistics
  >["byGameType"];
  topCountByGameType: Array<{ gameType: StatisticsGameType; count: number }>;
} => {
  const summaries = aggregateRankAndScoreStatistics(matches).byGameType;
  return {
    averageRankByGameType: summaries,
    topCountByGameType: summaries.map((summary) => ({
      gameType: summary.gameType,
      count: summary.ranks.find(({ rank }) => rank === 1)?.count ?? 0,
    })),
  };
};

export const aggregateSessionStatistics = (
  matches: readonly UserMatchStatistics[],
): SessionBreakdown => {
  const orderedMatches = orderUserMatchStatistics(matches);
  const grouped = new Map<string, SessionAccumulator>();
  orderedMatches.forEach((match) => {
    const group = grouped.get(match.sessionId) ?? {
      sessionId: match.sessionId,
      label: sessionLabelFor(match),
      matches: [],
    };
    group.label = chooseSessionLabel(group.label, sessionLabelFor(match));
    group.matches.push(match);
    grouped.set(match.sessionId, group);
  });

  // sessionId is the stable page key; never order these rows by changing totals.
  const rows = [...grouped.values()]
    .sort((left, right) => compareText(left.sessionId, right.sessionId))
    .map(({ sessionId, label, matches: sessionMatches }) => {
      const perFormat = sessionSummaries(sessionMatches);
      return {
        sessionId,
        label,
        matchCount: sessionMatches.length,
        totalPoints: sessionMatches.reduce(
          (sum, match) => sum + match.finalPoint,
          0,
        ),
        ...perFormat,
      };
    });
  return { dimension: "session", rows, nextCursor: null };
};
