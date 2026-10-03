import assert from "node:assert/strict";
import test from "node:test";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type { UserMatchStatisticsRepository } from "@/domain/statistics/repository.js";
import type {
  StatisticsAnalysis,
  PersonalStatisticsSnapshot,
  StatisticsAnalysisQuery,
  UserMatchStatistics,
} from "@/domain/statistics/types.js";
import type { UserStatsRepository } from "@/domain/user/repository.js";
import type {
  UserStats,
  UserStatsWithPersonalStatistics,
} from "@/domain/user/types.js";
import { NotFoundError } from "@/domain/shared/errors.js";
import { asIsoDateString, asOpaqueId } from "@/domain/shared/types.js";
import { StatisticsTargetAccessError } from "@/domain/statistics/errors.js";
import { PersonalStatisticsAnalysisReader } from "@/application/services/personalStatisticsAnalysisReader.js";

const viewerUserId = asOpaqueId("viewer-1");
const targetUserId = asOpaqueId("target-1");
const otherUserId = asOpaqueId("other-1");
const leagueId = asOpaqueId("league-1");
const seasonId = asOpaqueId("season-1");
const generatedAt = asIsoDateString("2026-09-30T12:00:00.000Z");

const makeMatch = (input: {
  id: string;
  userId?: UserMatchStatistics["userId"];
  sessionId?: string;
  opponentId?: string;
  gameType?: UserMatchStatistics["gameType"];
  rank?: number;
  finalPoint?: number;
  playedAt?: string;
}): UserMatchStatistics => {
  const gameType = input.gameType ?? "yonma";
  const playerCount = gameType === "sanma" ? 3 : 4;
  return {
    id: asOpaqueId(`projection-${input.id}`),
    userId: input.userId ?? targetUserId,
    userName: "対象者",
    leagueId,
    leagueName: "リーグ",
    seasonId,
    seasonName: "シーズン",
    sessionId: asOpaqueId(input.sessionId ?? `session-${input.id}`),
    sessionLabel: input.sessionId ? `卓 ${input.sessionId}` : null,
    matchId: asOpaqueId(input.id),
    matchIndex: 1,
    playedAt: asIsoDateString(input.playedAt ?? "2026-09-20T12:00:00.000Z"),
    gameType,
    playerCount,
    wind: "east",
    rank: input.rank ?? 1,
    rawScore: 45_000,
    finalPoint: input.finalPoint ?? 10,
    chomboCount: 0,
    opponents:
      input.opponentId === undefined
        ? []
        : [
            {
              userId: asOpaqueId(input.opponentId),
              userName: `相手 ${input.opponentId}`,
              rank: 2,
              finalPoint: 0,
            },
          ],
    updatedAt: generatedAt,
  };
};

const makeStatsRecord = (
  version = 1,
  snapshot: PersonalStatisticsSnapshot | null = {} as PersonalStatisticsSnapshot,
): UserStatsWithPersonalStatistics =>
  ({
    stats: { updatedAt: generatedAt } as UserStats,
    personalStatisticsVersion: version,
    personalStatisticsSnapshot: snapshot,
  }) as UserStatsWithPersonalStatistics;

const makeQuery = (
  options: Record<string, unknown> = {},
): StatisticsAnalysisQuery =>
  ({
    scopeType: "overall",
    viewerUserId,
    targetUserId,
    dimension: "period",
    windowSize: 10,
    ...options,
  }) as StatisticsAnalysisQuery;

const expectReady = (
  result: import("@/domain/statistics/types.js").StatisticsAnalysisResult,
): StatisticsAnalysis => {
  if (result.status === "uncomputed") {
    assert.fail("expected a computed analysis");
  }
  return result;
};

