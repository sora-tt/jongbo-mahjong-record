import type { Match } from "@/domain/match/types.js";
import type { LeagueId, SeasonId, SessionId } from "@/domain/shared/types.js";
import type { UserMatchStatistics } from "@/domain/statistics/types.js";

export type UserMatchStatisticsProjectionDraft = Omit<
  UserMatchStatistics,
  "id"
>;

export type BuildUserMatchStatisticsProjectionsInput = {
  match: Match;
  league: { id: LeagueId; name: string };
  season: { id: SeasonId; name: string };
  session: { id: SessionId; label: string | null };
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const assertValidDate = (value: unknown, field: string): void => {
  if (
    typeof value !== "string" ||
    !Number.isFinite(new Date(value).getTime())
  ) {
    throw new TypeError(`statistics projection requires a valid ${field}`);
  }
};

export const buildUserMatchStatisticsProjections = (
  input: BuildUserMatchStatisticsProjectionsInput,
): UserMatchStatisticsProjectionDraft[] => {
  const { match, league, season, session } = input;
  if (!Array.isArray(match.results) || ![3, 4].includes(match.results.length)) {
    throw new RangeError(
      "statistics projection requires exactly 3 or 4 confirmed results",
    );
  }

  if (
    league.id !== match.leagueId ||
    season.id !== match.seasonId ||
    session.id !== match.sessionId
  ) {
    throw new TypeError(
      "statistics projection metadata IDs must match the match scope",
    );
  }

  if (
    !isNonEmptyString(league.name) ||
    !isNonEmptyString(season.name) ||
    !(session.label === null || typeof session.label === "string")
  ) {
    throw new TypeError(
      "statistics projection requires league/season names and a session label",
    );
  }
  if (
    !isNonEmptyString(match.id) ||
    !isNonEmptyString(match.leagueId) ||
    !isNonEmptyString(match.seasonId) ||
    !isNonEmptyString(match.sessionId)
  ) {
    throw new TypeError("statistics projection requires match scope IDs");
  }
  if (!Number.isInteger(match.matchIndex) || match.matchIndex < 0) {
    throw new RangeError("statistics projection requires a valid matchIndex");
  }
  assertValidDate(match.playedAt, "playedAt");
  assertValidDate(match.updatedAt, "updatedAt");
  if (!Array.isArray(match.chomboEvents)) {
    throw new TypeError(
      "statistics projection requires confirmed chombo events",
    );
  }

  const playerCount = match.results.length as 3 | 4;
  const participantIds = new Set<string>();
  for (const result of match.results) {
    if (
      !isNonEmptyString(result.userId) ||
      !isNonEmptyString(result.userName) ||
      !Number.isInteger(result.rank) ||
      result.rank < 1 ||
      result.rank > playerCount ||
      !Number.isFinite(result.rawScore) ||
      !Number.isFinite(result.point) ||
      !["east", "south", "west", "north"].includes(result.wind)
    ) {
      throw new TypeError(
        "statistics projection requires finite confirmed values for each result",
      );
    }
    if (participantIds.has(result.userId)) {
      throw new TypeError(
        "statistics projection contains a duplicate participant",
      );
    }
    participantIds.add(result.userId);
  }

  const expectedWinds = new Set<Match["results"][number]["wind"]>(
    playerCount === 3
      ? ["east", "south", "west"]
      : ["east", "south", "west", "north"],
  );
  const resultWinds = new Set(match.results.map(({ wind }) => wind));
  if (
    resultWinds.size !== playerCount ||
    [...expectedWinds].some((wind) => !resultWinds.has(wind))
  ) {
    throw new TypeError(
      "statistics projection requires the complete wind set for the confirmed result count",
    );
  }

  const rankedResults = [...match.results].sort(
    (left, right) => right.rawScore - left.rawScore,
  );
  const expectedRanks = new Map<string, number>();
  let previousRawScore: number | undefined;
  let previousRank = 0;
  rankedResults.forEach((result, index) => {
    const expectedRank =
      index === 0 || result.rawScore !== previousRawScore
        ? index + 1
        : previousRank;
    expectedRanks.set(result.userId, expectedRank);
    previousRawScore = result.rawScore;
    previousRank = expectedRank;
  });
  if (
    match.results.some(
      (result) => expectedRanks.get(result.userId) !== result.rank,
    )
  ) {
    throw new TypeError(
      "statistics projection result rank does not match rawScore ordering",
    );
  }

  const chomboCounts = new Map<string, number>();
  for (const event of match.chomboEvents) {
    if (!isNonEmptyString(event.offenderUserId)) {
      throw new TypeError(
        "statistics projection contains an invalid chombo offender",
      );
    }
    chomboCounts.set(
      event.offenderUserId,
      (chomboCounts.get(event.offenderUserId) ?? 0) + 1,
    );
  }

  const gameType = playerCount === 3 ? "sanma" : "yonma";
  return match.results.map((result) => ({
    userId: result.userId,
    userName: result.userName,
    leagueId: match.leagueId,
    leagueName: league.name,
    seasonId: match.seasonId,
    seasonName: season.name,
    sessionId: match.sessionId,
    sessionLabel: session.label,
    matchId: match.id,
    matchIndex: match.matchIndex,
    playedAt: match.playedAt,
    gameType,
    playerCount,
    wind: result.wind,
    rank: result.rank,
    rawScore: result.rawScore,
    finalPoint: result.point,
    chomboCount: chomboCounts.get(result.userId) ?? 0,
    opponents: match.results
      .filter((opponent) => opponent.userId !== result.userId)
      .map((opponent) => ({
        userId: opponent.userId,
        userName: opponent.userName,
        rank: opponent.rank,
        finalPoint: opponent.point,
      })),
    updatedAt: match.updatedAt,
  }));
};
