import { strictEqual } from "node:assert";
import test from "node:test";

import * as React from "react";

import { renderToStaticMarkup } from "react-dom/server";

import { toMatchList } from "@/features/match/model/adapter";
import { MatchList } from "@/features/match/ui/MatchList";
import { toStandingRows } from "@/features/statistics/model/adapter";
import { StandingsTable } from "@/features/statistics/ui/StandingsTable";

import type { ApiMatch, ApiSeason } from "@/lib/api/contracts";

test("Match and season standings display points supplied by Backend", () => {
  const match = {
    id: "match-1",
    leagueId: "league-1",
    seasonId: "season-1",
    sessionId: "session-1",
    matchIndex: 1,
    playedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    results: [
      {
        userId: "user-1",
        userName: "一郎",
        wind: "east",
        rank: 1,
        rawScore: 40000,
        point: 23,
      },
      {
        userId: "user-2",
        userName: "二郎",
        wind: "south",
        rank: 2,
        rawScore: 30000,
        point: 9,
      },
    ],
  } as unknown as ApiMatch;
  const matchMarkup = renderToStaticMarkup(
    React.createElement(MatchList, {
      matches: toMatchList([match]),
      expandedMatchId: "match-1",
      deletingMatchId: null,
      onToggle: () => {},
      onEdit: () => {},
      onDelete: () => {},
    })
  );

  strictEqual(matchMarkup.includes("1位 / point：23"), true);
  strictEqual(matchMarkup.includes("2位 / point：9"), true);

  const standings = [
    {
      rank: 1,
      userId: "user-1",
      userName: "一郎",
      totalPoints: 23,
      matchCount: 1,
      firstCount: 1,
      secondCount: 0,
      thirdCount: 0,
      fourthCount: 0,
    },
  ] as ApiSeason["standings"];
  const standingsMarkup = renderToStaticMarkup(
    React.createElement(StandingsTable, {
      rows: toStandingRows(standings),
    })
  );

  strictEqual(standingsMarkup.includes("23.0"), true);
  strictEqual(standingsMarkup.includes("一郎"), true);
});
