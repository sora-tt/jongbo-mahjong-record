import assert from "node:assert/strict";
import test from "node:test";
import { validateLeagueRule } from "@/domain/league/rule.js";

test("validateLeagueRule accepts zero-sum sanma uma", () => {
  assert.doesNotThrow(() =>
    validateLeagueRule({
      gameType: "sanma",
      uma: { mode: "fixed", first: 20, second: 0, third: -20, fourth: null },
      oka: { startingPoints: 35000, returnPoints: 35000 },
    }),
  );
});

test("validateLeagueRule rejects non-zero-sum uma", () => {
  assert.throws(
    () =>
      validateLeagueRule({
        gameType: "yonma",
        uma: {
          mode: "fixed",
          first: 30,
          second: 10,
          third: -10,
          fourth: -10,
        },
        oka: { startingPoints: 25000, returnPoints: 30000 },
      }),
    /rule\.uma must total zero/,
  );
});

test("validateLeagueRule enforces the fourth uma semantics", () => {
  assert.throws(
    () =>
      validateLeagueRule(
        JSON.parse(
          JSON.stringify({
            gameType: "sanma",
            uma: { mode: "fixed", first: 10, second: 0, third: -10, fourth: 1 },
            oka: { startingPoints: 35000, returnPoints: 35000 },
          }),
        ),
      ),
    /fourth must be null for sanma/,
  );
  assert.throws(() =>
    validateLeagueRule(
      JSON.parse(
        JSON.stringify({
          gameType: "yonma",
          uma: {
            mode: "fixed",
            first: 20,
            second: 10,
            third: -10,
            fourth: null,
          },
          oka: { startingPoints: 25000, returnPoints: 30000 },
        }),
      ),
    ),
  );
});

test("validateLeagueRule rejects floatingCount until the mode is enabled", () => {
  const floatingRule = JSON.parse(
    JSON.stringify({
      gameType: "yonma",
      uma: {
        mode: "floatingCount",
        pointsByFloatingCount: {
          0: { first: 0, second: 0, third: 0, fourth: 0 },
          1: { first: 12, second: -1, third: -3, fourth: -8 },
          2: { first: 8, second: 4, third: -4, fourth: -8 },
          3: { first: 8, second: 3, third: 1, fourth: -12 },
          4: { first: 0, second: 0, third: 0, fourth: 0 },
        },
      },
      oka: { startingPoints: 25000, returnPoints: 25000 },
    }),
  );

  assert.throws(
    () => validateLeagueRule(floatingRule),
    /floatingCount uma is not supported yet/,
  );
});
