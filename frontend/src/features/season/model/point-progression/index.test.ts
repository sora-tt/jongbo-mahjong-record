import assert from "node:assert/strict";
import { test } from "node:test";

import { toSeasonProgressionData } from "./index";

test("全員が0ptから始まり、参加しなかった対局は直前の値を保つ", () => {
  const chart = {
    series: [
      { userId: "a", userName: "一郎" },
      { userId: "b", userName: "二郎" },
      { userId: "c", userName: "三郎" },
    ],
    data: [
      { matchIndex: 3, a: 20, b: null, c: null },
      { matchIndex: 1, a: 10, b: null, c: null },
      { matchIndex: 2, a: null, b: -5, c: null },
      { matchIndex: 4, a: null, b: 0, c: null },
    ],
    isEmpty: false,
    isUncomputed: false,
  };

  assert.deepEqual(toSeasonProgressionData(chart), [
    { matchIndex: 0, a: 0, b: 0, c: 0 },
    { matchIndex: 1, a: 10, b: 0, c: 0 },
    { matchIndex: 2, a: 10, b: -5, c: 0 },
    { matchIndex: 3, a: 20, b: -5, c: 0 },
    { matchIndex: 4, a: 20, b: 0, c: 0 },
  ]);
  assert.equal(chart.data[0].matchIndex, 3);
});

test("対局データがない場合は始点だけのグラフを作らない", () => {
  assert.deepEqual(
    toSeasonProgressionData({
      series: [{ userId: "a", userName: "一郎" }],
      data: [],
      isEmpty: true,
      isUncomputed: false,
    }),
    []
  );
});
