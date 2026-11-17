import assert from "node:assert/strict";
import test from "node:test";

import type { Match } from "@/domain/match/types.js";
import { buildSeasonTitleRankings } from "@/domain/season/title-rankings.js";
import { asIsoDateString, asOpaqueId } from "@/domain/shared/types.js";

const members = ["a", "b", "c", "d", "unplayed"].map((userId) => ({
  userId: asOpaqueId(userId),
  userName: userId,
}));
const playedAt = asIsoDateString("2026-01-01T00:00:00.000Z");
const match: Match = {
  id: asOpaqueId("match"),
  leagueId: asOpaqueId("league"),
  seasonId: asOpaqueId("season"),
  sessionId: asOpaqueId("session"),
  matchIndex: 1,
  playedAt,
  createdAt: playedAt,
  updatedAt: playedAt,
  chomboEvents: [],
  offTableKyotakuCount: 0,
  results: ["a", "b", "c", "d"].map((id, index) => ({
    userId: asOpaqueId(id),
    userName: id,
    wind: (["east", "south", "west", "north"] as const)[index]!,
    rank: index + 1,
    rawScore: 40000 - index * 10000,
    point: 0,
  })),
  yakumanEvents: [
    { winnerUserId: asOpaqueId("b"), kind: "daisangen" },
    { winnerUserId: asOpaqueId("b"), kind: "suuankouTanki" },
  ],
};

test("参加者の最高スコア、率、役満回数を順位順に集計する", () => {
  const ranking = buildSeasonTitleRankings(members, [match], "yonma");
  assert.deepEqual(
    ranking.highestScore.map(({ value }) => value),
    [40000, 30000, 20000, 10000],
  );
  assert.deepEqual(
    ranking.top2Rate.map(({ value }) => value),
    [100, 100, 0, 0],
  );
  assert.deepEqual(
    ranking.avoidLastRate.map(({ value }) => value),
    [100, 100, 100, 0],
  );
  assert.deepEqual(
    ranking.yakuman.map(({ userId, value }) => [userId, value]),
    [
      ["b", 2],
      ["a", 0],
      ["c", 0],
      ["d", 0],
    ],
  );
  assert.ok(!ranking.yakuman.some(({ userId }) => userId === "unplayed"));
});

test("三麻ではラス回避率を表示せず、対局がない場合はランキングが空になる", () => {
  assert.deepEqual(
    buildSeasonTitleRankings(members, [match], "sanma").avoidLastRate,
    [],
  );
  assert.deepEqual(buildSeasonTitleRankings(members, [], "yonma"), {
    highestScore: [],
    avoidLastRate: [],
    top2Rate: [],
    yakuman: [],
  });
});
