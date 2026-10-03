import assert from "node:assert/strict";
import test from "node:test";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type { UserMatchStatisticsRepository } from "@/domain/statistics/repository.js";
import type {
  PersonalStatisticsSnapshot,
  StatisticsSummaryQuery,
  UserMatchStatistics,
} from "@/domain/statistics/types.js";
import type { UserStatsWithPersonalStatistics } from "@/domain/user/types.js";
import type { UserStatsRepository } from "@/domain/user/repository.js";
import type { UserStats } from "@/domain/user/types.js";
import { NotFoundError } from "@/domain/shared/errors.js";
import { asIsoDateString, asOpaqueId } from "@/domain/shared/types.js";
import { buildPersonalStatisticsSnapshot } from "@/domain/statistics/snapshot-builder.js";
import { StatisticsTargetAccessError } from "@/domain/statistics/errors.js";
import { PersonalStatisticsSummaryReader } from "@/application/services/personalStatisticsSummaryReader.js";

const viewerUserId = asOpaqueId("viewer-1");
const targetUserId = asOpaqueId("target-1");
const leagueId = asOpaqueId("league-1");
const seasonId = asOpaqueId("season-1");
const generatedAt = asIsoDateString("2026-09-30T12:00:00.000Z");

const makeMatch = (input: {
  matchId: string;
  gameType: "sanma" | "yonma";
  rank: number;
  rawScore: number;
  finalPoint: number;
  playedAt: string;
}): UserMatchStatistics => {
  const playerCount = input.gameType === "sanma" ? 3 : 4;
  return {
    id: asOpaqueId(`projection-${input.matchId}`),
    userId: targetUserId,
    userName: "対象者",
    leagueId,
    leagueName: "リーグ",
    seasonId,
    seasonName: "シーズン",
    sessionId: asOpaqueId(`session-${input.matchId}`),
    sessionLabel: null,
    matchId: asOpaqueId(input.matchId),
    matchIndex: 1,
    playedAt: asIsoDateString(input.playedAt),
    gameType: input.gameType,
    playerCount,
    wind: "east",
    rank: input.rank,
    rawScore: input.rawScore,
    finalPoint: input.finalPoint,
    chomboCount: 0,
    opponents: [],
    updatedAt: generatedAt,
  };
};

const matches = [
  makeMatch({
    matchId: "match-yonma",
    gameType: "yonma",
    rank: 1,
    rawScore: 52_000,
    finalPoint: 42,
    playedAt: "2026-09-20T12:00:00.000Z",
  }),
  makeMatch({
    matchId: "match-sanma",
    gameType: "sanma",
    rank: 3,
    rawScore: 12_000,
    finalPoint: -22,
    playedAt: "2026-09-25T12:00:00.000Z",
  }),
];

const makeSnapshot = (
  sourceMatches: readonly UserMatchStatistics[] = matches,
): PersonalStatisticsSnapshot =>
  buildPersonalStatisticsSnapshot({
    targetUserId,
    scopeType: "overall",
    matches: sourceMatches,
    basicStats: {
      totalPoints: Number(
        sourceMatches
          .reduce((sum, match) => sum + match.finalPoint, 0)
          .toFixed(1),
      ),
      totalMatchCount: sourceMatches.length,
      chomboCount: sourceMatches.reduce(
        (sum, match) => sum + match.chomboCount,
        0,
      ),
      currentRank: null,
      firstCount: sourceMatches.filter((match) => match.rank === 1).length,
      secondCount: sourceMatches.filter((match) => match.rank === 2).length,
      thirdCount: sourceMatches.filter((match) => match.rank === 3).length,
      fourthCount: sourceMatches.some((match) => match.gameType === "yonma")
        ? sourceMatches.filter((match) => match.rank === 4).length
        : null,
    },
    currentStanding: null,
  });

const makeStatsRecord = (
  snapshot: PersonalStatisticsSnapshot | null,
  version = 1,
): UserStatsWithPersonalStatistics =>
  ({
    stats: { updatedAt: generatedAt } as UserStats,
    personalStatisticsVersion: version,
    personalStatisticsSnapshot: snapshot,
  }) as UserStatsWithPersonalStatistics;

const overallQuery = (
  options: Partial<Pick<StatisticsSummaryQuery, "gameType">> = {},
): StatisticsSummaryQuery => ({
  scopeType: "overall",
  viewerUserId,
  targetUserId,
  ...options,
});

