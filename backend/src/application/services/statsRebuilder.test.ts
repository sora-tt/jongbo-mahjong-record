import assert from "node:assert/strict";
import test from "node:test";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { Match } from "@/domain/match/types.js";
import type { MatchRepository } from "@/domain/match/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type { SessionRepository } from "@/domain/session/repository.js";
import type { UserMatchStatisticsRepository } from "@/domain/statistics/repository.js";
import type { UserMatchStatistics } from "@/domain/statistics/types.js";
import type { UserStatsRepository } from "@/domain/user/repository.js";
import { StatsRebuilder } from "@/application/services/statsRebuilder.js";
import { asIsoDateString, asOpaqueId } from "@/domain/shared/types.js";

const members = [
  { userId: asOpaqueId("user-1"), userName: "一郎" },
  { userId: asOpaqueId("user-2"), userName: "二郎" },
  { userId: asOpaqueId("user-3"), userName: "三郎" },
  { userId: asOpaqueId("user-4"), userName: "四郎" },
];

const leagueId = asOpaqueId("league-1");
const seasonId = asOpaqueId("season-1");
const sessionId = asOpaqueId("session-1");
const playedAt = asIsoDateString("2026-01-01T00:00:00.000Z");
const match: Match = {
  id: asOpaqueId("match-1"),
  leagueId,
  seasonId,
  sessionId,
  matchIndex: 1,
  playedAt,
  results: members.map((member, index) => ({
    ...member,
    wind: (["east", "south", "west", "north"] as const)[index]!,
    rank: index + 1,
    rawScore: 40000 - index * 10000,
    point: [30, 10, -10, -30][index]!,
  })),
  chomboEvents: [],
  offTableKyotakuCount: 0,
  createdAt: playedAt,
  updatedAt: playedAt,
};

const scopeKey = (scopeType: string, userId: string) =>
  `${scopeType}:${userId}`;

