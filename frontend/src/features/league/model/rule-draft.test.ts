import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import {
  buildLeagueRulePayload,
  createDefaultLeagueRuleDraft,
  toLeagueRuleDraft,
  type LeagueRuleDraft,
} from "./rule-draft";

const validBaseDraft = (): LeagueRuleDraft => ({
  ...createDefaultLeagueRuleDraft(),
  okaStartPoints: "25000",
  okaReturnPoints: "25000",
  fixedUma: { first: "10", second: "5", third: "-5", fourth: "-10" },
});

test("fixed yonma draft builds the explicit fixed API rule union", () => {
  const result = buildLeagueRulePayload(validBaseDraft());

  strictEqual(result.ok, true);
  if (!result.ok) return;
  deepStrictEqual(result.rule, {
    gameType: "yonma",
    uma: { mode: "fixed", first: 10, second: 5, third: -5, fourth: -10 },
    oka: { startingPoints: 25000, returnPoints: 25000 },
  });
});

test("floating-count draft builds all five integer rows in API shape", () => {
  const draft = validBaseDraft();
  draft.mode = "floatingCount";

  const result = buildLeagueRulePayload(draft);

  strictEqual(result.ok, true);
  if (!result.ok) return;
  deepStrictEqual(result.rule, {
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
  });
});

test("sanma always builds a fixed rule while retaining yonma floating draft", () => {
  const draft = validBaseDraft();
  draft.gameType = "sanma";
  draft.mode = "floatingCount";
  draft.fixedUma = {
    first: "5",
    second: "-1",
    third: "-4",
    fourth: "77",
  };
  draft.floatingCountUma[1].first = "21";

  const result = buildLeagueRulePayload(draft);

  strictEqual(result.ok, true);
  if (!result.ok) return;
  deepStrictEqual(result.rule, {
    gameType: "sanma",
    uma: { mode: "fixed", first: 5, second: -1, third: -4, fourth: null },
    oka: { startingPoints: 25000, returnPoints: 25000 },
  });
  strictEqual(draft.floatingCountUma[1].first, "21");
});

test("edit draft loads the persisted floating mode and every saved row", () => {
  const draft = toLeagueRuleDraft({
    gameType: "yonma",
    uma: {
      mode: "floatingCount",
      pointsByFloatingCount: {
        0: { first: 1, second: 2, third: 3, fourth: -6 },
        1: { first: 4, second: 5, third: 6, fourth: -15 },
        2: { first: 7, second: 8, third: 9, fourth: -24 },
        3: { first: 10, second: 11, third: 12, fourth: -33 },
        4: { first: 13, second: 14, third: 15, fourth: -42 },
      },
    },
    oka: { startingPoints: 25000, returnPoints: 30000 },
  });

  strictEqual(draft.mode, "floatingCount");
  strictEqual(draft.floatingCountUma[0].fourth, "-6");
  strictEqual(draft.floatingCountUma[4].first, "13");
  strictEqual(draft.okaReturnPoints, "30000");
});

test("floating-count payload rejects an invalid row before API submission", () => {
  const draft = validBaseDraft();
  draft.mode = "floatingCount";
  draft.floatingCountUma[2].first = "9";

  const result = buildLeagueRulePayload(draft);

  strictEqual(result.ok, false);
  if (result.ok) return;
  strictEqual(result.error, "2人浮きの順位点合計が0ではありません（現在: 1）");
});