const leagueQuery = (): StatisticsSummaryQuery => ({
  scopeType: "league",
  leagueId,
  viewerUserId,
  targetUserId,
});

const seasonQuery = (
  options: Partial<
    Pick<StatisticsSummaryQuery, "from" | "to" | "gameType">
  > = {},
): StatisticsSummaryQuery => ({
  scopeType: "season",
  leagueId,
  seasonId,
  viewerUserId,
  targetUserId,
  ...options,
});

const makeReaderFixture = (
  options: {
    statsRecord?: UserStatsWithPersonalStatistics | null;
    projectionMatches?: UserMatchStatistics[];
    accessError?: Error;
    missingLeague?: boolean;
    missingSeason?: boolean;
  } = {},
) => {
  const events: string[] = [];
  let statsReadCount = 0;
  let statsQuery: unknown;
  let projectionReadCount = 0;
  let projectionQuery: unknown;
  const access = {
    assertAllowed: async () => {
      events.push("access");
      if (options.accessError) throw options.accessError;
    },
  };
  const userStatsRepository = {
    getWithPersonalStatistics: async (query: unknown) => {
      events.push("stats");
      statsReadCount += 1;
      statsQuery = query;
      return options.statsRecord === undefined
        ? makeStatsRecord(makeSnapshot())
        : options.statsRecord;
    },
  } as unknown as UserStatsRepository;
  const projectionRepository = {
    listForScope: async (query: unknown) => {
      events.push("projection");
      projectionReadCount += 1;
      projectionQuery = query;
      return options.projectionMatches ?? matches;
    },
  } as unknown as UserMatchStatisticsRepository;
  const leagueRepository = {
    get: async () => {
      events.push("league");
      if (options.missingLeague) {
        throw new NotFoundError("league not found", { leagueId });
      }
      return {};
    },
  } as unknown as LeagueRepository;
  const seasonRepository = {
    get: async () => {
      events.push("season");
      if (options.missingSeason) {
        throw new NotFoundError("season not found", { leagueId, seasonId });
      }
      return {};
    },
  } as unknown as SeasonRepository;

  return {
    reader: new PersonalStatisticsSummaryReader(
      access,
      userStatsRepository,
      projectionRepository,
      leagueRepository,
      seasonRepository,
    ),
    events,
    get statsReadCount() {
      return statsReadCount;
    },
    get statsQuery() {
      return statsQuery;
    },
    get projectionReadCount() {
      return projectionReadCount;
    },
    get projectionQuery() {
      return projectionQuery;
    },
  };
};

test("fixed-scope summary reads one snapshot document and selects the saved game-type slice", async () => {
  const fixture = makeReaderFixture();

  const allSummary = await fixture.reader.getSummary(overallQuery());
  assert.equal(allSummary.status, "ready");
  assert.equal(allSummary.generatedAt, generatedAt);
  assert.equal(allSummary.timeZone, "Asia/Tokyo");
  assert.equal(allSummary.totals.totalMatchCount, 2);
  assert.deepEqual(
    allSummary.byGameType.map(({ gameType }) => gameType),
    ["sanma", "yonma"],
  );
  assert.deepEqual(
    allSummary.scoreByGameType.map(({ gameType, rawScore, finalPoint }) => ({
      gameType,
      rawScoreCount: rawScore.matchCount,
      finalPointCount: finalPoint.matchCount,
    })),
    [
      { gameType: "sanma", rawScoreCount: 1, finalPointCount: 1 },
      { gameType: "yonma", rawScoreCount: 1, finalPointCount: 1 },
    ],
  );

  const sanmaSummary = await fixture.reader.getSummary(
    overallQuery({ gameType: "sanma" }),
  );
  assert.equal(sanmaSummary.status, "ready");
  assert.equal(sanmaSummary.totals.totalMatchCount, 1);
  assert.equal(sanmaSummary.totals.totalPoints, -22);
  assert.deepEqual(
    sanmaSummary.byGameType.map(({ gameType }) => gameType),
    ["sanma"],
  );
  assert.deepEqual(
    sanmaSummary.scoreByGameType.map(({ gameType, finalPoint }) => ({
      gameType,
      matchCount: finalPoint.matchCount,
    })),
    [{ gameType: "sanma", matchCount: 1 }],
  );
  assert.equal(fixture.statsReadCount, 2);
  assert.equal(fixture.projectionReadCount, 0);
  assert.deepEqual(fixture.statsQuery, {
    userId: targetUserId,
    scopeType: "overall",
  });
});

