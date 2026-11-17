import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  pretendToBeVisual: true,
  url: "http://localhost",
});
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  self: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  Node: { configurable: true, value: dom.window.Node },
  MutationObserver: { configurable: true, value: dom.window.MutationObserver },
  getComputedStyle: {
    configurable: true,
    value: dom.window.getComputedStyle.bind(dom.window),
  },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
});
dom.window.HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
dom.window.HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
  this.dispatchEvent(new dom.window.Event("close"));
};
const setup = Promise.all([
  import("@testing-library/react"),
  import("./index"),
]);
afterEach(async () => {
  const [testing] = await setup;
  testing.cleanup();
});

const match = {
  matchId: "match-1",
  leagueId: "league-1",
  leagueName: "週末麻雀",
  seasonId: "season-1",
  seasonName: "2026 後期",
  sessionId: "session-1",
  sessionLabel: "第12節",
  playedAt: "2026-11-05T10:42:00Z",
  opponents: [{ userId: "u1", userName: "花子", rank: 2, finalPoint: 10 }],
};
const summary = {
  scope: { scopeType: "overall", gameType: "yonma" },
  totals: {
    totalMatchCount: 1,
    sessionCount: 1,
    totalPoints: 50,
    averageFinalPoint: 50,
    chomboCount: 0,
  },
  byGameType: [],
  pointBreakdown: { rawPoint: 10, rankPoint: 40, chomboPenalty: 0 },
  yakumanCounts: [
    { kind: "daisangen", count: 2 },
    { kind: "kokushiMusou", count: 1 },
  ],
  records: {
    highestRawScore: { value: 62000, match },
    lowestRawScore: null,
    highestFinalPoint: { value: 50, match },
    lowestFinalPoint: null,
  },
  streaks: [],
};

test("個人記録はモーダルで選択した記録と対局情報を表示する", async () => {
  const [{ render, screen, fireEvent, within }, { StatisticsOverview }] =
    await setup;
  render(
    <StatisticsOverview
      summary={summary as never}
      startingPoints={null}
      startingPointsByLeagueId={{}}
    />
  );
  assert.equal(screen.queryByRole("dialog"), null);
  assert.equal(screen.queryByRole("button", { name: /最低素点/ }), null);
  fireEvent.click(screen.getByRole("button", { name: /最高素点/ }));
  let dialog = screen.getByRole("dialog", { name: "個人記録" });
  assert.ok(within(dialog).getByText("62,000"));
  assert.ok(within(dialog).getByText("2026/11/05 19:42（日本時間）"));
  assert.ok(within(dialog).getByText("花子（2位）"));
  assert.equal(
    within(dialog)
      .getByRole("link", { name: "対局結果を見る" })
      .getAttribute("href"),
    "/v2/league/league-1/season/season-1/sessions/session-1/results"
  );
  fireEvent.click(within(dialog).getByRole("button", { name: "閉じる" }));
  assert.equal(screen.queryByRole("dialog"), null);
  fireEvent.click(screen.getByRole("button", { name: /最高最終ポイント/ }));
  dialog = screen.getByRole("dialog", { name: "個人記録" });
  assert.ok(within(dialog).getByText("+50"));
  assert.ok(within(dialog).getByText("最高最終ポイント"));
});

test("表示する成績が切り替わるとモーダルを閉じる", async () => {
  const [{ render, screen, fireEvent }, { StatisticsOverview }] = await setup;
  const view = render(
    <StatisticsOverview
      summary={summary as never}
      startingPoints={null}
      startingPointsByLeagueId={{}}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: /最高素点/ }));
  assert.ok(screen.getByRole("dialog"));
  view.rerender(
    <StatisticsOverview
      summary={{ ...summary } as never}
      startingPoints={null}
      startingPointsByLeagueId={{}}
    />
  );
  assert.equal(screen.queryByRole("dialog"), null);
});