const makeFixture = (
  options: {
    matches?: Match[];
    failProjection?: boolean;
    failSeasonRollup?: boolean;
    failPublishScope?: string;
    seasonIds?: string[];
  } = {},
) => {
  const events: string[] = [];
  const invalidatedScopes: Array<{
    scopeType: string;
    leagueId: string | null;
    seasonId: string | null;
  }> = [];
  const scopeVersions = new Map<string, number>(
    ["season", "league", "overall"].flatMap((scopeType) =>
      members.map((member) => [scopeKey(scopeType, member.userId), 1] as const),
    ),
  );
  const published: Array<{
    scopeType: string;
    userId: string;
    version: number | undefined;
    snapshot: unknown;
  }> = [];
  let projectionRows: Array<Omit<UserMatchStatistics, "id">> = [];
  let replaceCount = 0;
  let shouldFailProjection = options.failProjection ?? false;
  const shouldFailPublish = options.failPublishScope ?? null;
  let publishFailureTriggered = false;
  let delayedPublishCompleted = false;
  const matches = options.matches ?? [match];
  const rule = {
    gameType: "yonma" as const,
    uma: {
      mode: "fixed" as const,
      first: 20,
      second: 10,
      third: -10,
      fourth: -20,
    },
    oka: { startingPoints: 25000, returnPoints: 30000 },
    chomboPenaltyPoints: 0,
    allowOffTableKyotaku: false,
  };
  const session = {
    id: sessionId,
    leagueId,
    seasonId,
    startedAt: playedAt,
    endedAt: null,
    members,
    memberCount: members.length,
    totalMatchCount: matches.length,
    tableLabel: "卓1",
    createdBy: members[0]!.userId,
    createdAt: playedAt,
    updatedAt: playedAt,
  };
  const season = {
    id: seasonId,
    leagueId,
    name: "冬季シーズン",
    status: "active" as const,
    memberCount: members.length,
    totalMatchCount: matches.length,
    members,
    standings: [],
    pointProgressions: [],
    seasonRecords: null,
    latestPlayedAt: playedAt,
    createdAt: playedAt,
    updatedAt: playedAt,
  };
  const league = {
    id: leagueId,
    name: "テストリーグ",
    rule,
    memberCount: members.length,
    totalMatchCount: matches.length,
    activeSeason: { id: seasonId, name: season.name },
    members: members.map((member, index) => ({
      ...member,
      id: asOpaqueId(`member-${index}`),
    })),
    leagueRecords: null,
    createdAt: playedAt,
    updatedAt: playedAt,
  };

  const leagueRepository = {
    get: async () => league,
    getRule: async () => rule,
    list: async () => [{ id: seasonId, name: season.name, status: "active" }],
    listAllMembers: async () => members,
    setActiveSeason: async () => undefined,
    updateLeagueStatistics: async () => {
      events.push("rollup:league");
    },
  } as unknown as LeagueRepository;
  const seasonRepository = {
    get: async () => season,
    list: async () =>
      (options.seasonIds ?? [seasonId]).map((id, index) => ({
        id: asOpaqueId(id),
        name: index === 0 ? season.name : `シーズン${index + 1}`,
        status: index === 0 ? ("active" as const) : ("archived" as const),
      })),
    updateStatistics: async () => {
      events.push("rollup:season");
      if (options.failSeasonRollup) throw new Error("season rollup failed");
    },
  } as unknown as SeasonRepository;
  const sessionRepository = {
    list: async () => [session],
    get: async () => session,
    setTotalMatchCount: async () => {
      events.push("rollup:session");
    },
  } as unknown as SessionRepository;
  const matchRepository = {
    list: async () => matches,
    listBySeason: async () => matches,
    listByLeague: async () => matches,
    listAll: async () => matches,
  } as unknown as MatchRepository;
  const userStatsRepository = {
    markScopesUncomputed: async (
      scopes: Array<{
        scopeType: string;
        leagueId: string | null;
        seasonId: string | null;
      }>,
    ) => {
      invalidatedScopes.push(...structuredClone(scopes));
      scopes.forEach((scope) => {
        events.push(`invalidate:${scope.scopeType}`);
        members.forEach((member) => {
          scopeVersions.set(scopeKey(scope.scopeType, member.userId), 0);
        });
      });
    },
    upsert: async (
      key: { scopeType: string; userId: string },
      data: {
        personalStatisticsVersion?: number;
        personalStatisticsSnapshot?: unknown;
      },
    ) => {
      const version = data.personalStatisticsVersion;
      if (shouldFailPublish === key.scopeType && version === 1) {
        if (!publishFailureTriggered && key.userId === members[0]!.userId) {
          publishFailureTriggered = true;
          await Promise.resolve();
          throw new Error("snapshot publication failed");
        }
        if (
          publishFailureTriggered &&
          !delayedPublishCompleted &&
          key.userId === members[1]!.userId
        ) {
          await new Promise<void>((resolve) => setTimeout(resolve, 25));
          delayedPublishCompleted = true;
        }
      }
      scopeVersions.set(scopeKey(key.scopeType, key.userId), version ?? 0);
      published.push({
        scopeType: key.scopeType,
        userId: key.userId,
        version,
        snapshot: data.personalStatisticsSnapshot,
      });
      if (version === 1) events.push(`publish:${key.scopeType}`);
      return `${key.scopeType}_${key.userId}`;
    },
    deleteMissingScopeStats: async (params: {
      scopeType: string;
      leagueId: string | null;
      seasonId: string | null;
    }) => {
      events.push(
        `delete-stats:${params.scopeType}:${params.leagueId ?? "-"}:${params.seasonId ?? "-"}`,
      );
    },
    deleteStatsForLeague: async (targetLeagueId: string) => {
      events.push(`delete-stats:league:${targetLeagueId}`);
    },
    get: async () => null,
    getWithPersonalStatistics: async () => null,
  } as unknown as UserStatsRepository;
  const userMatchStatisticsRepository = {
    replaceSeason: async (input: {
      rows: Array<Omit<UserMatchStatistics, "id">>;
    }) => {
      events.push("projection");
      replaceCount += 1;
      if (shouldFailProjection) throw new Error("projection failed");
      projectionRows = input.rows;
    },
    deleteSeason: async (targetLeagueId: string, targetSeasonId: string) => {
      events.push(
        `delete-projection:season:${targetLeagueId}:${targetSeasonId}`,
      );
      projectionRows = projectionRows.filter(
        (row) =>
          row.leagueId !== targetLeagueId || row.seasonId !== targetSeasonId,
      );
    },
    deleteLeague: async (targetLeagueId: string) => {
      events.push(`delete-projection:league:${targetLeagueId}`);
      projectionRows = projectionRows.filter(
        (row) => row.leagueId !== targetLeagueId,
      );
    },
    listForScope: async (query: {
      scopeType: string;
      userId: string;
      leagueId?: string;
      seasonId?: string;
    }) =>
      projectionRows.filter(
        (row) =>
          row.userId === query.userId &&
          (query.scopeType === "overall" || row.leagueId === query.leagueId) &&
          (query.scopeType !== "season" || row.seasonId === query.seasonId),
      ),
  } as unknown as UserMatchStatisticsRepository;
  const rebuilder = new StatsRebuilder(
    leagueRepository,
    seasonRepository,
    sessionRepository,
    matchRepository,
    userStatsRepository,
    userMatchStatisticsRepository,
  );

  return {
    rebuilder,
    events,
    invalidatedScopes,
    scopeVersions,
    published,
    get projectionRows() {
      return projectionRows;
    },
    get replaceCount() {
      return replaceCount;
    },
    getScopeVersions(scopeType: string) {
      return [...scopeVersions]
        .filter(([key]) => key.startsWith(`${scopeType}:`))
        .map(([, version]) => version);
    },
    allowProjectionRetry() {
      shouldFailProjection = false;
    },
  };
};

