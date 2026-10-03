import assert from "node:assert/strict";
import test from "node:test";
import type { LeagueRepository } from "@/domain/league/repository.js";
import type { UserRepository } from "@/domain/user/repository.js";
import type { StatsRebuilder } from "@/application/services/statsRebuilder.js";
import { LeagueService } from "@/application/services/leagueService.js";
import { asOpaqueId } from "@/domain/shared/types.js";

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
