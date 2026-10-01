import assert from "node:assert/strict";
import test from "node:test";
import { validateLeagueRule } from "@/domain/league/rule.js";
import type {
  FloatingCount,
  LeagueRule,
  RankPoints,
} from "@/domain/league/types.js";

const makeFloatingRule = (
  pointsByFloatingCount: Partial<Record<FloatingCount, RankPoints>> = {
    0: { first: 0, second: 0, third: 0, fourth: 0 },
    1: { first: 12, second: -1, third: -3, fourth: -8 },
    2: { first: 8, second: 4, third: -4, fourth: -8 },
    3: { first: 8, second: 3, third: 1, fourth: -12 },
    4: { first: 0, second: 0, third: 0, fourth: 0 },
  },
): LeagueRule =>
  JSON.parse(
    JSON.stringify({
      gameType: "yonma",
      uma: { mode: "floatingCount", pointsByFloatingCount },
      oka: { startingPoints: 25000, returnPoints: 25000 },
      chomboPenaltyPoints: 0,
      allowOffTableKyotaku: false,
    }),
  ) as LeagueRule;

test("validateLeagueRule accepts zero-sum sanma uma", () => {
  assert.doesNotThrow(() =>
    validateLeagueRule({
      gameType: "sanma",
      uma: { mode: "fixed", first: 20, second: 0, third: -20, fourth: null },
      oka: { startingPoints: 35000, returnPoints: 35000 },
      chomboPenaltyPoints: 0,
      allowOffTableKyotaku: false,
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
        chomboPenaltyPoints: 0,
        allowOffTableKyotaku: false,
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
            chomboPenaltyPoints: 0,
            allowOffTableKyotaku: false,
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
          chomboPenaltyPoints: 0,
          allowOffTableKyotaku: false,
        }),
      ),
    ),
  );
});

test("validateLeagueRule accepts complete zero-sum floatingCount rows", () => {
  assert.doesNotThrow(() => validateLeagueRule(makeFloatingRule()));
});

test("validateLeagueRule rejects a missing floatingCount row", () => {
  const floatingRule = makeFloatingRule({
    0: { first: 0, second: 0, third: 0, fourth: 0 },
    1: { first: 12, second: -1, third: -3, fourth: -8 },
    2: { first: 8, second: 4, third: -4, fourth: -8 },
    3: { first: 8, second: 3, third: 1, fourth: -12 },
  });

  assert.throws(
    () => validateLeagueRule(floatingRule),
    /floatingCount 4 is required/,
  );
});

test("validateLeagueRule rejects non-integer floatingCount points", () => {
  assert.throws(
    () =>
      validateLeagueRule(
        makeFloatingRule({
          0: { first: 0.5, second: -0.5, third: 0, fourth: 0 },
          1: { first: 12, second: -1, third: -3, fourth: -8 },
          2: { first: 8, second: 4, third: -4, fourth: -8 },
          3: { first: 8, second: 3, third: 1, fourth: -12 },
          4: { first: 0, second: 0, third: 0, fourth: 0 },
        }),
      ),
    /floatingCount 0 rank points must be integers/,
  );
});

test("validateLeagueRule reports floatingCount row total details", () => {
  assert.throws(
    () =>
      validateLeagueRule(
        makeFloatingRule({
          0: { first: 0, second: 0, third: 0, fourth: 0 },
          1: { first: 12, second: -1, third: -3, fourth: -7 },
          2: { first: 8, second: 4, third: -4, fourth: -8 },
          3: { first: 8, second: 3, third: 1, fourth: -12 },
          4: { first: 0, second: 0, third: 0, fourth: 0 },
        }),
      ),
    (error: unknown) => {
      assert.equal(typeof error, "object");
      assert.deepEqual((error as { details?: unknown }).details, {
        field: "rule.uma",
        mode: "floatingCount",
        floatingCount: 1,
        expectedTotal: 0,
        actualTotal: 1,
      });
      return true;
    },
  );
});

test("validateLeagueRule rejects floatingCount for sanma", () => {
  const floatingRule = JSON.parse(JSON.stringify(makeFloatingRule()));
  floatingRule.gameType = "sanma";

  assert.throws(
    () => validateLeagueRule(floatingRule),
    /floatingCount uma is only supported for yonma/,
  );
});