test("clears season and league projections together with their saved scopes", async () => {
  const fixture = makeFixture();

  await fixture.rebuilder.clearSeasonStats(leagueId, seasonId);
  await fixture.rebuilder.clearLeagueStats(leagueId);

  assert.deepEqual(fixture.events, [
    `delete-projection:season:${leagueId}:${seasonId}`,
    `delete-stats:season:${leagueId}:${seasonId}`,
    `delete-projection:league:${leagueId}`,
    `delete-stats:league:${leagueId}`,
  ]);
});

test("prepares season deletion by invalidating its season and parent scopes", async () => {
  const fixture = makeFixture();

  await fixture.rebuilder.prepareSeasonDeletion(leagueId, seasonId);

  assert.deepEqual(fixture.invalidatedScopes, [
    { scopeType: "season", leagueId, seasonId },
    { scopeType: "league", leagueId, seasonId: null },
    { scopeType: "overall", leagueId: null, seasonId: null },
  ]);
});

test("prepares league deletion by invalidating all seasons and parent scopes", async () => {
  const secondSeasonId = asOpaqueId("season-2");
  const fixture = makeFixture({ seasonIds: [seasonId, secondSeasonId] });

  await fixture.rebuilder.prepareLeagueDeletion(leagueId);

  assert.deepEqual(fixture.invalidatedScopes, [
    { scopeType: "season", leagueId, seasonId },
    { scopeType: "season", leagueId, seasonId: secondSeasonId },
    { scopeType: "league", leagueId, seasonId: null },
    { scopeType: "overall", leagueId: null, seasonId: null },
  ]);
});

test("invalidates every affected scope before ordered projections and publishes snapshots in dependency order", async () => {
  const laterMatch: Match = {
    ...match,
    id: asOpaqueId("match-later"),
    matchIndex: 2,
    playedAt: asIsoDateString("2026-01-01T00:02:00.000Z"),
  };
  const earlierMatch: Match = {
    ...match,
    id: asOpaqueId("match-earlier"),
    matchIndex: 1,
    playedAt: asIsoDateString("2026-01-01T00:01:00.000Z"),
  };
  const fixture = makeFixture({ matches: [laterMatch, earlierMatch] });

  await fixture.rebuilder.rebuildSeason(leagueId, seasonId);

  const projectionIndex = fixture.events.indexOf("projection");
  assert.deepEqual(
    fixture.events.slice(0, projectionIndex).sort(),
    ["invalidate:season", "invalidate:league", "invalidate:overall"].sort(),
  );
  assert.ok(projectionIndex >= 3);
  assert.ok(
    fixture.events.indexOf("rollup:season") <
      fixture.events.indexOf("rollup:league"),
  );
  assert.ok(
    fixture.events.indexOf("rollup:season") <
      fixture.events.indexOf("publish:season"),
  );
  assert.ok(
    fixture.events.indexOf("publish:season") <
      fixture.events.indexOf("rollup:league"),
  );
  assert.ok(
    fixture.events.indexOf("rollup:league") <
      fixture.events.indexOf("publish:league"),
  );
  assert.ok(
    fixture.events.indexOf("publish:league") <
      fixture.events.indexOf("publish:overall"),
  );
  assert.equal(fixture.projectionRows.length, 8);
  assert.deepEqual(
    fixture.projectionRows
      .filter((row) => row.userId === members[0]!.userId)
      .map((row) => row.matchId),
    [earlierMatch.id, laterMatch.id],
  );
  assert.ok(
    ["season", "league", "overall"].every((scopeType) =>
      fixture.getScopeVersions(scopeType).every((version) => version === 1),
    ),
  );
  assert.equal(fixture.published.length, 12);
  assert.ok(
    fixture.published.every((row) => row.version === 1 && row.snapshot),
  );
});

