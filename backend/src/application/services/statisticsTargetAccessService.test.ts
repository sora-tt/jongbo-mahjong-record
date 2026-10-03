import assert from "node:assert/strict";
import test from "node:test";
import { NotFoundError } from "@/domain/shared/errors.js";
import { asOpaqueId } from "@/domain/shared/types.js";
import { StatisticsTargetAccessError } from "@/domain/statistics/errors.js";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import { StatisticsTargetAccessService } from "@/application/services/statisticsTargetAccessService.js";

const makeService = (options?: {
  leagueAreMembers?: (...args: string[]) => Promise<boolean>;
  seasonAreMembers?: (...args: string[]) => Promise<boolean>;
  leagueExists?: (...args: string[]) => Promise<boolean>;
  seasonExists?: (...args: string[]) => Promise<boolean>;
}) => {
  const leagueCalls: string[][] = [];
  const seasonCalls: string[][] = [];
  const leagueExistsCalls: string[][] = [];
  const seasonExistsCalls: string[][] = [];
  const events: string[] = [];
  const leagueRepository = {
    exists: async (...args: string[]) => {
      events.push("leagueExists");
      leagueExistsCalls.push(args);
      return options?.leagueExists?.(...args) ?? true;
    },
    areMembers: async (...args: string[]) => {
      events.push("leagueAreMembers");
      leagueCalls.push(args);
      return options?.leagueAreMembers?.(...args) ?? true;
    },
  } as unknown as LeagueRepository;
  const seasonRepository = {
    exists: async (...args: string[]) => {
      events.push("seasonExists");
      seasonExistsCalls.push(args);
      return options?.seasonExists?.(...args) ?? true;
    },
    areMembers: async (...args: string[]) => {
      events.push("seasonAreMembers");
      seasonCalls.push(args);
      return options?.seasonAreMembers?.(...args) ?? true;
    },
  } as unknown as SeasonRepository;

  return {
    service: new StatisticsTargetAccessService(
      leagueRepository,
      seasonRepository,
    ),
    events,
    leagueCalls,
    seasonCalls,
    leagueExistsCalls,
    seasonExistsCalls,
  };
};

test("allows self access without reading membership repositories", async () => {
  const { service, leagueCalls, seasonCalls } = makeService();

  await assert.doesNotReject(
    service.assertAllowed({
      scopeType: "overall",
      viewerUserId: asOpaqueId("u1"),
      targetUserId: asOpaqueId("u1"),
    }),
  );

  assert.deepEqual(leagueCalls, []);
  assert.deepEqual(seasonCalls, []);
});

test("rejects another target in overall scope without reading memberships", async () => {
  const { service, leagueCalls, seasonCalls } = makeService();

  await assert.rejects(
    service.assertAllowed({
      scopeType: "overall",
      viewerUserId: asOpaqueId("u1"),
      targetUserId: asOpaqueId("u2"),
    }),
    (error: unknown) =>
      error instanceof StatisticsTargetAccessError && error.status === 403,
  );

  assert.deepEqual(leagueCalls, []);
  assert.deepEqual(seasonCalls, []);
});

test("allows another target when both are league members", async () => {
  const { service, leagueCalls, seasonCalls, leagueExistsCalls } =
    makeService();

  await service.assertAllowed({
    scopeType: "league",
    leagueId: asOpaqueId("league-1"),
    viewerUserId: asOpaqueId("u1"),
    targetUserId: asOpaqueId("u2"),
  });

  assert.deepEqual(leagueCalls, [["league-1", "u1", "u2"]]);
  assert.deepEqual(seasonCalls, []);
  assert.deepEqual(leagueExistsCalls, []);
});

test("rejects another target when either user is outside the league", async () => {
  const { service, leagueCalls, seasonCalls, leagueExistsCalls } = makeService({
    leagueAreMembers: async () => false,
  });

  await assert.rejects(
    service.assertAllowed({
      scopeType: "league",
      leagueId: asOpaqueId("league-1"),
      viewerUserId: asOpaqueId("u1"),
      targetUserId: asOpaqueId("u2"),
    }),
    (error: unknown) =>
      error instanceof StatisticsTargetAccessError && error.status === 403,
  );

  assert.deepEqual(leagueCalls, [["league-1", "u1", "u2"]]);
  assert.deepEqual(seasonCalls, []);
  assert.deepEqual(leagueExistsCalls, [["league-1"]]);
});

test("allows another target when both are season members", async () => {
  const { service, leagueCalls, seasonCalls, seasonExistsCalls } =
    makeService();

  await service.assertAllowed({
    scopeType: "season",
    leagueId: asOpaqueId("league-1"),
    seasonId: asOpaqueId("season-1"),
    viewerUserId: asOpaqueId("u1"),
    targetUserId: asOpaqueId("u2"),
  });

  assert.deepEqual(leagueCalls, []);
  assert.deepEqual(seasonCalls, [["league-1", "season-1", "u1", "u2"]]);
  assert.deepEqual(seasonExistsCalls, []);
});

test("rejects another target when either user is outside the season", async () => {
  const { service, leagueCalls, seasonCalls, seasonExistsCalls } = makeService({
    seasonAreMembers: async () => false,
  });

  await assert.rejects(
    service.assertAllowed({
      scopeType: "season",
      leagueId: asOpaqueId("league-1"),
      seasonId: asOpaqueId("season-1"),
      viewerUserId: asOpaqueId("u1"),
      targetUserId: asOpaqueId("u2"),
    }),
    (error: unknown) =>
      error instanceof StatisticsTargetAccessError && error.status === 403,
  );

  assert.deepEqual(leagueCalls, []);
  assert.deepEqual(seasonCalls, [["league-1", "season-1", "u1", "u2"]]);
  assert.deepEqual(seasonExistsCalls, [["league-1", "season-1"]]);
});

test("returns 404 for a missing league before treating membership as forbidden", async () => {
  const { service, events } = makeService({
    leagueAreMembers: async () => false,
    leagueExists: async () => false,
  });

  await assert.rejects(
    service.assertAllowed({
      scopeType: "league",
      leagueId: asOpaqueId("missing-league"),
      viewerUserId: asOpaqueId("u1"),
      targetUserId: asOpaqueId("u2"),
    }),
    NotFoundError,
  );
  assert.deepEqual(events, ["leagueAreMembers", "leagueExists"]);
});

test("returns 404 for a missing season before treating membership as forbidden", async () => {
  const { service, events } = makeService({
    seasonAreMembers: async () => false,
    seasonExists: async () => false,
  });

  await assert.rejects(
    service.assertAllowed({
      scopeType: "season",
      leagueId: asOpaqueId("league-1"),
      seasonId: asOpaqueId("missing-season"),
      viewerUserId: asOpaqueId("u1"),
      targetUserId: asOpaqueId("u2"),
    }),
    NotFoundError,
  );
  assert.deepEqual(events, ["seasonAreMembers", "seasonExists"]);
});
