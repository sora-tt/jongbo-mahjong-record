import assert from "node:assert/strict";
import test from "node:test";
import { Timestamp } from "firebase-admin/firestore";
import type { LeagueRule } from "@/domain/league/types.js";
import {
  asIsoDateString,
  asOpaqueId,
  type IsoDateString,
  type OpaqueId,
} from "@/domain/shared/types.js";
import { toIsoString, toTimestamp } from "@/infrastructure/firestore/utils.js";

test("canonical boundary types preserve opaque ids and ISO dates", () => {
  const userId: OpaqueId = asOpaqueId("user-1");
  const createdAt: IsoDateString = asIsoDateString("2026-09-25T00:00:00.000Z");

  assert.equal(userId, "user-1");
  assert.equal(createdAt, "2026-09-25T00:00:00.000Z");
});

test("Firestore timestamp conversion is explicit at the persistence boundary", () => {
  const timestamp = Timestamp.fromDate(new Date("2026-09-25T00:00:00.000Z"));

  assert.equal(toIsoString(timestamp), "2026-09-25T00:00:00.000Z");
  assert.equal(
    toIsoString(toTimestamp("2026-09-25T00:00:00.000Z")),
    "2026-09-25T00:00:00.000Z",
  );
  assert.equal(toTimestamp(null), null);
});

test("league rule is embedded and has only the canonical fields", () => {
  const rule = {
    gameType: "yonma",
    uma: { first: 20, second: 10, third: -10, fourth: -20 },
    oka: { startingPoints: 25_000, returnPoints: 30_000 },
  } satisfies LeagueRule;

  assert.equal(
    rule.uma.first + rule.uma.second + rule.uma.third + rule.uma.fourth,
    0,
  );
  assert.deepEqual(Object.keys(rule).sort(), ["gameType", "oka", "uma"]);
});
