import assert from "node:assert/strict";
import test from "node:test";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type { UserMatchStatisticsRepository } from "@/domain/statistics/repository.js";
import type {
  StatisticsMatchHistoryQuery,
  StatisticsMatchItem,
  StatisticsMatchPage,
} from "@/domain/statistics/types.js";
import type { UserStatsRepository } from "@/domain/user/repository.js";
import type {
  UserStats,
  UserStatsWithPersonalStatistics,
} from "@/domain/user/types.js";
import { NotFoundError } from "@/domain/shared/errors.js";
import { asIsoDateString, asOpaqueId } from "@/domain/shared/types.js";
import { StatisticsTargetAccessError } from "@/domain/statistics/errors.js";
import { PersonalStatisticsMatchHistoryReader } from "@/application/services/personalStatisticsMatchHistoryReader.js";

const viewerUserId = asOpaqueId("viewer-1");
const targetUserId = asOpaqueId("target-1");
const leagueId = asOpaqueId("league-1");
const seasonId = asOpaqueId("season-1");
const generatedAt = asIsoDateString("2026-09-30T12:00:00.000Z");
const repositoryGeneratedAt = asIsoDateString("2026-10-01T12:00:00.000Z");

const makeItem = (matchId = "match-1"): StatisticsMatchItem => ({
  match: {
    matchId: asOpaqueId(matchId),
    leagueId,
    leagueName: "リーグ",
    seasonId,
    seasonName: "シーズン",
    sessionId: asOpaqueId("session-1"),
    sessionLabel: "第1節",
    playedAt: asIsoDateString("2026-09-20T12:00:00.000Z"),
  },
  gameType: "yonma",
  wind: "east",
  rank: 1,
  rawScore: 45_000,
  finalPoint: 55,
  opponents: [],
});

const makeStatsRecord = (version = 1): UserStatsWithPersonalStatistics =>
  ({
    stats: { updatedAt: generatedAt } as UserStats,
    personalStatisticsVersion: version,
    personalStatisticsSnapshot:
      {} as UserStatsWithPersonalStatistics["personalStatisticsSnapshot"],
  }) as UserStatsWithPersonalStatistics;

const makeQuery = (
  options: Record<string, unknown> = {},
): StatisticsMatchHistoryQuery =>
  ({
    scopeType: "overall",
    viewerUserId,
    targetUserId,
    ...options,
  }) as unknown as StatisticsMatchHistoryQuery;

const makePage = (
  items: StatisticsMatchItem[],
  nextCursor: string | null = null,
): StatisticsMatchPage =>
  items.length === 0
    ? {
        status: "empty",
        scope: { scopeType: "overall" },
        generatedAt: repositoryGeneratedAt,
        timeZone: "Asia/Tokyo",
        items: [],
        nextCursor: null,
      }
    : {
        status: "ready",
        scope: { scopeType: "overall" },
        generatedAt: repositoryGeneratedAt,
        timeZone: "Asia/Tokyo",
        items,
        nextCursor,
      };

