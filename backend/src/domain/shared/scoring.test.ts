import assert from "node:assert/strict";
import test from "node:test";
import { calculateMatchPoints } from "@/domain/shared/scoring.js";

const yonmaRule = {
  gameType: "yonma" as const,
  uma: { first: 20, second: 10, third: -10, fourth: -20 },
  oka: { startingPoints: 25000, returnPoints: 30000 },
};

const sanmaRule = {
  gameType: "sanma" as const,
  uma: { first: 20, second: 10, third: -30, fourth: null },
  oka: { startingPoints: 25000, returnPoints: 30000 },
};

test("calculates yonma rank and zero-sum points without trusting rank input", () => {
  const results = calculateMatchPoints(yonmaRule, [
    { userId: "u1", userName: "A", wind: "east", rawScore: 35000 },
    { userId: "u2", userName: "B", wind: "south", rawScore: 25000 },
    { userId: "u3", userName: "C", wind: "west", rawScore: 20000 },
    { userId: "u4", userName: "D", wind: "north", rawScore: 20000 },
  ]);

  assert.deepEqual(
    results.map(({ userId, rank, point }) => ({ userId, rank, point })),
    [
      { userId: "u1", rank: 1, point: 45 },
      { userId: "u2", rank: 2, point: 5 },
      { userId: "u3", rank: 3, point: -25 },
      { userId: "u4", rank: 3, point: -25 },
    ],
  );
  assert.equal(
    results.reduce((total, result) => total + result.point, 0),
    0,
  );
});

test("calculates sanma with only east/south/west winds", () => {
  const results = calculateMatchPoints(sanmaRule, [
    { userId: "u1", userName: "A", wind: "east", rawScore: 35000 },
    { userId: "u2", userName: "B", wind: "south", rawScore: 25000 },
    { userId: "u3", userName: "C", wind: "west", rawScore: 15000 },
  ]);

  assert.deepEqual(
    results.map(({ rank, point }) => ({ rank, point })),
    [
      { rank: 1, point: 40 },
      { rank: 2, point: 5 },
      { rank: 3, point: -45 },
    ],
  );
  assert.equal(
    results.some((result) => result.rank === 4),
    false,
  );
});

test("rejects a wind that is not allowed by the game type", () => {
  assert.throws(
    () =>
      calculateMatchPoints(sanmaRule, [
        { userId: "u1", userName: "A", wind: "east", rawScore: 35000 },
        { userId: "u2", userName: "B", wind: "south", rawScore: 25000 },
        { userId: "u3", userName: "C", wind: "north", rawScore: 15000 },
      ]),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "wind is not allowed for sanma",
  );
});

test("rejects a raw score total that does not match the table total", () => {
  assert.throws(
    () =>
      calculateMatchPoints(yonmaRule, [
        { userId: "u1", userName: "A", wind: "east", rawScore: 35000 },
        { userId: "u2", userName: "B", wind: "south", rawScore: 25000 },
        { userId: "u3", userName: "C", wind: "west", rawScore: 20000 },
        { userId: "u4", userName: "D", wind: "north", rawScore: 19000 },
      ]),
    /rawScore total does not match table total/,
  );
});
