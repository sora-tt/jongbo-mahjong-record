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
  } = {},
) => {
  const events: string[] = [];
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
    list: async () => [{ id: seasonId, name: season.name, status: "active" }],
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
    markScopesUncomputed: async (scopes: Array<{ scopeType: string }>) => {
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
    deleteMissingScopeStats: async () => undefined,
    deleteStatsForLeague: async () => undefined,
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