test("役満の件数と全種類の内訳をモーダルで表示する", async () => {
  const [{ render, screen, fireEvent, within }, { StatisticsOverview }] =
    await setup;
  render(
    <StatisticsOverview
      summary={summary as never}
      startingPoints={null}
      startingPointsByLeagueId={{}}
    />
  );
  const button = screen.getByRole("button", { name: /役満.*3 回/ });
  assert.ok(
    button.compareDocumentPosition(screen.getByText("チョンボ")) &
      Node.DOCUMENT_POSITION_FOLLOWING
  );
  fireEvent.click(button);
  const dialog = screen.getByRole("dialog", { name: "役満の記録" });
  assert.ok(within(dialog).getByText("合計 3 回"));
  const daisangen = within(dialog).getByText("大三元").parentElement!;
  assert.equal(within(daisangen).getByText("2 回").textContent, "2 回");
  const tenhou = within(dialog).getByText("天和").parentElement!;
  assert.equal(within(tenhou).getByText("0 回").textContent, "0 回");
  const kokushi =
    within(dialog).getByText("※括弧内は十三面待ち").parentElement!
      .parentElement!;
  assert.ok(within(kokushi).getByText("1 回"));
  assert.equal(dialog.querySelectorAll("dt").length, 12);
  fireEvent.click(within(dialog).getByRole("button", { name: "閉じる" }));
  assert.equal(screen.queryByRole("dialog"), null);
});

test("特殊待ちは基本の役満に含め、内数を括弧で表示する", async () => {
  const [{ render, screen, fireEvent, within }, { StatisticsOverview }] =
    await setup;
  render(
    <StatisticsOverview
      summary={
        {
          ...summary,
          yakumanCounts: [
            { kind: "kokushiMusou", count: 2 },
            { kind: "kokushi13Wait", count: 1 },
            { kind: "suuankouTanki", count: 2 },
            { kind: "chuurenPoutou", count: 1 },
            { kind: "junseiChuurenPoutou", count: 1 },
          ],
        } as never
      }
      startingPoints={null}
      startingPointsByLeagueId={{}}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: /役満.*7 回/ }));
  const dialog = screen.getByRole("dialog", { name: "役満の記録" });
  assert.ok(within(dialog).getByText("合計 7 回"));
  for (const [note, value] of [
    ["※括弧内は十三面待ち", "3(1) 回"],
    ["※括弧内は単騎待ち", "2(2) 回"],
    ["※括弧内は純正", "2(1) 回"],
  ]) {
    const row = within(dialog).getByText(note).parentElement!.parentElement!;
    assert.ok(within(row).getByText(value));
  }
  assert.equal(within(dialog).queryByText("国士無双十三面待ち"), null);
  assert.equal(dialog.querySelectorAll("dt").length, 12);
});

test("役満の集計を取得できなければ件数を未表示にする", async () => {
  const [{ render, screen }, { StatisticsOverview }] = await setup;
  render(
    <StatisticsOverview
      summary={{ ...summary, yakumanCounts: null } as never}
      startingPoints={null}
      startingPointsByLeagueId={{}}
    />
  );
  assert.equal(screen.queryByRole("button", { name: /役満/ }), null);
  assert.equal(screen.getByText("役満").parentElement?.textContent, "役満—");
});

test("全リーグの成績は順位と記録だけを表示し、役満の詳細を開ける", async () => {
  const [{ render, screen, fireEvent, within }, { StatisticsOverview }] =
    await setup;
  render(
    <StatisticsOverview
      summary={
        {
          ...summary,
          byGameType: [
            {
              gameType: "sanma",
              matchCount: 3,
              averageRank: 2,
              topRate: 1 / 3,
              topTwoRate: 2 / 3,
              topThreeRate: 1,
              lastRate: 1 / 3,
              lastAvoidanceRate: 2 / 3,
              ranks: [1, 2, 3, 4].map((rank) => ({
                rank,
                count: 1,
                rate: 1 / 3,
              })),
            },
          ],
        } as never
      }
      startingPoints={null}
      startingPointsByLeagueId={{}}
      overall
    />
  );
  assert.ok(screen.getByText("3 対局"));
  assert.ok(screen.getByText("3位"));
  assert.equal(screen.queryByText("4位"), null);
  for (const label of [
    "総合ポイント",
    "最高素点",
    "最低素点",
    "最高最終ポイント",
    "最低最終ポイント",
    "連続プラス",
    "連続マイナス",
  ]) {
    assert.equal(screen.queryByText(label), null);
  }
  assert.ok(screen.getByText("連続トップ"));
  assert.ok(screen.getByText("連続ラス"));
  assert.ok(screen.getByText("連続連対"));
  fireEvent.click(screen.getByRole("button", { name: /役満.*3 回/ }));
  assert.ok(
    within(screen.getByRole("dialog", { name: "役満の記録" })).getByText(
      "合計 3 回"
    )
  );
});