test("projection failure keeps all affected scopes uncomputed and can converge on retry", async () => {
  const fixture = makeFixture({ failProjection: true });

  await assert.rejects(fixture.rebuilder.rebuildSeason(leagueId, seasonId));

  assert.ok(
    ["season", "league", "overall"].every((scopeType) =>
      fixture.getScopeVersions(scopeType).every((version) => version === 0),
    ),
  );
  assert.equal(fixture.published.length, 0);

  fixture.allowProjectionRetry();
  await fixture.rebuilder.rebuildSeason(leagueId, seasonId);
  const projectionRowsAfterFirstRetry = fixture.projectionRows;
  const snapshotAfterFirstRetry = fixture.published.find(
    (row) => row.scopeType === "season" && row.userId === members[0]!.userId,
  )?.snapshot;
  await fixture.rebuilder.rebuildSeason(leagueId, seasonId);
  assert.equal(fixture.replaceCount, 3);
  assert.equal(fixture.projectionRows.length, 4);
  assert.deepEqual(fixture.projectionRows, projectionRowsAfterFirstRetry);
  assert.deepEqual(
    fixture.published.filter(
      (row) => row.scopeType === "season" && row.userId === members[0]!.userId,
    )[1]?.snapshot,
    snapshotAfterFirstRetry,
  );
  assert.ok(
    ["season", "league", "overall"].every((scopeType) =>
      fixture.getScopeVersions(scopeType).every((version) => version === 1),
    ),
  );
});

test("rollup failure does not publish a ready snapshot for any dependent scope", async () => {
  const fixture = makeFixture({ failSeasonRollup: true });

  await assert.rejects(
    fixture.rebuilder.rebuildSeason(leagueId, seasonId),
    /season rollup failed/,
  );

  assert.ok(fixture.events.indexOf("projection") >= 3);
  assert.ok(
    ["season", "league", "overall"].every((scopeType) =>
      fixture.getScopeVersions(scopeType).every((version) => version === 0),
    ),
  );
  assert.equal(fixture.published.length, 0);
});

test("snapshot publication failure resets the failed scope after all writes settle and retry readies all scopes", async () => {
  const fixture = makeFixture({ failPublishScope: "league" });

  await assert.rejects(
    fixture.rebuilder.rebuildSeason(leagueId, seasonId),
    /snapshot publication failed/,
  );
  await new Promise<void>((resolve) => setTimeout(resolve, 35));

  assert.ok(
    fixture.getScopeVersions("season").every((version) => version === 1),
  );
  assert.ok(
    fixture.getScopeVersions("league").every((version) => version === 0),
  );
  assert.ok(
    fixture.getScopeVersions("overall").every((version) => version === 0),
  );

  await fixture.rebuilder.rebuildSeason(leagueId, seasonId);
  assert.ok(
    ["season", "league", "overall"].every((scopeType) =>
      fixture.getScopeVersions(scopeType).every((version) => version === 1),
    ),
  );
});

test("publishes a ready empty snapshot for current members when the season has no matches", async () => {
  const fixture = makeFixture({ matches: [] });

  await fixture.rebuilder.rebuildSeason(leagueId, seasonId);

  assert.equal(fixture.projectionRows.length, 0);
  assert.ok(
    ["season", "league", "overall"].every((scopeType) =>
      fixture.getScopeVersions(scopeType).every((version) => version === 1),
    ),
  );
  assert.equal(fixture.published.length, members.length * 3);
  assert.ok(
    fixture.published.every((row) => row.version === 1 && row.snapshot),
  );
});

const bulkLeagueId = asOpaqueId("bulk-league");
const bulkSecondLeagueId = asOpaqueId("bulk-league-second");
const bulkLeagueIds = [bulkLeagueId, bulkSecondLeagueId] as const;
const bulkSeasonIds = [
  asOpaqueId("bulk-season-1"),
  asOpaqueId("bulk-season-empty"),
] as const;
const bulkSessionIds = [
  asOpaqueId("bulk-session-1"),
  asOpaqueId("bulk-session-empty"),
] as const;

