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
  Element: { configurable: true, value: dom.window.Element },
  Node: { configurable: true, value: dom.window.Node },
  MutationObserver: { configurable: true, value: dom.window.MutationObserver },
  requestAnimationFrame: {
    configurable: true,
    value: dom.window.requestAnimationFrame.bind(dom.window),
  },
  cancelAnimationFrame: {
    configurable: true,
    value: dom.window.cancelAnimationFrame.bind(dom.window),
  },
  getComputedStyle: {
    configurable: true,
    value: dom.window.getComputedStyle.bind(dom.window),
  },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
});
dom.window.HTMLElement.prototype.getBoundingClientRect = () => ({
  x: 0,
  y: 0,
  width: 320,
  height: 192,
  top: 0,
  right: 320,
  bottom: 192,
  left: 0,
  toJSON: () => ({}),
});
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(globalThis, "ResizeObserver", {
  configurable: true,
  value: ResizeObserverMock,
});
const setup = Promise.all([
  import("@testing-library/react"),
  import("./index"),
]);
afterEach(async () => {
  const [testing] = await setup;
  testing.cleanup();
});

test("月間の棒と累計の最新点にポイントを表示する", async () => {
  const [{ render, screen, waitFor }, { StatisticsTrend }] = await setup;
  const analysis = {
    status: "ready",
    breakdown: {
      dimension: "period",
      rows: [
        { key: "2026-06", label: "6月", totalPoints: 10.4, matchCount: 2 },
        { key: "2026-07", label: "7月", totalPoints: -2.1, matchCount: 3 },
        { key: "2026-08", label: "8月", totalPoints: 14.2, matchCount: 4 },
      ],
    },
  };
  render(<StatisticsTrend analysis={analysis as never} />);
  const monthly = screen.getByRole("img", {
    name: "月別の総合ポイントを示す棒グラフ",
  });
  const cumulative = screen.getByRole("img", {
    name: "累計ポイントの折れ線グラフ",
  });
  await waitFor(
    () => {
      assert.deepEqual(
        [...monthly.querySelectorAll(".recharts-label-list text")].map(
          (x) => x.textContent
        ),
        ["+10.4", "-2.1", "+14.2"]
      );
      assert.deepEqual(
        [...cumulative.querySelectorAll(".recharts-label-list text")].map(
          (x) => x.textContent
        ),
        ["+22.5"]
      );
    },
    { timeout: 4000 }
  );
});

test("マイナスのポイントが月ラベルの上に重ならず表示される", async () => {
  const [{ render, screen, waitFor }, { StatisticsTrend }] = await setup;
  const analysis = {
    status: "ready",
    breakdown: {
      dimension: "period",
      rows: [
        { key: "2026-06", label: "6月", totalPoints: -40, matchCount: 1 },
        { key: "2026-07", label: "7月", totalPoints: -15, matchCount: 1 },
      ],
    },
  };
  render(<StatisticsTrend analysis={analysis as never} />);
  const chart = screen.getByRole("img", {
    name: "月別の総合ポイントを示す棒グラフ",
  });
  await waitFor(() => {
    const labels = [...chart.querySelectorAll(".recharts-label-list text")];
    const gridLines = [
      ...chart.querySelectorAll(".recharts-cartesian-grid-horizontal line"),
    ];
    assert.equal(labels.length, 2);
    assert.ok(gridLines.length > 0);
    const plotBottom = Math.max(
      ...gridLines.map((line) => Number(line.getAttribute("y1")))
    );
    for (const label of labels) {
      assert.ok(Number(label.getAttribute("y")) <= plotBottom - 6);
    }
  });
});