const makeFixture = (
  options: {
    statsRecord?: UserStatsWithPersonalStatistics | null;
    page?: StatisticsMatchPage;
    accessError?: Error;
    missingLeague?: boolean;
    missingSeason?: boolean;
  } = {},
) => {
  const events: string[] = [];
  let statsQuery: unknown;
  let projectionQuery: unknown;
  const access = {
    assertAllowed: async (query: unknown) => {
      events.push("access");
      void query;
      if (options.accessError) throw options.accessError;
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
  };
  const projectionRepository = {
    listPage: async (query: unknown) => {
      events.push("projection");
      projectionQuery = query;
      return options.page ?? makePage([makeItem()], "opaque-next");
    },
  };
  const leagueRepository = {
    exists: async () => {
      events.push("league");
      return !options.missingLeague;
    },
  };
  const seasonRepository = {
    exists: async () => {
      events.push("season");
      return !options.missingSeason;
    },
  };
  const reader = new PersonalStatisticsMatchHistoryReader(
    access as unknown as Pick<
      import("@/application/services/statisticsTargetAccessService.js").StatisticsTargetAccessService,
      "assertAllowed"
    >,
    userStatsRepository as unknown as Pick<
      UserStatsRepository,
      "getWithPersonalStatistics"
    >,
    projectionRepository as unknown as Pick<
      UserMatchStatisticsRepository,
      "listPage"
    >,
    leagueRepository as unknown as Pick<LeagueRepository, "exists">,
    seasonRepository as unknown as Pick<SeasonRepository, "exists">,
  );
  return {
    reader,
    events,
    getStatsQuery: () => statsQuery,
    getProjectionQuery: () => projectionQuery,
  };
};

test("checks access before any scope, stats, or projection read", async () => {
  const fixture = makeFixture({
    accessError: new StatisticsTargetAccessError(),
  });

  await assert.rejects(
    fixture.reader.getMatchHistory(makeQuery()),
    StatisticsTargetAccessError,
  );
  assert.deepEqual(fixture.events, ["access"]);
});

test("returns 404 for a missing scope before reading stats or projections", async () => {
  const fixture = makeFixture({ missingSeason: true });

  await assert.rejects(
    fixture.reader.getMatchHistory(
      makeQuery({ scopeType: "season", leagueId, seasonId }),
    ),
    NotFoundError,
  );
  assert.deepEqual(fixture.events, ["access", "season"]);
});

test("validates a scoped page limit only after confirming the scope exists", async () => {
  const fixture = makeFixture();

  await assert.rejects(
    fixture.reader.getMatchHistory(
      makeQuery({ scopeType: "league", leagueId, limit: 0 }),
    ),
    TypeError,
  );
  assert.deepEqual(fixture.events, ["access", "league"]);
});

test("returns uncomputed without reading history when the scope stats are missing", async () => {
  const fixture = makeFixture({ statsRecord: null });

  const result = await fixture.reader.getMatchHistory(makeQuery());

  assert.deepEqual(fixture.events, ["access", "stats"]);
  assert.deepEqual(result, {
    status: "uncomputed",
    scope: { scopeType: "overall" },
    generatedAt: null,
    timeZone: "Asia/Tokyo",
    items: [],
    nextCursor: null,
  });
});

test("returns uncomputed for a legacy or invalidated readiness version", async () => {
  for (const version of [0, -1]) {
    const fixture = makeFixture({ statsRecord: makeStatsRecord(version) });
    const result = await fixture.reader.getMatchHistory(makeQuery());

    assert.equal(result.status, "uncomputed");
    assert.deepEqual(fixture.events, ["access", "stats"]);
  }
});

test("defaults the page size and passes target, scope, and filters to listPage", async () => {
  const from = asIsoDateString("2026-09-01T00:00:00.000Z");
  const to = asIsoDateString("2026-10-01T00:00:00.000Z");
  const fixture = makeFixture();

  const result = await fixture.reader.getMatchHistory(
    makeQuery({
      scopeType: "season",
      leagueId,
      seasonId,
      from,
      to,
      gameType: "sanma",
    }),
  );

  assert.deepEqual(fixture.events, ["access", "season", "stats", "projection"]);
  assert.deepEqual(fixture.getStatsQuery(), {
    userId: targetUserId,
    scopeType: "season",
    leagueId,
    seasonId,
  });
  assert.deepEqual(fixture.getProjectionQuery(), {
    scopeType: "season",
    leagueId,
    seasonId,
    from,
    to,
    gameType: "sanma",
    userId: targetUserId,
    limit: 50,
  });
  assert.equal(result.status, "ready");
});

test("passes an opaque cursor and explicit maximum page size through", async () => {
  const fixture = makeFixture();
  const cursor = "opaque-query-bound-cursor";

  await fixture.reader.getMatchHistory(
    makeQuery({
      scopeType: "league",
      leagueId,
      limit: 100,
      cursor,
    }),
  );

  assert.deepEqual(fixture.getProjectionQuery(), {
    scopeType: "league",
    leagueId,
    userId: targetUserId,
    limit: 100,
    cursor,
  });
});

test("rejects invalid limits before readiness or projection reads", async () => {
  for (const limit of [0, 101, 1.5, Number.NaN, null, "50"]) {
    const fixture = makeFixture({ statsRecord: null });

    await assert.rejects(
      fixture.reader.getMatchHistory(makeQuery({ limit })),
      TypeError,
    );
    assert.deepEqual(fixture.events, ["access"]);
  }
});

test("uses UserStats updatedAt and maps a computed zero-row page to empty", async () => {
  const fixture = makeFixture({ page: makePage([]) });

  const result = await fixture.reader.getMatchHistory(makeQuery());

  assert.deepEqual(result, {
    status: "empty",
    scope: { scopeType: "overall" },
    generatedAt,
    timeZone: "Asia/Tokyo",
    items: [],
    nextCursor: null,
  });
});

test("maps a non-empty computed page to ready while preserving its cursor and recorded fields", async () => {
  const item = makeItem();
  const fixture = makeFixture({ page: makePage([item], "next-page") });

  const result = await fixture.reader.getMatchHistory(makeQuery());

  assert.equal(result.status, "ready");
  assert.equal(result.generatedAt, generatedAt);
  assert.deepEqual(result.items, [item]);
  assert.equal(result.nextCursor, "next-page");
});
