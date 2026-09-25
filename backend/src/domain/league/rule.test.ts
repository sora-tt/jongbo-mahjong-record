import assert from "node:assert/strict";
import test from "node:test";
import { validateLeagueRule } from "@/domain/league/rule.js";

test("validateLeagueRule accepts zero-sum sanma uma", () => {
  assert.doesNotThrow(() =>
    validateLeagueRule({
      gameType: "sanma",
      uma: { first: 20, second: 0, third: -20, fourth: null },
      oka: { startingPoints: 35000, returnPoints: 35000 },
    }),
  );
});

test("validateLeagueRule rejects non-zero-sum uma", () => {
  assert.throws(
    () =>
      validateLeagueRule({
        gameType: "yonma",
        uma: { first: 30, second: 10, third: -10, fourth: -10 },
        oka: { startingPoints: 25000, returnPoints: 30000 },
      }),
    /rule\.uma must total zero/,
  );
});

test("validateLeagueRule enforces the fourth uma semantics", () => {
  assert.throws(
    () =>
      validateLeagueRule({
        gameType: "sanma",
        uma: { first: 10, second: 0, third: -10, fourth: 1 },
        oka: { startingPoints: 35000, returnPoints: 35000 },
      }),
    /fourth must be null for sanma/,
  );
  assert.throws(
    () =>
      validateLeagueRule({
        gameType: "yonma",
        uma: { first: 20, second: 10, third: -10, fourth: null },
        oka: { startingPoints: 25000, returnPoints: 30000 },
      }),
    /fourth is required for yonma/,
  );
});
