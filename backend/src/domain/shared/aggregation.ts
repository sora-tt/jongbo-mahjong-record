import type { Match, MatchResult } from "@/domain/match/types.js";
import type {
  PointProgression,
  SeasonMember,
  Standing,
} from "@/domain/season/types.js";
import type { RecordHolder, ScopeType } from "@/domain/shared/types.js";
import type { UserStats } from "@/domain/user/types.js";

type Aggregate = {
  userId: string;
  userName: string;
  totalPoints: number;
  totalMatchCount: number;
  totalRank: number;
  firstCount: number;
  secondCount: number;
  thirdCount: number;
  fourthCount: number;
  highestScore: number | null;
  lowestScore: number | null;
  totalRawScore: number;
  currentWinStreak: number;
  maxWinStreak: number;
  currentLoseStreak: number;
  maxLoseStreak: number;
  progression: PointProgression["points"];
};

const createAggregate = (member: SeasonMember): Aggregate => ({
  userId: member.userId,
  userName: member.userName,
  totalPoints: 0,
  totalMatchCount: 0,
  totalRank: 0,
  firstCount: 0,
  secondCount: 0,
  thirdCount: 0,
  fourthCount: 0,
  highestScore: null,
  lowestScore: null,
  totalRawScore: 0,
  currentWinStreak: 0,
  maxWinStreak: 0,
  currentLoseStreak: 0,
  maxLoseStreak: 0,
  progression: [],
});

const sortMatches = (matches: Match[]) =>
  [...matches].sort((left, right) => {
    const timeDiff =
      new Date(left.playedAt).getTime() - new Date(right.playedAt).getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }

    return left.matchIndex - right.matchIndex;
  });

export const buildSeasonAggregates = (
  members: SeasonMember[],
  matches: Match[],
) => {
  const aggregates = new Map<string, Aggregate>(
    members.map((member) => [member.userId, createAggregate(member)]),
  );

  const orderedMatches = sortMatches(matches);
  orderedMatches.forEach((match, index) => {
    match.results.forEach((result) => {
      const aggregate =
        aggregates.get(result.userId) ??
        createAggregate({ userId: result.userId, userName: result.userName });

      aggregate.totalPoints += result.point;
      aggregate.totalMatchCount += 1;
      aggregate.totalRank += result.rank;
      aggregate.totalRawScore += result.rawScore;
      aggregate.highestScore =
        aggregate.highestScore === null
          ? result.rawScore
          : Math.max(aggregate.highestScore, result.rawScore);
      aggregate.lowestScore =
        aggregate.lowestScore === null
          ? result.rawScore
          : Math.min(aggregate.lowestScore, result.rawScore);

      if (result.rank === 1) {
        aggregate.firstCount += 1;
        aggregate.currentWinStreak += 1;
      } else {
        aggregate.currentWinStreak = 0;
      }
      aggregate.maxWinStreak = Math.max(
        aggregate.maxWinStreak,
        aggregate.currentWinStreak,
      );

      if (result.rank === match.results.length) {
        aggregate.fourthCount += 1;
        aggregate.currentLoseStreak += 1;
      } else {
        aggregate.currentLoseStreak = 0;
      }
      aggregate.maxLoseStreak = Math.max(
        aggregate.maxLoseStreak,
        aggregate.currentLoseStreak,
      );

      if (result.rank === 2) {
        aggregate.secondCount += 1;
      } else if (result.rank === 3) {
        aggregate.thirdCount += 1;
      }

      aggregate.progression.push({
        matchIndex: index + 1,
        totalPoints: Number(aggregate.totalPoints.toFixed(1)),
      });

      aggregates.set(result.userId, aggregate);
    });
  });

  return sortAggregateEntries([...aggregates.values()]);
};

const sortAggregateEntries = (entries: Aggregate[]) =>
  entries.sort((left, right) => {
    if (right.totalPoints !== left.totalPoints) {
      return right.totalPoints - left.totalPoints;
    }

    return left.userName.localeCompare(right.userName, "ja");
  });

export const buildStandings = (
  members: SeasonMember[],
  matches: Match[],
): Standing[] =>
  buildSeasonAggregates(members, matches).map((aggregate, index) => ({
    rank: index + 1,
    userId: aggregate.userId,
    userName: aggregate.userName,
    totalPoints: Number(aggregate.totalPoints.toFixed(1)),
    matchCount: aggregate.totalMatchCount,
    firstCount: aggregate.firstCount,
    secondCount: aggregate.secondCount,
    thirdCount: aggregate.thirdCount,
    fourthCount: members.length === 4 ? aggregate.fourthCount : null,
  }));

export const buildPointProgressions = (
  members: SeasonMember[],
  matches: Match[],
): PointProgression[] =>
  buildSeasonAggregates(members, matches).map((aggregate) => ({
    userId: aggregate.userId,
    userName: aggregate.userName,
    points: aggregate.progression,
  }));

const createRateRecord = (
  entries: Aggregate[],
  getValue: (entry: Aggregate) => number | null,
): RecordHolder | null => {
  const candidates = entries
    .map((entry) => ({
      userId: entry.userId,
      userName: entry.userName,
      value: getValue(entry),
    }))
    .filter((entry): entry is RecordHolder => entry.value !== null);

  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort((left, right) => right.value - left.value)[0] ?? null;
};

