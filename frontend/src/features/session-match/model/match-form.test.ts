import assert from "node:assert/strict";
import test from "node:test";

import {
  addYakumanEvent,
  createEmptyMatchFormValues,
  removeYakumanEvent,
  setYakumanEnabled,
  toMatchFormValues,
  validateMatchForm,
  type MatchFormValues,
  type MatchValidationInput,
  type YakumanFormEntry,
} from "./match-form";
import { getParticipantConstraint } from "./participants";

import type { ApiMatch } from "@/lib/api/contracts";

const allowedMembers = [
  { userId: "user-1", userName: "A" },
  { userId: "user-2", userName: "B" },
  { userId: "user-3", userName: "C" },
  { userId: "user-4", userName: "D" },
] as unknown as MatchValidationInput["allowedMembers"];

const makeValues = (
  overrides: Partial<MatchFormValues> = {}
): MatchFormValues => ({
  ...createEmptyMatchFormValues(),
  playedAt: "2026-01-01T00:00:00.000Z",
  userIdByWind: {
    east: "user-1",
    south: "user-2",
    west: "user-3",
    north: "user-4",
  },
  rawScoreByWind: {
    east: "400",
    south: "300",
    west: "200",
    north: "100",
  },
  ...overrides,
});

const validate = (values: MatchFormValues) =>
  validateMatchForm({
    values,
    constraint: getParticipantConstraint("yonma"),
    allowedMembers,
    startingPoints: 25_000,
    allowOffTableKyotaku: false,
    mode: "edit",
  });

const selectedEntry = (
  winnerUserId: string,
  kind: ApiMatch["yakumanEvents"][number]["kind"]
): YakumanFormEntry => ({ winnerUserId, kind });

test("a Match can be saved without yakuman records", () => {
  const values = makeValues();

  const result = validate(values);

  assert.equal(result.message, null);
  assert.deepEqual(result.yakumanEvents, []);
  assert.deepEqual(
    result.results?.map(({ userId, rawScore }) => ({ userId, rawScore })),
    [
      { userId: "user-1", rawScore: 40_000 },
      { userId: "user-2", rawScore: 30_000 },
      { userId: "user-3", rawScore: 20_000 },
      { userId: "user-4", rawScore: 10_000 },
    ]
  );
});

test("enabled yakuman rows require a winner and kind while keeping score input intact", () => {
  const values = makeValues({
    yakumanEnabled: true,
    yakumanEvents: [{ winnerUserId: null, kind: null }],
  });

  const result = validate(values);

  assert.equal(result.message, "役満記録を確認してください");
  assert.equal(result.results, null);
  assert.deepEqual(result.yakumanErrors, [
    { index: 0, message: "和了者と役満種を選択してください" },
  ]);
  assert.equal(values.rawScoreByWind.east, "400");
  assert.equal(values.rawScoreByWind.north, "100");
});

test("composite yakuman events keep the selected winners and input order", () => {
  const yakumanEvents = [
    selectedEntry("user-1", "daisangen"),
    selectedEntry("user-1", "tsuuiisou"),
    selectedEntry("user-2", "kokushi13Wait"),
  ];
  const result = validate(makeValues({ yakumanEnabled: true, yakumanEvents }));

  assert.equal(result.message, null);
  assert.deepEqual(result.yakumanEvents, yakumanEvents);
});

test("an enabled yakuman winner must be one of the selected Match participants", () => {
  const result = validate(
    makeValues({
      yakumanEnabled: true,
      yakumanEvents: [selectedEntry("outside-user", "daisangen")],
    })
  );

  assert.equal(result.message, "役満記録を確認してください");
  assert.deepEqual(result.yakumanErrors, [
    { index: 0, message: "和了者はMatchの参加者から選択してください" },
  ]);
});

test("editing a saved Match restores yakuman state and each selected event", () => {
  const match = {
    playedAt: "2026-01-01T00:00:00.000Z",
    results: [
      { userId: "user-1", wind: "east", rawScore: 40_000 },
      { userId: "user-2", wind: "south", rawScore: 30_000 },
      { userId: "user-3", wind: "west", rawScore: 20_000 },
      { userId: "user-4", wind: "north", rawScore: 10_000 },
    ],
    chomboEvents: [],
    offTableKyotakuCount: 0,
    yakumanEvents: [
      { winnerUserId: "user-1", kind: "suuankouTanki" },
      { winnerUserId: "user-1", kind: "junseiChuurenPoutou" },
    ],
  } as unknown as ApiMatch;

  const values = toMatchFormValues(match);

  assert.equal(values.yakumanEnabled, true);
  assert.deepEqual(values.yakumanEvents, match.yakumanEvents);
});

test("enabling yakuman creates one empty row and disabling retains drafts for re-enable", () => {
  const values = makeValues();
  const enabled = setYakumanEnabled(values, true);

  assert.equal(enabled.yakumanEnabled, true);
  assert.deepEqual(enabled.yakumanEvents, [{ winnerUserId: null, kind: null }]);

  const withDraft = {
    ...enabled,
    yakumanEvents: [selectedEntry("user-1", "daisangen")],
  };
  const disabled = setYakumanEnabled(withDraft, false);
  assert.equal(disabled.yakumanEnabled, false);
  assert.deepEqual(disabled.yakumanEvents, withDraft.yakumanEvents);
  assert.deepEqual(validate(disabled).yakumanEvents, []);

  const reenabled = setYakumanEnabled(disabled, true);
  assert.equal(reenabled.yakumanEnabled, true);
  assert.deepEqual(reenabled.yakumanEvents, withDraft.yakumanEvents);
});

test("adding a row retains previous choices and only follows a complete row", () => {
  const incomplete = makeValues({
    yakumanEnabled: true,
    yakumanEvents: [{ winnerUserId: "user-1", kind: null }],
  });
  assert.equal(addYakumanEvent(incomplete), incomplete);

  const complete = makeValues({
    yakumanEnabled: true,
    yakumanEvents: [selectedEntry("user-1", "daisangen")],
  });
  const expanded = addYakumanEvent(complete);
  assert.deepEqual(expanded.yakumanEvents, [
    selectedEntry("user-1", "daisangen"),
    { winnerUserId: null, kind: null },
  ]);
  assert.equal(expanded.rawScoreByWind.east, complete.rawScoreByWind.east);
});

test("removing the final yakuman row turns yakuman off", () => {
  const values = makeValues({
    yakumanEnabled: true,
    yakumanEvents: [selectedEntry("user-1", "daisangen")],
  });

  const removed = removeYakumanEvent(values, 0);

  assert.equal(removed.yakumanEnabled, false);
  assert.deepEqual(removed.yakumanEvents, []);
});
