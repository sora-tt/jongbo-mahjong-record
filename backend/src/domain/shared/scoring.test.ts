import assert from "node:assert/strict";
import test from "node:test";
import { calculateMatchPoints } from "@/domain/shared/scoring.js";

const yonmaRule = {
  gameType: "yonma" as const,
  uma: {
    mode: "fixed" as const,
    first: 20,
    second: 10,
    third: -10,
    fourth: -20,
  },
  oka: { startingPoints: 25000, returnPoints: 30000 },
  chomboPenaltyPoints: 0,
  allowOffTableKyotaku: false,
};

const sanmaRule = {
  gameType: "sanma" as const,
  uma: {
    mode: "fixed" as const,
    first: 20,
    second: 10,
    third: -30,
    fourth: null,
  },
  oka: { startingPoints: 25000, returnPoints: 30000 },
  chomboPenaltyPoints: 0,
  allowOffTableKyotaku: false,
};

const floatingCountRule = {
  gameType: "yonma" as const,
  uma: {
    mode: "floatingCount" as const,
    pointsByFloatingCount: {
      0: { first: 0, second: 0, third: 0, fourth: 0 },
      1: { first: 12, second: -1, third: -3, fourth: -8 },
      2: { first: 8, second: 4, third: -4, fourth: -8 },
      3: { first: 8, second: 3, third: 1, fourth: -12 },
      4: { first: 0, second: 0, third: 0, fourth: 0 },
    },
  },
  oka: { startingPoints: 25000, returnPoints: 25000 },
  chomboPenaltyPoints: 0,
  allowOffTableKyotaku: false,
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

test("uses the zero-floating row when every score is at or below the return points", () => {
  const rule = {
    ...floatingCountRule,
    oka: { startingPoints: 20000, returnPoints: 25000 },
    chomboPenaltyPoints: 0,
    allowOffTableKyotaku: false,
  };
  const results = calculateMatchPoints(rule, [
    { userId: "u1", userName: "A", wind: "east", rawScore: 24000 },
    { userId: "u2", userName: "B", wind: "south", rawScore: 21000 },
    { userId: "u3", userName: "C", wind: "west", rawScore: 19000 },
    { userId: "u4", userName: "D", wind: "north", rawScore: 16000 },
  ]);

  assert.deepEqual(
    results.map(({ rank, point }) => ({ rank, point })),
    [
      { rank: 1, point: 19 },
      { rank: 2, point: -4 },
      { rank: 3, point: -6 },
      { rank: 4, point: -9 },
    ],
  );
  assert.equal(
    results.reduce((total, result) => total + result.point, 0),
    0,
  );
});

test("counts a score equal to the return points as floating", () => {
  const results = calculateMatchPoints(floatingCountRule, [
    { userId: "u1", userName: "A", wind: "east", rawScore: 40000 },
    { userId: "u2", userName: "B", wind: "south", rawScore: 25000 },
    { userId: "u3", userName: "C", wind: "west", rawScore: 20000 },
    { userId: "u4", userName: "D", wind: "north", rawScore: 15000 },
  ]);

  assert.deepEqual(
    results.map(({ rank, point }) => ({ rank, point })),
    [
      { rank: 1, point: 23 },
      { rank: 2, point: 4 },
      { rank: 3, point: -9 },
      { rank: 4, point: -18 },
    ],
  );
  assert.equal(
    results.reduce((total, result) => total + result.point, 0),
    0,
  );
});

test("uses the two-floating row", () => {
  const results = calculateMatchPoints(floatingCountRule, [
    { userId: "u1", userName: "A", wind: "east", rawScore: 40000 },
    { userId: "u2", userName: "B", wind: "south", rawScore: 30000 },
    { userId: "u3", userName: "C", wind: "west", rawScore: 20000 },
    { userId: "u4", userName: "D", wind: "north", rawScore: 10000 },
  ]);

  assert.deepEqual(
    results.map(({ rank, point }) => ({ rank, point })),
    [
      { rank: 1, point: 23 },
      { rank: 2, point: 9 },
      { rank: 3, point: -9 },
      { rank: 4, point: -23 },
    ],
  );
  assert.equal(
    results.reduce((total, result) => total + result.point, 0),
    0,
  );
});

test("uses the three-floating row", () => {
  const results = calculateMatchPoints(floatingCountRule, [
    { userId: "u1", userName: "A", wind: "east", rawScore: 40000 },
    { userId: "u2", userName: "B", wind: "south", rawScore: 30000 },
    { userId: "u3", userName: "C", wind: "west", rawScore: 26000 },
    { userId: "u4", userName: "D", wind: "north", rawScore: 4000 },
  ]);

  assert.deepEqual(
    results.map(({ rank, point }) => ({ rank, point })),
    [
      { rank: 1, point: 23 },
      { rank: 2, point: 8 },
      { rank: 3, point: 2 },
      { rank: 4, point: -33 },
    ],
  );
  assert.equal(
    results.reduce((total, result) => total + result.point, 0),
    0,
  );
});

test("uses the four-floating row", () => {
  const rule = {
    ...floatingCountRule,
    oka: { startingPoints: 25000, returnPoints: 20000 },
    chomboPenaltyPoints: 0,
    allowOffTableKyotaku: false,
  };
  const results = calculateMatchPoints(rule, [
    { userId: "u1", userName: "A", wind: "east", rawScore: 28000 },
    { userId: "u2", userName: "B", wind: "south", rawScore: 26000 },
    { userId: "u3", userName: "C", wind: "west", rawScore: 24000 },
    { userId: "u4", userName: "D", wind: "north", rawScore: 22000 },
  ]);

  assert.deepEqual(
    results.map(({ rank, point }) => ({ rank, point })),
    [
      { rank: 1, point: -12 },
      { rank: 2, point: 6 },
      { rank: 3, point: 4 },
      { rank: 4, point: 2 },
    ],
  );
  assert.equal(
    results.reduce((total, result) => total + result.point, 0),
    0,
  );
});

test("averages floating-count points across occupied rank slots for a tie", () => {
  const results = calculateMatchPoints(floatingCountRule, [
    { userId: "u1", userName: "A", wind: "east", rawScore: 32000 },
    { userId: "u2", userName: "B", wind: "south", rawScore: 32000 },
    { userId: "u3", userName: "C", wind: "west", rawScore: 20000 },
    { userId: "u4", userName: "D", wind: "north", rawScore: 16000 },
  ]);

  assert.deepEqual(
    results.map(({ rank, point }) => ({ rank, point })),
    [
      { rank: 1, point: 13 },
      { rank: 1, point: 13 },
      { rank: 3, point: -9 },
      { rank: 4, point: -17 },
    ],
  );
  assert.equal(
    results.reduce((total, result) => total + result.point, 0),
    0,
  );
});

test("returns deterministic ranks and points for the same floating-count input", () => {
  const inputs = [
    { userId: "u1", userName: "A", wind: "east" as const, rawScore: 32000 },
    { userId: "u2", userName: "B", wind: "south" as const, rawScore: 32000 },
    { userId: "u3", userName: "C", wind: "west" as const, rawScore: 20000 },
    { userId: "u4", userName: "D", wind: "north" as const, rawScore: 16000 },
  ];

  assert.deepEqual(
    calculateMatchPoints(floatingCountRule, inputs),
    calculateMatchPoints(floatingCountRule, inputs),
  );
});

test("adds oka independently and rounds tied points to one decimal place", () => {
  const rule = {
    ...floatingCountRule,
    uma: {
      mode: "floatingCount" as const,
      pointsByFloatingCount: {
        ...floatingCountRule.uma.pointsByFloatingCount,
        1: { first: 8, second: 1, third: -1, fourth: -8 },
      },
    },
    oka: { startingPoints: 25000, returnPoints: 30000 },
    chomboPenaltyPoints: 0,
    allowOffTableKyotaku: false,
  };
  const results = calculateMatchPoints(rule, [
    { userId: "u1", userName: "A", wind: "east", rawScore: 31000 },
    { userId: "u2", userName: "B", wind: "south", rawScore: 23000 },
    { userId: "u3", userName: "C", wind: "west", rawScore: 23000 },
    { userId: "u4", userName: "D", wind: "north", rawScore: 23000 },
  ]);

  assert.deepEqual(
    results.map(({ rank, point }) => ({ rank, point })),
    [
      { rank: 1, point: 29 },
      { rank: 2, point: -9.7 },
      { rank: 2, point: -9.7 },
      { rank: 2, point: -9.7 },
    ],
  );
  assert.ok(
    Math.abs(results.reduce((total, result) => total + result.point, 0) + 0.1) <
      1e-9,
  );
});