test("date-filtered summary reads projections only after access, scope and readiness checks", async () => {
  const currentStanding = {
    rank: 2,
    totalPoints: 20,
    pointsBehindAbove: 10,
    pointsAheadBelow: 5,
    source: "season" as const,
  };
  const savedSnapshot = makeSnapshot();
  savedSnapshot.all.currentStanding = currentStanding;
  savedSnapshot.byGameType = savedSnapshot.byGameType.map((slice) => ({
    ...slice,
    summary: { ...slice.summary, currentStanding },
  }));
  const fixture = makeReaderFixture({
    statsRecord: makeStatsRecord(savedSnapshot),
    projectionMatches: [matches[1]!],
  });

  const result = await fixture.reader.getSummary(
    seasonQuery({
      from: asIsoDateString("2026-09-01T00:00:00.000Z"),
      to: asIsoDateString("2026-10-01T00:00:00.000Z"),
      gameType: "sanma",
    }),
  );

  assert.equal(result.status, "ready");
  assert.equal(result.totals.totalMatchCount, 1);
  assert.equal(result.totals.totalPoints, -22);
  assert.deepEqual(result.currentStanding, currentStanding);
  assert.deepEqual(fixture.events, ["access", "season", "stats", "projection"]);
  assert.equal(fixture.statsReadCount, 1);
  assert.equal(fixture.projectionReadCount, 1);
  assert.deepEqual(fixture.projectionQuery, {
    scopeType: "season",
    leagueId,
    seasonId,
    from: "2026-09-01T00:00:00.000Z",
    to: "2026-10-01T00:00:00.000Z",
    gameType: "sanma",
    userId: targetUserId,
  });
});

test("version below one returns uncomputed without reading projections", async () => {
  const fixture = makeReaderFixture({
    statsRecord: makeStatsRecord(null, 0),
  });

  const result = await fixture.reader.getSummary(
    seasonQuery({ from: asIsoDateString("2026-09-01T00:00:00.000Z") }),
  );

  assert.equal(result.status, "uncomputed");
  assert.equal(result.generatedAt, null);
  assert.equal(fixture.projectionReadCount, 0);
});

test("version one with no selected matches returns empty and preserves null metrics", async () => {
  const fixture = makeReaderFixture({
    statsRecord: makeStatsRecord(
      makeSnapshot(matches.filter((match) => match.gameType === "yonma")),
    ),
  });

  const result = await fixture.reader.getSummary(
    overallQuery({ gameType: "sanma" }),
  );

  assert.equal(result.status, "empty");
  assert.equal(result.totals.totalMatchCount, 0);
  assert.equal(result.finalPoint.average, null);
  assert.equal(result.finalPoint.positive.rate, null);
});

test("access denial happens before snapshot and projection reads", async () => {
  const fixture = makeReaderFixture({
    accessError: new StatisticsTargetAccessError(),
  });

  await assert.rejects(
    fixture.reader.getSummary(seasonQuery({ from: generatedAt })),
    StatisticsTargetAccessError,
  );
  assert.deepEqual(fixture.events, ["access"]);
  assert.equal(fixture.statsReadCount, 0);
  assert.equal(fixture.projectionReadCount, 0);
});

test("missing scope entity returns existing 404 before statistics reads", async () => {
  const leagueFixture = makeReaderFixture({ missingLeague: true });

  await assert.rejects(
    leagueFixture.reader.getSummary(leagueQuery()),
    NotFoundError,
  );
  assert.deepEqual(leagueFixture.events, ["access", "league"]);
  assert.equal(leagueFixture.statsReadCount, 0);
  assert.equal(leagueFixture.projectionReadCount, 0);

  const seasonFixture = makeReaderFixture({ missingSeason: true });
  await assert.rejects(
    seasonFixture.reader.getSummary(seasonQuery()),
    NotFoundError,
  );
  assert.deepEqual(seasonFixture.events, ["access", "season"]);
  assert.equal(seasonFixture.statsReadCount, 0);
  assert.equal(seasonFixture.projectionReadCount, 0);
});

test("fixed-scope missing snapshot is uncomputed and does not scan projections", async () => {
  const fixture = makeReaderFixture({ statsRecord: null });

  const result = await fixture.reader.getSummary(overallQuery());

  assert.equal(result.status, "uncomputed");
  assert.equal(fixture.statsReadCount, 1);
  assert.equal(fixture.projectionReadCount, 0);
});
