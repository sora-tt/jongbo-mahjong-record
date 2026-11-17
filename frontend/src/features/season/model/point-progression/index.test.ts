import assert from "node:assert/strict";
import { test } from "node:test";

import { toSeasonProgressionData } from "./index";

test("参加した対局だけを各人の対局数に並べ、線を最後の参加対局で終える", () => {
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
      { matchIndex: 5, a: 15, b: null, c: null },
    ],
    isEmpty: false,
    isUncomputed: false,
  };

  assert.deepEqual(toSeasonProgressionData(chart), [
    { matchIndex: 0, a: 0, b: 0 },
    { matchIndex: 1, a: 10, b: -5 },
    { matchIndex: 2, a: 20, b: 0 },
    { matchIndex: 3, a: 15 },
  ]);
  assert.equal(chart.data[0].matchIndex, 3);
});

test("選択中のプレイヤーのみで最大対局数を決める", () => {
  assert.deepEqual(
    toSeasonProgressionData({
      series: [{ userId: "b", userName: "二郎" }],
      data: [
        { matchIndex: 1, a: 20, b: null },
        { matchIndex: 2, a: 30, b: 0 },
        { matchIndex: 3, a: 40, b: null },
      ],
      isEmpty: false,
      isUncomputed: false,
    }),
    [
      { matchIndex: 0, b: 0 },
      { matchIndex: 1, b: 0 },
    ]
  );
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
