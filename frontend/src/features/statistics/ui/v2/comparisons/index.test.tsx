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
const setup = Promise.all([
  import("@testing-library/react"),
  import("./index"),
]);
afterEach(async () => {
  const [testing] = await setup;
  testing.cleanup();
});

test("対戦相手の情報をリストにまとめ、ポイント差を符号別に表示する", async () => {
  const [{ render, screen, within, fireEvent }, { StatisticsComparisons }] =
    await setup;
  const opponentAnalysis = {
    status: "ready",
    scope: { scopeType: "overall", gameType: "all" },
    breakdown: {
      dimension: "opponent",
      nextCursor: "next-page",
      rows: [
        {
          userId: "user-1",
          userName: "長谷川太郎",
          gameType: "yonma",
          encounterCount: 10,
          averagePointDifference: 2.5,
          aboveRate: 0.6,
        },
        {
          userId: "user-2",
          userName: "次郎",
          gameType: "sanma",
          encounterCount: 1,
          averagePointDifference: -10,
          aboveRate: null,
        },
      ],
    },
  };
  let cursor = "";
  render(
    <StatisticsComparisons
      opponentAnalysis={opponentAnalysis as never}
      seatAnalysis={null}
      subjectLabel="本人"
      scopeLabel="全体"
      isLoadingMore={false}
      loadMoreError={null}
      onLoadMore={(next) => {
        cursor = next;
      }}
    />
  );
  const list = screen.getByRole("list", { name: "対戦相手別成績" });
  const [first, second] = within(list).getAllByRole("listitem");
  const name = within(first).getByTitle("長谷川太郎");
  assert.ok(name.className.includes("truncate"));
  assert.match(first.textContent ?? "", /四麻・10局・上位率 60.0%/);
  assert.ok(
    within(first).getByText("+2.5 pt").className.includes("text-blue-600")
  );
  assert.match(second.textContent ?? "", /三麻・1局・上位率 —/);
  assert.ok(
    within(second).getByText("-10 pt").className.includes("text-v2-danger")
  );
  assert.equal(screen.queryByText("同卓した相手とのポイント差（pt）"), null);
  fireEvent.click(screen.getByRole("button", { name: "さらに表示" }));
  assert.equal(cursor, "next-page");
});

test("席別は東南西北の4つを表示し、形式混在時は対局数で集計する", async () => {
  const [{ render, screen, within }, { StatisticsComparisons }] = await setup;
  const opponentAnalysis = {
    status: "ready",
    scope: { scopeType: "overall", gameType: "all" },
    breakdown: { dimension: "opponent", rows: [], nextCursor: null },
  };
  const seatAnalysis = {
    status: "ready",
    breakdown: {
      dimension: "seat",
      rows: [
        {
          key: "east",
          gameType: "sanma",
          matchCount: 2,
          totalPoints: 20,
          rankCounts: [{ rank: 1, count: 1 }],
        },
        {
          key: "east",
          gameType: "yonma",
          matchCount: 1,
          totalPoints: -5,
          rankCounts: [{ rank: 1, count: 1 }],
        },
        {
          key: "west",
          gameType: "yonma",
          matchCount: 1,
          totalPoints: -10,
          rankCounts: [{ rank: 1, count: 0 }],
        },
      ],
    },
  };
  render(
    <StatisticsComparisons
      opponentAnalysis={opponentAnalysis as never}
      seatAnalysis={seatAnalysis as never}
      subjectLabel="本人"
      scopeLabel="全体"
      isLoadingMore={false}
      loadMoreError={null}
      onLoadMore={() => {}}
    />
  );
  const list = screen.getByRole("list", { name: "席別成績" });
  const rows = within(list).getAllByRole("listitem");
  assert.equal(rows.length, 4);
  assert.deepEqual(
    rows.map((row) => row.querySelector("span")?.textContent),
    ["東", "南", "西", "北"]
  );
  assert.match(rows[0].textContent ?? "", /3局・トップ率 66.7%/);
  assert.ok(within(rows[0]).getByText("+5 pt"));
  assert.ok(within(rows[2]).getByText("-10 pt"));
  assert.equal(within(rows[1]).getAllByText("—").length, 1);
  assert.match(rows[1].textContent ?? "", /—・トップ率 —/);
  assert.equal(within(rows[3]).getAllByText("—").length, 1);
  assert.equal(within(list).queryByText(/3位|4位/), null);
  assert.equal(screen.queryByText("東南西北ごとの成績"), null);
});