const makeBulkFixture = (
  options: {
    failProjectionSeasonId?: string;
    failSeasonRollupId?: string;
    failLeagueRollupId?: string;
  } = {},
) => {
  const events: string[] = [];
  const initialScopeMembers = [
    {
      scopeType: "season",
      leagueId: bulkLeagueIds[0],
      seasonId: bulkSeasonIds[0],
      members,
    },
    {
      scopeType: "season",
      leagueId: bulkLeagueIds[1],
      seasonId: bulkSeasonIds[1],
      members: [],
    },
    {
      scopeType: "league",
      leagueId: bulkLeagueIds[0],
      seasonId: null,
      members,
    },
    {
      scopeType: "league",
      leagueId: bulkLeagueIds[1],
      seasonId: null,
      members,
    },
    { scopeType: "overall", leagueId: null, seasonId: null, members },
  ];
  const scopeKey = (
    scopeType: string,
    league: string | null,
    season: string | null,
    userId: string,
  ) => `${scopeType}:${league ?? "-"}:${season ?? "-"}:${userId}`;
  const scopeVersions = new Map<string, number>(
    initialScopeMembers.flatMap(
      ({
        scopeType,
        leagueId: targetLeagueId,
        seasonId: targetSeason,
        members: scopeMembers,
      }) =>
        scopeMembers.map(
          (member) =>
            [
              scopeKey(scopeType, targetLeagueId, targetSeason, member.userId),
              1,
            ] as const,
        ),
    ),
  );
  const publishedSnapshots = new Map<string, unknown>();
  const projectionRowsBySeason = new Map<
    string,
    Array<Omit<UserMatchStatistics, "id">>
  >();
  const sessionCounts = new Map<string, number>();
  const sessions = bulkSeasonIds.map((targetSeason, index) => ({
    id: bulkSessionIds[index]!,
    leagueId: bulkLeagueIds[index]!,
    seasonId: targetSeason,
    startedAt: playedAt,
    endedAt: null,
    members: index === 0 ? members : [],
    memberCount: index === 0 ? members.length : 0,
    totalMatchCount: index === 0 ? 1 : 0,
    tableLabel: `卓${index + 1}`,
    createdBy: members[0]!.userId,
    createdAt: playedAt,
    updatedAt: playedAt,
  }));
  const seasons = bulkSeasonIds.map((targetSeason, index) => ({
    id: targetSeason,
    leagueId: bulkLeagueIds[index]!,
    name: index === 0 ? "通常シーズン" : "空のシーズン",
    status: index === 0 ? ("active" as const) : ("archived" as const),
    memberCount: index === 0 ? members.length : 0,
    totalMatchCount: index === 0 ? 1 : 0,
    members: index === 0 ? members : [],
    standings: [],
    pointProgressions: [],
    seasonRecords: null,
    latestPlayedAt: index === 0 ? playedAt : null,
    createdAt: playedAt,
    updatedAt: playedAt,
  }));
  const leagues = bulkLeagueIds.map((id, index) => ({
    id,
    name: `一括repairリーグ${index + 1}`,
    rule: {
      gameType: "yonma" as const,
      uma: {
        mode: "fixed" as const,
        first: 20,
        second: 10,
        third: -10,
        fourth: -20,
      },
      oka: { startingPoints: 25000, returnPoints: 30000 },
      chomboPenaltyPoints: 0,
      allowOffTableKyotaku: false,
    },
    memberCount: members.length,
    totalMatchCount: index === 0 ? 1 : 0,
    activeSeason:
      index === 0 ? { id: bulkSeasonIds[0], name: seasons[0]!.name } : null,
    members: members.map((member, index) => ({
      ...member,
      id: asOpaqueId(`bulk-member-${index}`),
    })),
    leagueRecords: null,
    createdAt: playedAt,
    updatedAt: playedAt,
  }));
  const bulkMatch: Match = {
    ...match,
    id: asOpaqueId("bulk-match-1"),
    leagueId: bulkLeagueId,
    seasonId: bulkSeasonIds[0],
    sessionId: bulkSessionIds[0],
  };
  const matchesBySeason = new Map<string, Match[]>([
    [`${bulkLeagueIds[0]}:${bulkSeasonIds[0]}`, [bulkMatch]],
    [`${bulkLeagueIds[1]}:${bulkSeasonIds[1]}`, []],
  ]);

  const leagueRepository = {
    list: async () =>
      leagues.map((league) => ({
        id: league.id,
        name: league.name,
        memberCount: members.length,
        totalMatchCount: league.totalMatchCount,
        activeSeason: league.activeSeason,
        myStanding: null,
        createdAt: playedAt,
        updatedAt: playedAt,
      })),
    get: async (targetLeagueId: string) =>
      leagues.find(({ id }) => id === targetLeagueId),
    getRule: async (targetLeagueId: string) =>
      leagues.find(({ id }) => id === targetLeagueId)?.rule,
    listAllMembers: async () => members,
    setActiveSeason: async () => undefined,
    updateLeagueStatistics: async ({
      leagueId: targetLeagueId,
    }: {
      leagueId: string;
    }) => {
      events.push(`rollup:league:${targetLeagueId}`);
      if (options.failLeagueRollupId === targetLeagueId) {
        throw new Error(`league rollup failed: ${targetLeagueId}`);
      }
    },
  } as unknown as LeagueRepository;
  const seasonRepository = {
    list: async (targetLeagueId: string) =>
      seasons
        .filter(({ leagueId }) => leagueId === targetLeagueId)
        .map(({ id, name, status, leagueId }) => ({
          id,
          leagueId,
          name,
          status,
          memberCount: id === bulkSeasonIds[0] ? members.length : 0,
          totalMatchCount: id === bulkSeasonIds[0] ? 1 : 0,
          createdAt: playedAt,
          updatedAt: playedAt,
        })),
    get: async (targetLeagueId: string, targetSeasonId: string) =>
      seasons.find(
        ({ id, leagueId }) =>
          id === targetSeasonId && leagueId === targetLeagueId,
      ),
    updateStatistics: async ({
      seasonId: targetSeasonId,
    }: {
      seasonId: string;
    }) => {
      events.push(`rollup:season:${targetSeasonId}`);
      if (options.failSeasonRollupId === targetSeasonId) {
        throw new Error(`season rollup failed: ${targetSeasonId}`);
      }
    },
  } as unknown as SeasonRepository;
  const sessionRepository = {
    list: async (targetLeagueId: string, targetSeasonId: string) =>
      sessions.filter(
        (session) =>
          session.leagueId === targetLeagueId &&
          session.seasonId === targetSeasonId,
      ),
    setTotalMatchCount: async (
      _leagueId: string,
      _seasonId: string,
      targetSessionId: string,
      totalMatchCount: number,
    ) => {
      events.push(`session-count:${targetSessionId}`);
      sessionCounts.set(targetSessionId, totalMatchCount);
    },
  } as unknown as SessionRepository;
  const matchRepository = {
    list: async (targetLeagueId: string, targetSeasonId: string) =>
      matchesBySeason.get(`${targetLeagueId}:${targetSeasonId}`) ?? [],
    listBySeason: async (targetLeagueId: string, targetSeasonId: string) =>
      matchesBySeason.get(`${targetLeagueId}:${targetSeasonId}`) ?? [],
    listByLeague: async (targetLeagueId: string) =>
      seasons
        .filter(({ leagueId }) => leagueId === targetLeagueId)
        .flatMap(
          ({ id }) => matchesBySeason.get(`${targetLeagueId}:${id}`) ?? [],
        ),
    listAll: async () => [...matchesBySeason.values()].flat(),
  } as unknown as MatchRepository;
  const userStatsRepository = {
    markScopesUncomputed: async (
      scopes: Array<{
        scopeType: string;
        leagueId: string | null;
        seasonId: string | null;
      }>,
    ) => {
      scopes.forEach(
        ({ scopeType, leagueId: targetLeagueId, seasonId: targetSeasonId }) => {
          events.push(`invalidate:${scopeType}:${targetSeasonId ?? "-"}`);
          const target = initialScopeMembers.find(
            (scope) =>
              scope.scopeType === scopeType &&
              scope.leagueId === targetLeagueId &&
              scope.seasonId === targetSeasonId,
          );
          target?.members.forEach((member) => {
            scopeVersions.set(
              scopeKey(
                scopeType,
                targetLeagueId,
                targetSeasonId,
                member.userId,
              ),
              0,
            );
          });
        },
      );
      events.push("invalidate:complete");
    },
    upsert: async (
      key: {
        scopeType: string;
        leagueId: string | null;
        seasonId: string | null;
        userId: string;
      },
      data: {
        personalStatisticsVersion?: number;
        personalStatisticsSnapshot?: unknown;
      },
    ) => {
      scopeVersions.set(
        scopeKey(key.scopeType, key.leagueId, key.seasonId, key.userId),
        data.personalStatisticsVersion ?? 0,
      );
      if (data.personalStatisticsVersion === 1) {
        const snapshotKey = scopeKey(
          key.scopeType,
          key.leagueId,
          key.seasonId,
          key.userId,
        );
        publishedSnapshots.set(snapshotKey, data.personalStatisticsSnapshot);
        events.push(
          `publish:${key.scopeType}:${key.leagueId ?? "-"}:${key.seasonId ?? "-"}`,
        );
      }
      return `${key.scopeType}_${key.userId}`;
    },
    deleteMissingScopeStats: async () => undefined,
  } as unknown as UserStatsRepository;
  const userMatchStatisticsRepository = {
    replaceSeason: async ({
      leagueId: targetLeagueId,
      seasonId: targetSeasonId,
      rows,
    }: {
      leagueId: string;
      seasonId: string;
      rows: Array<Omit<UserMatchStatistics, "id">>;
    }) => {
      events.push(`projection:${targetLeagueId}:${targetSeasonId}`);
      if (options.failProjectionSeasonId === targetSeasonId) {
        throw new Error(`projection failed: ${targetSeasonId}`);
      }
      projectionRowsBySeason.set(`${targetLeagueId}:${targetSeasonId}`, rows);
    },
    listForScope: async (query: {
      scopeType: string;
      userId: string;
      leagueId?: string;
      seasonId?: string;
    }) =>
      [...projectionRowsBySeason.values()]
        .flat()
        .filter(
          (row) =>
            row.userId === query.userId &&
            (query.scopeType === "overall" ||
              row.leagueId === query.leagueId) &&
            (query.scopeType !== "season" || row.seasonId === query.seasonId),
        ),
  } as unknown as UserMatchStatisticsRepository;
  const rebuilder = new StatsRebuilder(
    leagueRepository,
    seasonRepository,
    sessionRepository,
    matchRepository,
    userStatsRepository,
    userMatchStatisticsRepository,
  );

  return {
    rebuilder,
    events,
    scopeVersions,
    publishedSnapshots,
    projectionRowsBySeason,
    sessionCounts,
    scopeKey,
    initialScopeMembers,
  };
};

