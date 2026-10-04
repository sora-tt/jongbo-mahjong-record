import assert from "node:assert/strict";
import test from "node:test";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { MatchRepository } from "@/domain/match/repository.js";
import type { SeasonRepository } from "@/domain/season/repository.js";
import type { StatsRebuilder } from "@/application/services/statsRebuilder.js";
import { SeasonService } from "@/application/services/seasonService.js";
import { asOpaqueId } from "@/domain/shared/types.js";
import { AppError } from "@/domain/shared/errors.js";

test("invalidates season and parent scopes before deletion and keeps them uncomputed on cleanup failure", async () => {
  const events: string[] = [];
  const readiness = new Map([
    ["season", 1],
    ["league", 1],
    ["overall", 1],
  ]);
  const member = { userId: asOpaqueId("user-1"), userName: "一郎" };
  const service = new SeasonService(
    {
      areMembers: async () => true,
      listMembers: async () => [member],
    } as unknown as LeagueRepository,
    {
      areMembers: async () => true,
      listMembers: async () => [member],
      delete: async () => {
        events.push("delete-source");
      },
    } as unknown as SeasonRepository,
    {} as MatchRepository,
    {
      prepareSeasonDeletion: async () => {
        events.push("invalidate");
        readiness.forEach((_value, scope) => readiness.set(scope, 0));
      },
      clearSeasonStats: async () => {
        events.push("cleanup");
        throw new Error("projection cleanup failed");
      },
      rebuildLeague: async () => {
        events.push("rebuild");
      },
    } as unknown as StatsRebuilder,
  );

  await assert.rejects(
    service.deleteSeason("user-1", "league-1", "season-1"),
    /projection cleanup failed/,
  );

  assert.deepEqual(events, ["invalidate", "delete-source", "cleanup"]);
  assert.deepEqual([...readiness.values()], [0, 0, 0]);
});

test("season member listing checks league access and reads the season roster once", async () => {
  const events: string[] = [];
  const members = [
    { userId: asOpaqueId("user-1"), userName: "一郎" },
    { userId: asOpaqueId("user-2"), userName: "二郎" },
  ];
  const service = new SeasonService(
    {
      areMembers: async (...args: unknown[]) => {
        events.push(`league-membership:${args.join(":")}`);
        return true;
      },
      listMembers: async () => {
        events.push("league-roster");
        return [members[0]!];
      },
    } as unknown as LeagueRepository,
    {
      listMembers: async () => {
        events.push("season-roster");
        return members;
      },
    } as unknown as SeasonRepository,
    {} as MatchRepository,
    {} as StatsRebuilder,
  );

  assert.deepEqual(
    await service.listSeasonMembers("user-1", "league-1", "season-1"),
    members,
  );
  assert.deepEqual(events, [
    "league-membership:league-1:user-1:user-1",
    "season-roster",
  ]);
});

test("season member listing rejects a league member outside the season", async () => {
  const service = new SeasonService(
    {
      areMembers: async () => true,
      listMembers: async () => [
        { userId: asOpaqueId("user-1"), userName: "一郎" },
      ],
    } as unknown as LeagueRepository,
    {
      listMembers: async () => [
        { userId: asOpaqueId("user-2"), userName: "二郎" },
      ],
    } as unknown as SeasonRepository,
    {} as MatchRepository,
    {} as StatsRebuilder,
  );

  await assert.rejects(
    service.listSeasonMembers("user-1", "league-1", "season-1"),
    AppError,
  );
});
