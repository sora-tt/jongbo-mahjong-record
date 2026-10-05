import { strictEqual } from "node:assert";
import test from "node:test";

import { getNextStatisticsView } from "./view-tabs";

test("left and right arrow keys move through the four views cyclically", () => {
  strictEqual(getNextStatisticsView("overview", "ArrowRight"), "trend");
  strictEqual(getNextStatisticsView("trend", "ArrowRight"), "comparisons");
  strictEqual(getNextStatisticsView("comparisons", "ArrowRight"), "history");
  strictEqual(getNextStatisticsView("history", "ArrowRight"), "overview");
  strictEqual(getNextStatisticsView("overview", "ArrowLeft"), "history");
  strictEqual(getNextStatisticsView("history", "ArrowLeft"), "comparisons");
  strictEqual(getNextStatisticsView("comparisons", "ArrowLeft"), "trend");
  strictEqual(getNextStatisticsView("trend", "ArrowLeft"), "overview");
});

test("Home and End keys move to the first and last views", () => {
  strictEqual(getNextStatisticsView("history", "Home"), "overview");
  strictEqual(getNextStatisticsView("overview", "End"), "history");
});

test("unhandled keys do not change the selected view", () => {
  strictEqual(getNextStatisticsView("trend", "Enter"), null);
});