const makeFixture = (
  options: {
    statsRecord?: UserStatsWithPersonalStatistics | null;
    matches?: UserMatchStatistics[];
    accessError?: Error;
    missingLeague?: boolean;
    missingSeason?: boolean;
  } = {},
) => {
  const events: string[] = [];
  let statsQuery: unknown;
  let projectionQuery: unknown;
  let projectionReadCount = 0;
  const access = {
    assertAllowed: async (query: unknown) => {
      events.push("access");
      if (options.accessError) throw options.accessError;
      void query;
    },
  };
  const userStatsRepository = {
    getWithPersonalStatistics: async (query: unknown) => {
      events.push("stats");
      statsQuery = query;
      return options.statsRecord === undefined
        ? makeStatsRecord()
        : options.statsRecord;
    },
  } as unknown as UserStatsRepository;
  const projectionRepository = {
    listForScope: async (query: unknown) => {
      events.push("projection");
      projectionQuery = query;
      projectionReadCount += 1;
      return options.matches ?? [];
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
    reader: new PersonalStatisticsAnalysisReader(
      access,
      userStatsRepository,
      projectionRepository,
      leagueRepository,
      seasonRepository,
    ),
    events,
    get statsQuery() {
      return statsQuery;
    },
    get projectionQuery() {
      return projectionQuery;
    },
    get projectionReadCount() {
      return projectionReadCount;
    },
  };
};

test("checks access, scope existence, and readiness before reading projections", async () => {
  const denied = makeFixture({
    accessError: new StatisticsTargetAccessError({ scopeType: "overall" }),
  });
  await assert.rejects(
    denied.reader.getAnalysis(makeQuery()),
    StatisticsTargetAccessError,
  );
  assert.deepEqual(denied.events, ["access"]);

  const missingScope = makeFixture({ missingSeason: true });
  await assert.rejects(
    missingScope.reader.getAnalysis(
      makeQuery({ scopeType: "season", leagueId, seasonId }),
    ),
    NotFoundError,
  );
  assert.deepEqual(missingScope.events, ["access", "season"]);

  const uncomputed = makeFixture({ statsRecord: makeStatsRecord(0) });
  const result = await uncomputed.reader.getAnalysis(makeQuery());
  assert.equal(result.status, "uncomputed");
  assert.deepEqual(uncomputed.events, ["access", "stats"]);
  assert.equal(uncomputed.projectionReadCount, 0);
});

test("validates paged query options and cursor binding before readiness reads", async () => {
  const invalidLimit = makeFixture({ statsRecord: makeStatsRecord(0) });
  await assert.rejects(
    invalidLimit.reader.getAnalysis(
      makeQuery({ dimension: "session", limit: 0 }),
    ),
    /analysis breakdown limit/,
  );
  assert.deepEqual(invalidLimit.events, ["access"]);

  const excessiveLimit = makeFixture({ statsRecord: makeStatsRecord(0) });
  await assert.rejects(
    excessiveLimit.reader.getAnalysis(
      makeQuery({ dimension: "opponent", limit: 101 }),
    ),
    /analysis breakdown limit/,
  );
  assert.deepEqual(excessiveLimit.events, ["access"]);

  const wrongDimensionOption = makeFixture({
    statsRecord: makeStatsRecord(0),
  });
  await assert.rejects(
    wrongDimensionOption.reader.getAnalysis(
      makeQuery({ dimension: "opponent", groupBy: "day" }),
    ),
    /groupBy is only supported for period/,
  );
  assert.deepEqual(wrongDimensionOption.events, ["access"]);

  const cursorSource = makeFixture({
    matches: [
      makeMatch({ id: "cursor-1", opponentId: "opponent-1" }),
      makeMatch({ id: "cursor-2", opponentId: "opponent-2" }),
    ],
  });
  const cursorQuery = makeQuery({ dimension: "opponent", limit: 1 });
  const firstPage = expectReady(
    await cursorSource.reader.getAnalysis(cursorQuery),
  );
  if (firstPage.breakdown.dimension !== "opponent") {
    assert.fail("expected an opponent breakdown");
  }
  assert.ok(firstPage.breakdown.nextCursor);

  const uncomputed = makeFixture({ statsRecord: makeStatsRecord(0) });
  await assert.rejects(
    uncomputed.reader.getAnalysis({
      ...cursorQuery,
      targetUserId: otherUserId,
      cursor: firstPage.breakdown.nextCursor,
    }),
    /cursor does not match query/,
  );
  assert.deepEqual(uncomputed.events, ["access"]);
  assert.equal(uncomputed.projectionReadCount, 0);

  const malformedCursor = makeFixture({ statsRecord: makeStatsRecord(0) });
  await assert.rejects(
    malformedCursor.reader.getAnalysis({
      ...cursorQuery,
      cursor: "-",
    }),
    /invalid cursor/,
  );
  assert.deepEqual(malformedCursor.events, ["access"]);
  assert.equal(malformedCursor.projectionReadCount, 0);
});

test("rejects runtime dimension, groupBy, and window values before readiness reads", async () => {
  const invalidDimension = makeFixture({ statsRecord: makeStatsRecord(0) });
  await assert.rejects(
    invalidDimension.reader.getAnalysis(
      makeQuery({ dimension: "invalid-dimension" }),
    ),
    /invalid statistics analysis dimension/,
  );
  assert.deepEqual(invalidDimension.events, ["access"]);

  const invalidGroupBy = makeFixture({ statsRecord: makeStatsRecord(0) });
  await assert.rejects(
    invalidGroupBy.reader.getAnalysis(
      makeQuery({ dimension: "period", groupBy: "quarter" }),
    ),
    /invalid statistics analysis groupBy/,
  );
  assert.deepEqual(invalidGroupBy.events, ["access"]);

  const invalidWindowSize = makeFixture({ statsRecord: makeStatsRecord(0) });
  await assert.rejects(
    invalidWindowSize.reader.getAnalysis(
      makeQuery({ dimension: "weekday", windowSize: 25 }),
    ),
    /invalid statistics analysis windowSize/,
  );
  assert.deepEqual(invalidWindowSize.events, ["access"]);
});

test("reads only the target scope and returns the selected breakdown with cumulative window", async () => {
  const fixture = makeFixture({
    matches: [
      makeMatch({
        id: "m2",
        finalPoint: 10,
        playedAt: "2026-09-21T12:00:00.000Z",
      }),
      makeMatch({
        id: "m1",
        finalPoint: 5,
        playedAt: "2026-09-20T12:00:00.000Z",
      }),
      makeMatch({
        id: "m3",
        finalPoint: -2,
        playedAt: "2026-09-22T12:00:00.000Z",
      }),
      makeMatch({ id: "other-target", userId: otherUserId, finalPoint: 900 }),
    ],
  });
  const result = expectReady(
    await fixture.reader.getAnalysis(
      makeQuery({
        scopeType: "season",
        leagueId,
        seasonId,
        from: asIsoDateString("2026-09-20T00:00:00.000Z"),
        to: asIsoDateString("2026-09-23T00:00:00.000Z"),
        gameType: "yonma",
        dimension: "period",
        groupBy: "day",
        windowSize: 10,
      }),
    ),
  );

  assert.equal(result.status, "ready");
  assert.equal(result.generatedAt, generatedAt);
  assert.equal(result.breakdown.dimension, "period");
  assert.equal(result.breakdown.nextCursor, null);
  assert.deepEqual(
    result.progression.map(({ point, cumulativePoint }) => ({
      point,
      cumulativePoint,
    })),
    [
      { point: 5, cumulativePoint: 5 },
      { point: 10, cumulativePoint: 15 },
      { point: -2, cumulativePoint: 13 },
    ],
  );
  assert.deepEqual(fixture.events, ["access", "season", "stats", "projection"]);
  assert.deepEqual(fixture.statsQuery, {
    userId: targetUserId,
    scopeType: "season",
    leagueId,
    seasonId,
  });
  assert.deepEqual(fixture.projectionQuery, {
    scopeType: "season",
    leagueId,
    seasonId,
    from: asIsoDateString("2026-09-20T00:00:00.000Z"),
    to: asIsoDateString("2026-09-23T00:00:00.000Z"),
    gameType: "yonma",
    userId: targetUserId,
  });
});

test("shows only the tail window while keeping cumulative points from the full filtered history", async () => {
  const fixture = makeFixture({
    matches: Array.from({ length: 12 }, (_, index) =>
      makeMatch({
        id: `window-${index + 1}`,
        finalPoint: index + 1,
        playedAt: new Date(Date.UTC(2026, 8, index + 1)).toISOString(),
      }),
    ),
  });

  const result = expectReady(
    await fixture.reader.getAnalysis(
      makeQuery({ dimension: "weekday", windowSize: 10 }),
    ),
  );

  assert.equal(result.progression.length, 10);
  assert.equal(result.progression[0]?.point, 3);
  assert.equal(result.progression[0]?.cumulativePoint, 6);
  assert.equal(result.progression.at(-1)?.cumulativePoint, 78);
});

test("dispatches all six dimensions to their domain aggregators", async () => {
  const dimensions = [
    "period",
    "weekday",
    "timeOfDay",
    "seat",
    "opponent",
    "session",
  ] as const;
  const fixture = makeFixture({
    matches: [
      makeMatch({ id: "m1", opponentId: "opponent-1", sessionId: "session-1" }),
    ],
  });

  for (const dimension of dimensions) {
    const result = expectReady(
      await fixture.reader.getAnalysis(
        makeQuery({
          dimension,
          groupBy: dimension === "period" ? "month" : undefined,
        }),
      ),
    );
    assert.equal(result.breakdown.dimension, dimension);
    if (dimension !== "opponent" && dimension !== "session") {
      assert.equal(result.breakdown.nextCursor, null);
    }
  }
  assert.equal(fixture.projectionReadCount, dimensions.length);
});

test("paginates opponent rows in stable order and binds cursors to the full query", async () => {
  const fixture = makeFixture({
    matches: [
      makeMatch({ id: "m1", opponentId: "z-user", gameType: "yonma" }),
      makeMatch({ id: "m2", opponentId: "a-user", gameType: "yonma" }),
      makeMatch({ id: "m3", opponentId: "b-user", gameType: "sanma" }),
    ],
  });
  const query = makeQuery({ dimension: "opponent", limit: 1 });
  const first = expectReady(await fixture.reader.getAnalysis(query));
  assert.equal(first.breakdown.dimension, "opponent");
  if (first.breakdown.dimension !== "opponent")
    assert.fail("expected opponents");
  assert.equal(first.breakdown.rows.length, 1);
  assert.equal(first.breakdown.rows[0]?.userId, asOpaqueId("b-user"));
  assert.ok(first.breakdown.nextCursor);
  assert.ok(!first.breakdown.nextCursor.includes("target-1"));

  const second = expectReady(
    await fixture.reader.getAnalysis({
      ...query,
      cursor: first.breakdown.nextCursor,
    }),
  );
  if (second.breakdown.dimension !== "opponent")
    assert.fail("expected opponents");
  assert.deepEqual(
    second.breakdown.rows.map(({ userId }) => userId),
    [asOpaqueId("a-user")],
  );
  assert.ok(second.breakdown.nextCursor);

  const third = expectReady(
    await fixture.reader.getAnalysis({
      ...query,
      cursor: second.breakdown.nextCursor ?? undefined,
    }),
  );
  if (third.breakdown.dimension !== "opponent")
    assert.fail("expected opponents");
  assert.deepEqual(
    third.breakdown.rows.map(({ userId }) => userId),
    [asOpaqueId("z-user")],
  );
  assert.equal(third.breakdown.nextCursor, null);

  await assert.rejects(
    fixture.reader.getAnalysis({
      ...query,
      gameType: "sanma",
      cursor: first.breakdown.nextCursor,
    }),
    /cursor does not match query/,
  );
  await assert.rejects(
    fixture.reader.getAnalysis({
      ...query,
      dimension: "session",
      cursor: first.breakdown.nextCursor,
    }),
    /cursor does not match query/,
  );
  await assert.rejects(
    fixture.reader.getAnalysis({
      ...query,
      targetUserId: otherUserId,
      cursor: first.breakdown.nextCursor,
    }),
    /cursor does not match query/,
  );
  await assert.rejects(
    fixture.reader.getAnalysis(
      makeQuery({
        ...query,
        scopeType: "league",
        leagueId,
        cursor: first.breakdown.nextCursor,
      }),
    ),
    /cursor does not match query/,
  );
  await assert.rejects(
    fixture.reader.getAnalysis({
      ...query,
      from: asIsoDateString("2026-09-01T00:00:00.000Z"),
      cursor: first.breakdown.nextCursor,
    }),
    /cursor does not match query/,
  );
});

test("defaults opponent/session breakdown pages to twenty rows", async () => {
  const fixture = makeFixture({
    matches: Array.from({ length: 21 }, (_, index) =>
      makeMatch({
        id: `default-page-${index}`,
        opponentId: `opponent-${String(index).padStart(2, "0")}`,
      }),
    ),
  });
  const result = expectReady(
    await fixture.reader.getAnalysis(makeQuery({ dimension: "opponent" })),
  );

  if (result.breakdown.dimension !== "opponent") {
    assert.fail("expected an opponent breakdown");
  }
  assert.equal(result.breakdown.rows.length, 20);
  assert.ok(result.breakdown.nextCursor);
});

test("paginates session rows and returns empty only after a ready projection query", async () => {
  const fixture = makeFixture({
    matches: [
      makeMatch({ id: "m2", sessionId: "session-b" }),
      makeMatch({ id: "m1", sessionId: "session-a" }),
    ],
  });
  const query = makeQuery({ dimension: "session", limit: 1 });
  const first = expectReady(await fixture.reader.getAnalysis(query));
  assert.equal(first.status, "ready");
  if (first.breakdown.dimension !== "session") assert.fail("expected sessions");
  assert.equal(first.breakdown.rows[0]?.sessionId, asOpaqueId("session-a"));
  assert.ok(first.breakdown.nextCursor);

  const second = expectReady(
    await fixture.reader.getAnalysis({
      ...query,
      cursor: first.breakdown.nextCursor,
    }),
  );
  if (second.breakdown.dimension !== "session")
    assert.fail("expected sessions");
  assert.equal(second.breakdown.rows[0]?.sessionId, asOpaqueId("session-b"));
  assert.equal(second.breakdown.nextCursor, null);

  const empty = makeFixture();
  const emptyResult = expectReady(
    await empty.reader.getAnalysis(makeQuery({ dimension: "weekday" })),
  );
  assert.equal(emptyResult.status, "empty");
  assert.deepEqual(emptyResult.progression, []);
  assert.deepEqual(emptyResult.breakdown.rows, []);
  assert.equal(emptyResult.breakdown.nextCursor, null);
});