test("bulk repair invalidates every scope before projecting all seasons, then publishes in scope order", async () => {
  const fixture = makeBulkFixture();

  const report = await fixture.rebuilder.rebuildAll();

  const firstProjectionIndex = fixture.events.findIndex((event) =>
    event.startsWith("projection:"),
  );
  const firstRollupIndex = fixture.events.findIndex((event) =>
    event.startsWith("rollup:"),
  );
  assert.ok(
    fixture.events.indexOf("invalidate:complete") < firstProjectionIndex,
  );
  assert.ok(
    fixture.events
      .filter((event) => event.startsWith("projection:"))
      .every((_, index) => {
        const projectionIndex = fixture.events.findIndex(
          (event) =>
            event ===
            `projection:${bulkLeagueIds[index]}:${bulkSeasonIds[index]}`,
        );
        return projectionIndex < firstRollupIndex;
      }),
  );
  assert.deepEqual(
    fixture.events.filter((event) => event.startsWith("projection:")),
    bulkSeasonIds.map(
      (id, index) => `projection:${bulkLeagueIds[index]}:${id}`,
    ),
  );
  assert.ok(
    fixture.events.indexOf(`rollup:season:${bulkSeasonIds[0]}`) <
      fixture.events.indexOf(`rollup:season:${bulkSeasonIds[1]}`),
  );
  assert.ok(
    fixture.events.indexOf(`rollup:season:${bulkSeasonIds[1]}`) <
      fixture.events.indexOf(`rollup:league:${bulkLeagueIds[0]}`),
  );
  assert.ok(
    fixture.events.indexOf(`rollup:league:${bulkLeagueIds[0]}`) <
      fixture.events.indexOf(`rollup:league:${bulkLeagueIds[1]}`),
  );
  assert.ok(
    fixture.events.indexOf(`rollup:league:${bulkLeagueIds[1]}`) <
      fixture.events.indexOf("publish:overall:-:-"),
  );
  assert.equal(
    fixture.projectionRowsBySeason.get(
      `${bulkLeagueIds[0]}:${bulkSeasonIds[0]}`,
    )?.length,
    4,
  );
  assert.deepEqual(
    fixture.projectionRowsBySeason.get(
      `${bulkLeagueIds[1]}:${bulkSeasonIds[1]}`,
    ),
    [],
  );
  assert.equal(fixture.sessionCounts.get(bulkSessionIds[0]), 1);
  assert.equal(fixture.sessionCounts.get(bulkSessionIds[1]), 0);
  assert.equal(report.scope.type, "all");
  assert.equal(report.matchCount, 1);
  assert.equal(report.userCount, members.length);
  assert.equal(
    fixture.publishedSnapshots.has(
      fixture.scopeKey(
        "season",
        bulkLeagueIds[1],
        bulkSeasonIds[1],
        members[0]!.userId,
      ),
    ),
    false,
  );
  assert.ok(
    fixture.initialScopeMembers
      .filter(({ members: scopeMembers }) => scopeMembers.length > 0)
      .every(
        ({
          scopeType,
          leagueId: targetLeagueId,
          seasonId: targetSeasonId,
          members: scopeMembers,
        }) =>
          scopeMembers.every(
            (member) =>
              fixture.scopeVersions.get(
                fixture.scopeKey(
                  scopeType,
                  targetLeagueId,
                  targetSeasonId,
                  member.userId,
                ),
              ) === 1,
          ),
      ),
  );
});

