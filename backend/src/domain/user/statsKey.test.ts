import assert from "node:assert/strict";
import test from "node:test";
import { buildUserStatsId } from "@/domain/user/statsKey.js";

test("buildUserStatsId creates stable ids for each scope", () => {
  assert.equal(
    buildUserStatsId({
      userId: "user-1",
      scopeType: "overall",
      leagueId: null,
      seasonId: null,
    }),
    "overall_user-1",
  );
  assert.equal(
    buildUserStatsId({
      userId: "user-1",
      scopeType: "league",
      leagueId: "league-1",
      seasonId: null,
    }),
    "league_league-1_user-1",
  );
  assert.equal(
    buildUserStatsId({
      userId: "user-1",
      scopeType: "season",
      leagueId: "league-1",
      seasonId: "season-1",
    }),
    "season_league-1_season-1_user-1",
  );
});
