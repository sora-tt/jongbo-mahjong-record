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

const setup = Promise.all([
  import("@testing-library/react"),
  import("./index"),
]);
afterEach(async () => {
  const [testing] = await setup;
  testing.cleanup();
});

test("凡例は背景なしで選択状態を示し、タップで切り替える", async () => {
  const [{ render, screen, fireEvent }, { SeasonProgress }] = await setup;
  const toggled: string[] = [];
  const props: React.ComponentProps<typeof SeasonProgress> = {
    pointProgressionChart: {
      isEmpty: true,
      isUncomputed: false,
      series: [],
      data: [],
    },
    chartSeries: [
      {
        userId: "user-1",
        userName: "太郎",
        colorClassName: "bg-chart-series-1",
        strokeColor: "var(--chart-series-1)",
      },
      {
        userId: "user-2",
        userName: "花子",
        colorClassName: "bg-chart-series-2",
        strokeColor: "var(--chart-series-2)",
      },
    ],
    visibleUserIds: ["user-1"],
    handleToggleChartSeries: (id: string) => toggled.push(id),
  };
  render(<SeasonProgress {...props} />);

  const visible = screen.getByRole("button", { name: "太郎" });
  const hidden = screen.getByRole("button", { name: "花子" });
  assert.equal(visible.getAttribute("aria-pressed"), "true");
  assert.equal(hidden.getAttribute("aria-pressed"), "false");
  assert.match(visible.className, /!bg-transparent/);
  assert.doesNotMatch(visible.className, /!bg-v2-brand-soft/);
  fireEvent.click(visible);
  assert.deepEqual(toggled, ["user-1"]);
});
