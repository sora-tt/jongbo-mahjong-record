import { strictEqual } from "node:assert";
import test from "node:test";

import * as React from "react";

import { renderToStaticMarkup } from "react-dom/server";

import { MatchHistory } from "./index";

import type { StatisticsMatchHistoryView } from "@/features/statistics/model/match-history";

test("v2 history preserves yakuman records, display order and pagination", () => {
  const history = {
    targetUserId: "user-1",
    status: "ready",
    scope: { scopeType: "overall", gameType: "all" },
    generatedAt: "2026-10-04T00:00:00.000Z",
    timeZone: "Asia/Tokyo",
    nextCursor: "next-page",
    items: [
      {
        match: {
          matchId: "match-1",
          leagueId: "league-1",
          leagueName: "リーグ",
          seasonId: "season-1",
          seasonName: "秋季",
          sessionId: "session-1",
          sessionLabel: "第1節",
          playedAt: "2026-10-03T15:30:00.000Z",
        },
        gameType: "yonma",
        wind: "east",
        rank: 1,
        rawScore: 40000,
        finalPoint: 10,
        opponents: [
          { userId: "user-2", userName: "花子", rank: 2, finalPoint: -10 },
        ],
        yakumanKinds: ["daisangen", "suuankouTanki"],
      },
    ],
  } as unknown as StatisticsMatchHistoryView;
  const markup = renderToStaticMarkup(
    <MatchHistory
      history={history}
      status="ready"
      subjectLabel="一郎"
      onLoadMore={() => {}}
    />
  );
  strictEqual(markup.includes("大三元、四暗刻単騎待ち"), true);
  strictEqual(markup.includes("10月04日（日）"), true);
  strictEqual(markup.includes("さらに読み込む"), true);
  strictEqual(markup.includes("40,000点"), true);
  strictEqual(markup.includes("対局日時："), true);
  strictEqual(markup.includes("同卓者"), true);
  strictEqual(markup.includes("花子"), true);
  strictEqual(markup.includes("grid-cols-3"), true);
  strictEqual(markup.includes("2位・-10"), true);
  strictEqual(markup.includes("pt</p>"), true);
  strictEqual(markup.includes("形式："), false);
  strictEqual(markup.includes("セッション："), false);
  strictEqual(markup.includes("表示対象："), false);
});
