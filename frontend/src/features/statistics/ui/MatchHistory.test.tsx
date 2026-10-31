import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";

import { MatchHistory } from "@/features/statistics/ui/MatchHistory";

import type { StatisticsMatchHistoryView } from "@/features/statistics/model/match-history";

const makeHistory = (
  items: Array<{
    matchId: string;
    playedAt: string;
    yakumanKinds: string[];
  }>,
  nextCursor: string | null = null
) =>
  ({
    targetUserId: "user-1",
    status: "ready",
    scope: { scopeType: "overall", gameType: "all" },
    generatedAt: "2026-10-04T00:00:00.000Z",
    timeZone: "Asia/Tokyo",
    items: items.map(({ matchId, playedAt, yakumanKinds }, index) => ({
      match: {
        matchId,
        leagueId: "league-1",
        leagueName: "リーグ",
        seasonId: "season-1",
        seasonName: "秋季",
        sessionId: "session-1",
        sessionLabel: "第1節",
        playedAt,
      },
      gameType: "yonma",
      wind: index === 0 ? "east" : "south",
      rank: index + 1,
      rawScore: 40000 - index * 10000,
      finalPoint: 10 - index * 10,
      opponents: [],
      yakumanKinds,
    })),
    nextCursor,
  }) as unknown as StatisticsMatchHistoryView;

const renderHistory = (history: StatisticsMatchHistoryView) => {
  const markup = renderToStaticMarkup(
    React.createElement(MatchHistory, {
      history,
      status: "ready",
      subjectLabel: "一郎",
      onLoadMore: () => {},
    })
  );

  return new JSDOM(markup).window.document;
};

test("Match history shows every yakuman for its subject in input order only", () => {
  const document = renderHistory(
    makeHistory([
      {
        matchId: "match-with-yakuman",
        playedAt: "2026-10-03T15:30:00.000Z",
        yakumanKinds: ["daisangen", "suuankouTanki"],
      },
      {
        matchId: "match-opponent-only-yakuman",
        playedAt: "2026-10-02T15:30:00.000Z",
        yakumanKinds: [],
      },
    ])
  );
  const articles = Array.from(document.querySelectorAll("article"));

  strictEqual(articles.length, 2);
  deepStrictEqual(
    Array.from(articles[0].querySelectorAll("dt")).map((term) =>
      term.textContent?.trim()
    ),
    ["形式", "セッション", "表示対象者", "素点", "最終ポイント", "役満"]
  );
  const yakumanTerm = Array.from(articles[0].querySelectorAll("dt")).find(
    (term) => term.textContent?.trim() === "役満"
  );
  strictEqual(
    yakumanTerm?.parentElement?.querySelector("dd")?.textContent?.trim(),
    "大三元、四暗刻単騎待ち"
  );
  strictEqual(
    Array.from(articles[1].querySelectorAll("dt")).some(
      (term) => term.textContent?.trim() === "役満"
    ),
    false
  );
  strictEqual(articles[1].textContent?.includes("大三元"), false);
});

test("a new history page replaces the displayed items without keeping old yakuman", () => {
  const pageOne = renderHistory(
    makeHistory(
      [
        {
          matchId: "match-page-one",
          playedAt: "2026-10-03T15:30:00.000Z",
          yakumanKinds: ["daisangen"],
        },
      ],
      "cursor-page-two"
    )
  );
  const pageTwo = renderHistory(
    makeHistory([
      {
        matchId: "match-page-two",
        playedAt: "2026-10-02T15:30:00.000Z",
        yakumanKinds: ["junseiChuurenPoutou"],
      },
    ])
  );

  strictEqual(pageOne.body.textContent?.includes("大三元"), true);
  strictEqual(pageTwo.body.textContent?.includes("純正九蓮宝燈"), true);
  strictEqual(pageTwo.body.textContent?.includes("大三元"), false);
});
