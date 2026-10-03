import { strictEqual } from "node:assert";
import test from "node:test";

import { getNextStatisticsView } from "./view-tabs";

test("left and right arrow keys move through the three views cyclically", () => {
  strictEqual(getNextStatisticsView("overview", "ArrowRight"), "analysis");
  strictEqual(getNextStatisticsView("analysis", "ArrowRight"), "history");
  strictEqual(getNextStatisticsView("history", "ArrowRight"), "overview");
  strictEqual(getNextStatisticsView("overview", "ArrowLeft"), "history");
  strictEqual(getNextStatisticsView("history", "ArrowLeft"), "analysis");
  strictEqual(getNextStatisticsView("analysis", "ArrowLeft"), "overview");
});

test("Home and End keys move to the first and last views", () => {
  strictEqual(getNextStatisticsView("history", "Home"), "overview");
  strictEqual(getNextStatisticsView("overview", "End"), "history");
});

test("unhandled keys do not change the selected view", () => {
  strictEqual(getNextStatisticsView("analysis", "Enter"), null);
});