test("failure while projecting a later season keeps every target scope uncomputed", async () => {
  const fixture = makeBulkFixture({
    failProjectionSeasonId: bulkSeasonIds[1],
  });

  await assert.rejects(
    fixture.rebuilder.rebuildAll(),
    new RegExp(`projection failed: ${bulkSeasonIds[1]}`),
  );

  assert.ok(fixture.events.every((event) => !event.startsWith("rollup:")));
  assert.equal(fixture.publishedSnapshots.size, 0);
  assert.ok(
    [...fixture.scopeVersions.values()].every((version) => version === 0),
  );
});

test("failure during a later league rollup leaves only completed scopes ready", async () => {
  const fixture = makeBulkFixture({
    failLeagueRollupId: bulkLeagueIds[1],
  });

  await assert.rejects(
    fixture.rebuilder.rebuildAll(),
    new RegExp(`league rollup failed: ${bulkLeagueIds[1]}`),
  );

  assert.ok(
    members.every(
      (member) =>
        fixture.scopeVersions.get(
          fixture.scopeKey(
            "season",
            bulkLeagueIds[0],
            bulkSeasonIds[0],
            member.userId,
          ),
        ) === 1,
    ),
  );
  assert.ok(
    members.every(
      (member) =>
        fixture.scopeVersions.get(
          fixture.scopeKey("league", bulkLeagueIds[0], null, member.userId),
        ) === 1 &&
        fixture.scopeVersions.get(
          fixture.scopeKey("league", bulkLeagueIds[1], null, member.userId),
        ) === 0 &&
        fixture.scopeVersions.get(
          fixture.scopeKey("overall", null, null, member.userId),
        ) === 0,
    ),
  );
  assert.ok(
    !fixture.events.includes("rollup:league") &&
      !fixture.events.includes("publish:overall:-"),
  );
});

test("retrying all repair converges to identical projections and snapshots", async () => {
  const fixture = makeBulkFixture();

  await fixture.rebuilder.rebuildAll();
  const firstProjectionState = structuredClone([
    ...fixture.projectionRowsBySeason.entries(),
  ]);
  const firstSnapshotState = structuredClone([
    ...fixture.publishedSnapshots.entries(),
  ]);
  await fixture.rebuilder.rebuildAll();

  assert.deepEqual(
    [...fixture.projectionRowsBySeason.entries()],
    firstProjectionState,
  );
  assert.deepEqual(
    [...fixture.publishedSnapshots.entries()],
    firstSnapshotState,
  );
  assert.equal(
    fixture.events.filter((event) => event.startsWith("projection:")).length,
    bulkSeasonIds.length * 2,
  );
});
