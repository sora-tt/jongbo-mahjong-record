import assert from "node:assert/strict";
import test from "node:test";
import {
  executeStatsRebuildCommand,
  parseStatsRebuildArgs,
} from "@/scripts/rebuildStats.js";
import type { StatsRebuilder } from "@/application/services/statsRebuilder.js";

test("parses and dispatches the all repair command", async () => {
  const calls: string[] = [];
  const allReport = {
    scope: { type: "all" as const },
    matchCount: 12,
    userCount: 4,
  };
  const rebuilder = {
    rebuildAll: async () => {
      calls.push("all");
      return allReport;
    },
    rebuildSession: async () => {
      calls.push("session");
      throw new Error("unexpected session rebuild");
    },
    rebuildSeason: async () => {
      calls.push("season");
      throw new Error("unexpected season rebuild");
    },
    rebuildLeague: async () => {
      calls.push("league");
      throw new Error("unexpected league rebuild");
    },
    rebuildOverall: async () => {
      calls.push("overall");
      throw new Error("unexpected overall rebuild");
    },
  } as unknown as Pick<
    StatsRebuilder,
    | "rebuildAll"
    | "rebuildSession"
    | "rebuildSeason"
    | "rebuildLeague"
    | "rebuildOverall"
  >;

  const command = parseStatsRebuildArgs(["--", "all"]);
  const report = await executeStatsRebuildCommand(rebuilder, command);

  assert.deepEqual(command, { scopeType: "all" });
  assert.deepEqual(calls, ["all"]);
  assert.deepEqual(report, allReport);
});

test("preserves scoped repair commands and rejects extra arguments", () => {
  assert.deepEqual(
    parseStatsRebuildArgs(["session", "league-1", "season-1", "session-1"]),
    {
      scopeType: "session",
      leagueId: "league-1",
      seasonId: "season-1",
      sessionId: "session-1",
    },
  );
  assert.deepEqual(parseStatsRebuildArgs(["season", "league-1", "season-1"]), {
    scopeType: "season",
    leagueId: "league-1",
    seasonId: "season-1",
  });
  assert.deepEqual(parseStatsRebuildArgs(["league", "league-1"]), {
    scopeType: "league",
    leagueId: "league-1",
  });
  assert.deepEqual(parseStatsRebuildArgs(["overall"]), {
    scopeType: "overall",
  });
  assert.throws(() => parseStatsRebuildArgs(["all", "unexpected"]), /usage:/);
});
