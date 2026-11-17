import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  pretendToBeVisual: true,
  url: "http://localhost",
});
Object.defineProperties(globalThis, {
  React: { configurable: true, value: React },
  self: { configurable: true, value: dom.window },
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  Node: { configurable: true, value: dom.window.Node },
  MutationObserver: { configurable: true, value: dom.window.MutationObserver },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
});
dom.window.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
dom.window.HTMLDialogElement.prototype.close = function () {
  this.open = false;
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

test("各タイトルから該当ランキングを開き、同率を同順位で表示する", async () => {
  const [{ render, screen, fireEvent, within }, { SeasonTitles }] = await setup;
  const first = { userId: "a", userName: "太郎", value: 2 };
  const tied = { userId: "b", userName: "花子", value: 2 };
  const third = { userId: "c", userName: "次郎", value: 0 };
  const season = {
    titleRankings: {
      highestScore: [{ ...first, value: 48000 }],
      avoidLastRate: [{ ...first, value: 100 }],
      top2Rate: [{ ...first, value: 50 }],
      yakuman: [first, tied, third],
    },
  } as React.ComponentProps<typeof SeasonTitles>["season"];
  render(<SeasonTitles season={season} />);

  fireEvent.click(
    screen.getByRole("button", { name: "最多役満のランキングを表示" })
  );
  const dialog = screen.getByRole("dialog", { name: "最多役満ランキング" });
  const table = within(dialog).getByRole("table", {
    name: "最多役満ランキング",
  });
  assert.deepEqual(
    within(table)
      .getAllByRole("columnheader")
      .map((cell) => cell.textContent),
    ["順位", "プレイヤー", "記録"]
  );
  const rows = within(table).getAllByRole("row").slice(1);
  assert.match(rows[0].textContent ?? "", /1位.*太郎.*2回/);
  assert.match(rows[1].textContent ?? "", /1位.*花子.*2回/);
  assert.match(rows[2].textContent ?? "", /3位.*次郎.*0回/);
  fireEvent.click(within(dialog).getByRole("button", { name: "閉じる" }));
  assert.equal(screen.queryByRole("dialog"), null);

  fireEvent.click(
    screen.getByRole("button", { name: "最高スコアのランキングを表示" })
  );
  assert.ok(screen.getByRole("dialog", { name: "最高スコアランキング" }));
});
