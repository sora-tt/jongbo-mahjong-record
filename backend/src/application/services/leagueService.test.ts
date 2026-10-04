import assert from "node:assert/strict";
import test from "node:test";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { UserRepository } from "@/domain/user/repository.js";
import type { StatsRebuilder } from "@/application/services/statsRebuilder.js";
import { LeagueService } from "@/application/services/leagueService.js";
import { asOpaqueId } from "@/domain/shared/types.js";
import { AppError, NotFoundError } from "@/domain/shared/errors.js";

test("invalidates league, season and overall scopes before deletion and keeps them uncomputed on cleanup failure", async () => {
  const events: string[] = [];
  const readiness = new Map([
    ["season-1", 1],
    ["season-2", 1],
    ["league", 1],
    ["overall", 1],
  ]);
  const member = {
    id: asOpaqueId("member-1"),
    userId: asOpaqueId("user-1"),
    userName: "一郎",
  };
  const service = new LeagueService(
    {
      areMembers: async () => true,
      listMembers: async () => [member],
      delete: async () => {
        events.push("delete-source");
      },
    } as unknown as LeagueRepository,
    {} as UserRepository,
    {
      prepareLeagueDeletion: async () => {
        events.push("invalidate");
        readiness.forEach((_value, scope) => readiness.set(scope, 0));
      },
      clearLeagueStats: async () => {
        events.push("cleanup");
        throw new Error("projection cleanup failed");
      },
      rebuildOverall: async () => {
        events.push("rebuild");
      },
    } as unknown as StatsRebuilder,
  );

  await assert.rejects(
    service.deleteLeague("user-1", "league-1"),
    /projection cleanup failed/,
  );

  assert.deepEqual(events, ["invalidate", "delete-source", "cleanup"]);
  assert.deepEqual([...readiness.values()], [0, 0, 0, 0]);
});

test("league member listing uses a bounded membership check before listing members", async () => {
  const events: string[] = [];
  const member = {
    id: asOpaqueId("member-1"),
    userId: asOpaqueId("user-1"),
    userName: "一郎",
  };
  const service = new LeagueService(
    {
      areMembers: async (...args: unknown[]) => {
        events.push(`membership:${args.join(":")}`);
        return true;
      },
      listMembers: async () => {
        events.push("list-members");
        return [member];
      },
    } as unknown as LeagueRepository,
    {} as UserRepository,
    {} as StatsRebuilder,
  );

  assert.deepEqual(await service.listLeagueMembers("user-1", "league-1"), [
    member,
  ]);
  assert.deepEqual(events, [
    "membership:league-1:user-1:user-1",
    "list-members",
  ]);
});

test("league membership preserves 404 for a missing league and 403 for an existing league", async () => {
  const createService = (exists: boolean) =>
    new LeagueService(
      {
        areMembers: async () => false,
        exists: async () => exists,
        listMembers: async () => [],
      } as unknown as LeagueRepository,
      {} as UserRepository,
      {} as StatsRebuilder,
    );

  await assert.rejects(
    createService(false).listLeagueMembers("user-1", "missing-league"),
    NotFoundError,
  );
  await assert.rejects(
    createService(true).listLeagueMembers("user-1", "league-1"),
    AppError,
  );
});
