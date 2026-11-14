import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";

import type { MatchFormValues } from "@/features/session-match/model/match-form";
import type { SessionMember } from "@/features/session-match/model/participants";

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
  import("@/features/session-match/model/match-form"),
  import("@/features/session-match/model/participants"),
]);
afterEach(async () => {
  const [testing] = await setup;
  testing.cleanup();
});
const members = ["一郎", "二郎", "三郎", "四郎"].map((userName, i) => ({
  userId: `member-${i + 1}`,
  userName,
})) as SessionMember[];

test("対局入力で符号、席の入れ替え、役満と外卓記録を保持する", async () => {
  const [
    { render, screen, fireEvent },
    { MatchForm },
    { createEmptyMatchFormValues, validateMatchForm },
    { getParticipantConstraint },
  ] = await setup;
  const initial: MatchFormValues = {
    ...createEmptyMatchFormValues(),
    userIdByWind: {
      east: "member-1",
      south: "member-2",
      west: "member-3",
      north: "member-4",
    },
    rawScoreByWind: { east: "250", south: "250", west: "250", north: "250" },
  };
  const constraint = getParticipantConstraint("yonma");
  let current = initial;
  const Harness = () => {
    const [values, setValues] = React.useState(initial);
    current = values;
    return (
      <MatchForm
        mode="initial"
        values={values}
        constraint={constraint}
        members={members}
        chomboPenaltyPoints={4000}
        allowOffTableKyotaku
        error={null}
        isSubmitting={false}
        onChange={setValues}
        onSubmit={() => {}}
        onBack={() => {}}
      />
    );
  };
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "東をマイナスにする" }));
  fireEvent.change(screen.getByLabelText("東の素点"), {
    target: { value: "50" },
  });
  assert.equal(current.rawScoreByWind.east, "-50");
  fireEvent.change(screen.getByLabelText("東のプレイヤー"), {
    target: { value: "member-2" },
  });
  assert.equal(current.userIdByWind.east, "member-2");
  assert.equal(current.userIdByWind.south, "member-1");
  fireEvent.click(screen.getByRole("checkbox", { name: "役満記録を入力" }));
  fireEvent.change(screen.getByLabelText("和了者"), {
    target: { value: "member-2" },
  });
  fireEvent.change(screen.getByLabelText("役満種"), {
    target: { value: "daisangen" },
  });
  fireEvent.click(screen.getByRole("button", { name: "＋ 役満を追加" }));
  assert.equal(current.yakumanEvents.length, 2);
  fireEvent.click(screen.getByRole("checkbox", { name: "外卓記録を入力" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "卓外へ供託がある" }));
  assert.equal(current.offTableKyotakuCount, "1");
  assert.equal(current.yakumanEvents[0].kind, "daisangen");
  assert.equal(current.rawScoreByWind.east, "-50");
  assert.equal(
    validateMatchForm({
      values: current,
      constraint,
      allowedMembers: members,
      startingPoints: 25000,
      allowOffTableKyotaku: true,
      mode: "initial",
    }).message,
    "役満記録を確認してください"
  );
});

test("三麻では北の入力を表示しない", async () => {
  const [
    { render, screen },
    { MatchForm },
    { createEmptyMatchFormValues },
    { getParticipantConstraint },
  ] = await setup;
  render(
    <MatchForm
      mode="initial"
      values={createEmptyMatchFormValues()}
      constraint={getParticipantConstraint("sanma")}
      members={members}
      chomboPenaltyPoints={4000}
      allowOffTableKyotaku={false}
      error={null}
      isSubmitting={false}
      onChange={() => {}}
      onSubmit={() => {}}
      onBack={() => {}}
    />
  );
  assert.equal(screen.queryByLabelText("北の素点"), null);
  assert.ok(screen.getByLabelText("西の素点"));
});

test("対局編集で保存済みの外卓記録を変更・削除できる", async () => {
  const [
    { render, screen, fireEvent },
    { MatchForm },
    { createEmptyMatchFormValues },
    { getParticipantConstraint },
  ] = await setup;
  const initial: MatchFormValues = {
    ...createEmptyMatchFormValues(),
    chomboOffenderUserIds: ["member-1"],
    offTableKyotakuPresent: true,
    offTableKyotakuCount: "1",
  };
  let current = initial;
  const Harness = () => {
    const [values, setValues] = React.useState(initial);
    current = values;
    return (
      <MatchForm
        mode="edit"
        values={values}
        constraint={getParticipantConstraint("yonma")}
        members={members}
        chomboPenaltyPoints={4}
        allowOffTableKyotaku
        error={null}
        isSubmitting={false}
        onChange={setValues}
        onSubmit={() => {}}
        onBack={() => {}}
      />
    );
  };
  render(<Harness />);
  assert.equal(
    (screen.getByLabelText("チョンボした人") as HTMLSelectElement).value,
    "member-1"
  );
  fireEvent.change(screen.getByLabelText("チョンボした人"), {
    target: { value: "member-2" },
  });
  fireEvent.change(screen.getByLabelText("供託本数"), {
    target: { value: "2" },
  });
  assert.deepEqual(current.chomboOffenderUserIds, ["member-2"]);
  assert.equal(current.offTableKyotakuCount, "2");
  fireEvent.click(screen.getByRole("checkbox", { name: "外卓記録を入力" }));
  assert.deepEqual(current.chomboOffenderUserIds, []);
  assert.equal(current.offTableKyotakuPresent, false);
  assert.equal(current.offTableKyotakuCount, "");
});
