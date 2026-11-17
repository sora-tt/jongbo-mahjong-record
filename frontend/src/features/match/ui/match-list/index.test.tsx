import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";

import type { toMatchList } from "@/features/match/model/adapter";

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

test("APIの成績と追加記録を表示し、編集・削除の対象を渡す", async () => {
  const [{ render, screen, fireEvent, within }, { MatchList }] = await setup;
  const matches = [
    {
      id: "m1",
      matchIndex: 1,
      playedAt: "2026-01-01T00:00:00Z",
      results: [
        {
          userId: "a",
          userName: "一郎",
          wind: "east",
          rawScore: 40000,
          rank: 1,
          point: 23,
        },
        {
          userId: "b",
          userName: "二郎",
          wind: "south",
          rawScore: 10000,
          rank: 2,
          point: -23,
        },
      ],
      chomboEvents: [{ offenderUserId: "b" }],
      offTableKyotakuCount: 1,
      yakumanEvents: [{ winnerUserId: "a", kind: "daisangen" }],
    },
  ] as unknown as ReturnType<typeof toMatchList>;
  let edited = "";
  let deleted = "";
  const props = {
    players: [
      { userId: "a", userName: "一郎" },
      { userId: "b", userName: "二郎" },
    ],
    matches,
    deletingMatchId: null,
    onEdit: (id: string) => {
      edited = id;
    },
    onDelete: (id: string) => {
      deleted = id;
    },
  };
  const { rerender } = render(<MatchList {...props} editable={false} />);
  assert.equal(screen.queryByRole("button", { name: "対局 1 を編集" }), null);
  assert.equal(screen.queryByRole("button", { name: "対局 1 を削除" }), null);
  assert.equal(screen.queryByRole("columnheader", { name: "操作" }), null);
  assert.ok(screen.getByRole("button", { name: "対局 1 の詳細" }));
  rerender(<MatchList {...props} editable />);
  assert.equal(screen.getAllByText("+23.0").length, 2);
  fireEvent.click(screen.getAllByText("+23.0")[0]);
  const dialog = screen.getByRole("dialog", { name: "対局詳細 #1" });
  assert.ok(within(dialog).getByText("40,000"));
  assert.ok(within(dialog).getByText("役満：一郎（大三元）"));
  assert.ok(within(dialog).getByText("チョンボ：二郎"));
  fireEvent.click(within(dialog).getByRole("button", { name: "閉じる" }));
  assert.equal(screen.queryByRole("dialog"), null);
  fireEvent.click(screen.getByRole("button", { name: "対局 1 を編集" }));
  assert.equal(screen.queryByRole("dialog"), null);
  fireEvent.click(screen.getByRole("button", { name: "対局 1 を削除" }));
  assert.equal(screen.queryByRole("dialog"), null);
  assert.equal(edited, "m1");
  assert.equal(deleted, "m1");
  fireEvent.click(screen.getByRole("button", { name: "対局 1 の詳細" }));
  assert.ok(screen.getByRole("dialog", { name: "対局詳細 #1" }));
});
