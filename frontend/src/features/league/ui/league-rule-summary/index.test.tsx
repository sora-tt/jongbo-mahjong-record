import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";

import { LeagueRuleSummary } from "./index";

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
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
});

const setup = import("@testing-library/react");
afterEach(async () => (await setup).cleanup());

test("floating points dialog opens and closes through its controls", async () => {
  const { render, fireEvent, screen } = await setup;
  let opened = false;
  let closed = false;
  dom.window.HTMLDialogElement.prototype.showModal = () => {
    opened = true;
  };
  dom.window.HTMLDialogElement.prototype.close = () => {
    closed = true;
  };
  const points = { first: 10, second: 5, third: -5, fourth: -10 };
  render(
    <LeagueRuleSummary
      rule={{
        gameType: "yonma",
        uma: {
          mode: "floatingCount",
          pointsByFloatingCount: {
            0: points,
            1: points,
            2: points,
            3: points,
            4: points,
          },
        },
        oka: { startingPoints: 25000, returnPoints: 25000 },
        chomboPenaltyPoints: 0,
        allowOffTableKyotaku: false,
        rotateSeatOrder: false,
      }}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "浮き人数別（詳細）" }));
  fireEvent.click(screen.getByRole("button", { name: "閉じる", hidden: true }));
  assert.equal(opened, true);
  assert.equal(closed, true);
});
