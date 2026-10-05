import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import { toStatisticsMatchHistoryView } from "./adapter";
import { getStatisticsMatchHistoryModel } from "./match-history";

import type { StatisticsMatchHistoryResponse } from "../api";

const makeHistory = (overrides: Partial<StatisticsMatchHistoryResponse> = {}) =>
  toStatisticsMatchHistoryView(
    {
      status: "ready",
      scope: { scopeType: "overall", gameType: "all" },
      generatedAt: "2026-10-04T00:00:00.000Z",
      timeZone: "Asia/Tokyo",
      items: [
        {
          match: {
            matchId: "match-newer",
            leagueId: "league-1",
            leagueName: "リーグ",
            seasonId: "season-1",
            seasonName: "秋季",
            sessionId: "session-1",
            sessionLabel: "第1節",
            playedAt: "2026-10-03T15:30:00.000Z",
          },
          gameType: "sanma",
          wind: "east",
          rank: 1,
          rawScore: 42000,
          finalPoint: 12.0,
          opponents: [
            {
              userId: "user-2",
              userName: "相手A",
              rank: 2,
              finalPoint: -2,
            },
          ],
        },
        {
          match: {
            matchId: "match-older",
            leagueId: "league-1",
            leagueName: "リーグ",
            seasonId: "season-1",
            seasonName: "秋季",
            sessionId: "session-1",
            sessionLabel: "第1節",
            playedAt: "2026-10-03T14:30:00.000Z",
          },
          gameType: "yonma",
          wind: "south",
          rank: 4,
          rawScore: 18000,
          finalPoint: -22,
          opponents: [],
        },
      ],
      nextCursor: null,
      ...overrides,
    } as unknown as StatisticsMatchHistoryResponse,
    "user-1"
  );

test("history model preserves API order and formats playedAt in Tokyo time", () => {
  const model = getStatisticsMatchHistoryModel({
    status: "ready",
    history: makeHistory(),
  });

  deepStrictEqual(
    model.items.map(({ match, playedAtLabel }) => ({
      matchId: match.matchId,
      playedAtLabel,
    })),
    [
      { matchId: "match-newer", playedAtLabel: "2026/10/04 00:30" },
      { matchId: "match-older", playedAtLabel: "2026/10/03 23:30" },
    ]
  );
});

test("history loading state hides any previous response", () => {
  const model = getStatisticsMatchHistoryModel({
    status: "loading",
    history: makeHistory({ nextCursor: "old-cursor" }),
  });

  strictEqual(model.status, "loading");
  deepStrictEqual(model.items, []);
  strictEqual(model.nextCursor, null);
});

test("empty and uncomputed remain distinct and never expose a cursor", () => {
  const empty = getStatisticsMatchHistoryModel({
    status: "empty",
    history: toStatisticsMatchHistoryView(
      {
        status: "empty",
        scope: { scopeType: "overall", gameType: "all" },
        generatedAt: "2026-10-04T00:00:00.000Z",
        timeZone: "Asia/Tokyo",
        items: [],
        nextCursor: null,
      } as unknown as StatisticsMatchHistoryResponse,
      "user-1"
    ),
  });
  const uncomputed = getStatisticsMatchHistoryModel({
    status: "uncomputed",
    history: toStatisticsMatchHistoryView(
      {
        status: "uncomputed",
        scope: { scopeType: "overall", gameType: "all" },
        generatedAt: null,
        timeZone: "Asia/Tokyo",
        items: [],
        nextCursor: null,
      } as unknown as StatisticsMatchHistoryResponse,
      "user-1"
    ),
  });

  strictEqual(empty.status, "empty");
  strictEqual(uncomputed.status, "uncomputed");
  strictEqual(empty.nextCursor, null);
  strictEqual(uncomputed.nextCursor, null);
});

test("history model returns the opaque cursor without modifying it", () => {
  const cursor = "opaque:cursor/+?page=2==";
  const model = getStatisticsMatchHistoryModel({
    status: "ready",
    history: makeHistory({ nextCursor: cursor }),
  });

  strictEqual(model.nextCursor, cursor);
});
