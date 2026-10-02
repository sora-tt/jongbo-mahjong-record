import assert from "node:assert/strict";
import test from "node:test";
import { asOpaqueId } from "@/domain/shared/types.js";
import { StatisticsTargetAccessError } from "@/domain/statistics/errors.js";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import { StatisticsTargetAccessService } from "@/application/services/statisticsTargetAccessService.js";

const makeService = (options?: {
  leagueAreMembers?: (...args: string[]) => Promise<boolean>;
  seasonAreMembers?: (...args: string[]) => Promise<boolean>;
}) => {
  const leagueCalls: string[][] = [];
  const seasonCalls: string[][] = [];
  const leagueRepository = {
    areMembers: async (...args: string[]) => {
      leagueCalls.push(args);
      return options?.leagueAreMembers?.(...args) ?? true;
    },
  } as unknown as LeagueRepository;
  const seasonRepository = {
    areMembers: async (...args: string[]) => {
      seasonCalls.push(args);
      return options?.seasonAreMembers?.(...args) ?? true;
    },
  } as unknown as SeasonRepository;

  return {
    service: new StatisticsTargetAccessService(
      leagueRepository,
      seasonRepository,
    ),
    leagueCalls,
    seasonCalls,
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
  const { service, leagueCalls, seasonCalls } = makeService();

  await service.assertAllowed({
    scopeType: "league",
    leagueId: asOpaqueId("league-1"),
    viewerUserId: asOpaqueId("u1"),
    targetUserId: asOpaqueId("u2"),
  });

  assert.deepEqual(leagueCalls, [["league-1", "u1", "u2"]]);
  assert.deepEqual(seasonCalls, []);
});

test("rejects another target when either user is outside the league", async () => {
  const { service, leagueCalls, seasonCalls } = makeService({
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
});

test("allows another target when both are season members", async () => {
  const { service, leagueCalls, seasonCalls } = makeService();

  await service.assertAllowed({
    scopeType: "season",
    leagueId: asOpaqueId("league-1"),
    seasonId: asOpaqueId("season-1"),
    viewerUserId: asOpaqueId("u1"),
    targetUserId: asOpaqueId("u2"),
  });

  assert.deepEqual(leagueCalls, []);
  assert.deepEqual(seasonCalls, [["league-1", "season-1", "u1", "u2"]]);
});

test("rejects another target when either user is outside the season", async () => {
  const { service, leagueCalls, seasonCalls } = makeService({
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
});
