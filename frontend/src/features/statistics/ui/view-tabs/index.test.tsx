import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";

import type { StatisticsView } from "@/features/statistics/model/query-cache";

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

test("タブの選択に合わせて背景と表示内容が移動する", async () => {
  const [{ render, screen, fireEvent }, { StatisticsViewTabs }] = await setup;
  const Harness = () => {
    const [active, setActive] = React.useState<StatisticsView>("overview");
    return (
      <StatisticsViewTabs
        activeView={active}
        onActiveViewChange={setActive}
        panels={{
          overview: "総合内容",
          trend: "推移内容",
          comparisons: null,
          history: null,
        }}
      />
    );
  };
  render(<Harness />);
  const tablist = screen.getByRole("tablist", { name: "成績表示" });
  const indicator = tablist.querySelector(
    "[aria-hidden='true']"
  ) as HTMLElement;
  assert.match(indicator.style.transform, /0%/);
  fireEvent.click(screen.getByRole("tab", { name: "推移" }));
  assert.equal(
    screen.getByRole("tab", { name: "推移" }).getAttribute("aria-selected"),
    "true"
  );
  assert.equal(screen.getByRole("tabpanel").textContent, "推移内容");
  assert.match(indicator.style.transform, /100%/);
  assert.match(indicator.className, /transition-transform/);
});