export const buildSeasonRecords = (
  members: SeasonMember[],
  matches: Match[],
) => {
  const entries = buildSeasonAggregates(members, matches);

  return {
    highestScore: createRateRecord(entries, (entry) => entry.highestScore),
    avoidLastRate: createRateRecord(entries, (entry) => {
      if (entry.totalMatchCount === 0) {
        return null;
      }

      return Number(
        (
          ((entry.totalMatchCount - entry.fourthCount) /
            entry.totalMatchCount) *
          100
        ).toFixed(2),
      );
    }),
    top2Rate: createRateRecord(entries, (entry) => {
      if (entry.totalMatchCount === 0) {
        return null;
      }

      return Number(
        (
          ((entry.firstCount + entry.secondCount) / entry.totalMatchCount) *
          100
        ).toFixed(2),
      );
    }),
  };
};

export const buildLeagueRecords = (matches: Match[]) => {
  const byUser = new Map<string, Aggregate>();
  const orderedMatches = sortMatches(matches);

  orderedMatches.forEach((match) => {
    match.results.forEach((result) => {
      const entry =
        byUser.get(result.userId) ??
        createAggregate({ userId: result.userId, userName: result.userName });

      entry.totalMatchCount += 1;
      entry.totalPoints += result.point;
      entry.highestScore =
        entry.highestScore === null
          ? result.rawScore
          : Math.max(entry.highestScore, result.rawScore);
      entry.lowestScore =
        entry.lowestScore === null
          ? result.rawScore
          : Math.min(entry.lowestScore, result.rawScore);

      if (result.rank === 1) {
        entry.currentWinStreak += 1;
      } else {
        entry.currentWinStreak = 0;
      }
      entry.maxWinStreak = Math.max(entry.maxWinStreak, entry.currentWinStreak);

      if (result.rank === match.results.length) {
        entry.currentLoseStreak += 1;
      } else {
        entry.currentLoseStreak = 0;
      }
      entry.maxLoseStreak = Math.max(
        entry.maxLoseStreak,
        entry.currentLoseStreak,
      );

      byUser.set(result.userId, entry);
    });
  });

  const entries = [...byUser.values()];
  return {
    winStreak: createRateRecord(entries, (entry) => entry.maxWinStreak || null),
    loseStreak: createRateRecord(
      entries,
      (entry) => entry.maxLoseStreak || null,
    ),
    highestScore: createRateRecord(entries, (entry) => entry.highestScore),
    lowestScore:
      entries.length === 0
        ? null
        : (entries
            .map((entry) => ({
              userId: entry.userId,
              userName: entry.userName,
              value: entry.lowestScore,
            }))
            .filter((entry): entry is RecordHolder => entry.value !== null)
            .sort((left, right) => left.value - right.value)[0] ?? null),
  };
};

export const buildUserStats = (params: {
  scopeType: ScopeType;
  userId: string;
  userName: string;
  leagueId: string | null;
  seasonId: string | null;
  leagueName: string | null;
  seasonName: string | null;
  matchCount: number;
  currentRank: number | null;
  results: MatchResult[];
  playerCount: number;
}): Omit<UserStats, "id" | "createdAt" | "updatedAt"> => {
  const {
    scopeType,
    userId,
    userName,
    leagueId,
    seasonId,
    leagueName,
    seasonName,
    matchCount,
    currentRank,
    results,
    playerCount,
  } = params;

  let totalPoints = 0;
  let totalRank = 0;
  let firstCount = 0;
  let secondCount = 0;
  let thirdCount = 0;
  let fourthCount = 0;
  let highestScore: number | null = null;
  let lowestScore: number | null = null;
  let totalRawScore = 0;
  let winStreak = 0;
  let loseStreak = 0;
  let currentWinStreak = 0;
  let currentLoseStreak = 0;

  results.forEach((result) => {
    totalPoints += result.point;
    totalRank += result.rank;
    totalRawScore += result.rawScore;
    highestScore =
      highestScore === null
        ? result.rawScore
        : Math.max(highestScore, result.rawScore);
    lowestScore =
      lowestScore === null
        ? result.rawScore
        : Math.min(lowestScore, result.rawScore);

    if (result.rank === 1) {
      firstCount += 1;
      currentWinStreak += 1;
    } else {
      currentWinStreak = 0;
    }
    winStreak = Math.max(winStreak, currentWinStreak);

    if (result.rank === playerCount) {
      fourthCount += 1;
      currentLoseStreak += 1;
    } else {
      currentLoseStreak = 0;
    }
    loseStreak = Math.max(loseStreak, currentLoseStreak);

    if (result.rank === 2) {
      secondCount += 1;
    } else if (result.rank === 3) {
      thirdCount += 1;
    }
  });

  const averageRank =
    matchCount === 0 ? 0 : Number((totalRank / matchCount).toFixed(2));

  return {
    userId,
    userName,
    scopeType,
    leagueId,
    seasonId,
    leagueName,
    seasonName,
    totalPoints: Number(totalPoints.toFixed(1)),
    totalMatchCount: matchCount,
    averageRank,
    currentRank,
    firstCount,
    secondCount,
    thirdCount,
    fourthCount: playerCount === 4 ? fourthCount : null,
    firstRate:
      matchCount === 0
        ? 0
        : Number(((firstCount / matchCount) * 100).toFixed(2)),
    secondRate:
      matchCount === 0
        ? 0
        : Number(((secondCount / matchCount) * 100).toFixed(2)),
    thirdRate:
      matchCount === 0
        ? 0
        : Number(((thirdCount / matchCount) * 100).toFixed(2)),
    fourthRate:
      playerCount === 4 && matchCount > 0
        ? Number(((fourthCount / matchCount) * 100).toFixed(2))
        : null,
    highestScore,
    lowestScore,
    averageScore:
      matchCount === 0 ? null : Number((totalRawScore / matchCount).toFixed(2)),
    winStreak: matchCount === 0 ? null : winStreak,
    loseStreak: matchCount === 0 ? null : loseStreak,
  };
};
