import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";

import type {
  MatchFormValues,
  YakumanEntryError,
} from "@/features/session-match/model/match-form";
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
  MutationObserver: {
    configurable: true,
    value: dom.window.MutationObserver,
  },
  getComputedStyle: {
    configurable: true,
    value: dom.window.getComputedStyle.bind(dom.window),
  },
  IS_REACT_ACT_ENVIRONMENT: {
    configurable: true,
    writable: true,
    value: true,
  },
});

let cleanup!: typeof import("@testing-library/react").cleanup;
let fireEvent!: typeof import("@testing-library/react").fireEvent;
let render!: typeof import("@testing-library/react").render;
let screen!: typeof import("@testing-library/react").screen;
let MatchForm!: typeof import("./MatchForm").MatchForm;
let createEmptyMatchFormValues!: typeof import("@/features/session-match/model/match-form").createEmptyMatchFormValues;
let getParticipantConstraint!: typeof import("@/features/session-match/model/participants").getParticipantConstraint;
let YAKUMAN_OPTIONS!: typeof import("@/lib/yakuman").YAKUMAN_OPTIONS;

const setup = Promise.all([
  import("@testing-library/react"),
  import("./MatchForm"),
  import("@/features/session-match/model/match-form"),
  import("@/features/session-match/model/participants"),
  import("@/lib/yakuman"),
]).then(
  ([
    testingLibrary,
    matchFormModule,
    modelModule,
    participantsModule,
    yakumanModule,
  ]) => {
    ({ cleanup, fireEvent, render, screen } = testingLibrary);
    ({ MatchForm } = matchFormModule);
    ({ createEmptyMatchFormValues } = modelModule);
    ({ getParticipantConstraint } = participantsModule);
    ({ YAKUMAN_OPTIONS } = yakumanModule);
  }
);

const members = [
  { userId: "member-1", userName: "一郎" },
  { userId: "member-2", userName: "二郎" },
  { userId: "member-3", userName: "三郎" },
  { userId: "member-4", userName: "四郎" },
] as SessionMember[];

const makeValues = (): MatchFormValues => {
  const values = createEmptyMatchFormValues();
  return {
    ...values,
    userIdByWind: {
      east: "member-1",
      south: "member-2",
      west: "member-3",
      north: "member-4",
    },
    rawScoreByWind: {
      east: "250",
      south: "250",
      west: "250",
      north: "250",
    },
  };
};

const createFormHarness = (
  initialValues: MatchFormValues = makeValues(),
  constraint = getParticipantConstraint("yonma"),
  yakumanErrors: ReadonlyArray<YakumanEntryError> = []
) => {
  const Harness: React.FC = () => {
    const [values, setValues] = React.useState(initialValues);
    return React.createElement(MatchForm, {
      mode: "initial",
      values,
      constraint,
      members,
      chomboPenaltyPoints: 4000,
      allowOffTableKyotaku: true,
      error: null,
      yakumanErrors,
      isSubmitting: false,
      onChange: setValues,
      onSubmit: () => {},
      onBack: () => {},
    });
  };

  return React.createElement(Harness);
};

afterEach(async () => {
  await setup;
  cleanup();
});

test("役満を複合記録し、追加しても点数と外卓入力を保持する", async () => {
  await setup;

  render(createFormHarness());

  fireEvent.change(screen.getAllByPlaceholderText("点数")[0], {
    target: { value: "123" },
  });
  fireEvent.click(screen.getByRole("checkbox", { name: "チョンボが発生した" }));
  fireEvent.change(screen.getByLabelText("チョンボした人を選択"), {
    target: { value: "member-2" },
  });

  fireEvent.click(screen.getByRole("checkbox", { name: "役満があった" }));
  assert.equal(screen.getAllByLabelText("和了者を選択").length, 1);
  assert.equal(screen.queryByRole("button", { name: /役満を追加/ }), null);

  fireEvent.change(screen.getAllByLabelText("和了者を選択")[0], {
    target: { value: "member-1" },
  });
  assert.equal(screen.queryByRole("button", { name: /役満を追加/ }), null);
  fireEvent.change(screen.getAllByLabelText("役満種を選択")[0], {
    target: { value: "daisangen" },
  });
  assert.ok(screen.getByRole("button", { name: /役満を追加/ }));

  fireEvent.click(screen.getByRole("button", { name: /役満を追加/ }));
  assert.equal(screen.queryByRole("button", { name: /役満を追加/ }), null);
  fireEvent.change(screen.getAllByLabelText("和了者を選択")[1], {
    target: { value: "member-1" },
  });
  assert.equal(screen.queryByRole("button", { name: /役満を追加/ }), null);
  fireEvent.change(screen.getAllByLabelText("役満種を選択")[1], {
    target: { value: "suuankouTanki" },
  });

  fireEvent.click(screen.getByRole("button", { name: /役満を追加/ }));
  fireEvent.change(screen.getAllByLabelText("和了者を選択")[2], {
    target: { value: "member-1" },
  });
  fireEvent.change(screen.getAllByLabelText("役満種を選択")[2], {
    target: { value: "kokushi13Wait" },
  });

  const winners = screen.getAllByLabelText(
    "和了者を選択"
  ) as HTMLSelectElement[];
  const kinds = screen.getAllByLabelText("役満種を選択") as HTMLSelectElement[];
  assert.deepEqual(
    winners.map((select) => select.value),
    ["member-1", "member-1", "member-1"]
  );
  assert.deepEqual(
    kinds.map((select) => select.value),
    ["daisangen", "suuankouTanki", "kokushi13Wait"]
  );
  assert.equal(
    (screen.getAllByPlaceholderText("点数")[0] as HTMLInputElement).value,
    "123"
  );
  assert.equal(
    (screen.getByLabelText("チョンボした人を選択") as HTMLSelectElement).value,
    "member-2"
  );
  assert.equal(
    kinds[0].querySelectorAll("option").length,
    YAKUMAN_OPTIONS.length + 1
  );
  assert.deepEqual(
    Array.from(kinds[0].options)
      .slice(1)
      .map((option) => option.value),
    YAKUMAN_OPTIONS.map(({ kind }) => kind)
  );
});

test("Match参加者だけを候補にし、行エラーを役満欄へ関連付ける", async () => {
  await setup;

  const values = makeValues();
  const sanmaValues: MatchFormValues = {
    ...values,
    userIdByWind: { ...values.userIdByWind, north: null },
    yakumanEnabled: true,
    yakumanEvents: [{ winnerUserId: null, kind: null }],
  };
  render(
    createFormHarness(sanmaValues, getParticipantConstraint("sanma"), [
      { index: 0, message: "和了者と役満種を選択してください" },
    ])
  );

  const winnerSelect = screen.getByLabelText(
    "和了者を選択"
  ) as HTMLSelectElement;
  assert.deepEqual(
    Array.from(winnerSelect.options).map((option) => option.value),
    ["", "member-1", "member-2", "member-3"]
  );
  const row = screen.getByRole("group", { name: "役満記録 1" });
  const errorId = row.getAttribute("aria-describedby");
  assert.ok(errorId);
  assert.equal(
    document.getElementById(errorId)?.textContent,
    "和了者と役満種を選択してください"
  );
});

test("役満行を個別に削除し、最後の行の削除で役満なしに戻す", async () => {
  await setup;

  render(createFormHarness());
  fireEvent.click(screen.getByRole("checkbox", { name: "役満があった" }));
  fireEvent.change(screen.getByLabelText("和了者を選択"), {
    target: { value: "member-1" },
  });
  fireEvent.change(screen.getByLabelText("役満種を選択"), {
    target: { value: "daisangen" },
  });
  fireEvent.click(screen.getByRole("button", { name: /役満を追加/ }));
  fireEvent.change(screen.getAllByLabelText("和了者を選択")[1], {
    target: { value: "member-2" },
  });
  fireEvent.change(screen.getAllByLabelText("役満種を選択")[1], {
    target: { value: "tsuuiisou" },
  });

  fireEvent.click(screen.getByRole("checkbox", { name: "役満があった" }));
  assert.equal(screen.queryByLabelText("役満種を選択"), null);
  fireEvent.click(screen.getByRole("checkbox", { name: "役満があった" }));
  assert.deepEqual(
    (screen.getAllByLabelText("役満種を選択") as HTMLSelectElement[]).map(
      (select) => select.value
    ),
    ["daisangen", "tsuuiisou"]
  );

  fireEvent.click(screen.getByRole("button", { name: "役満記録 1 を削除" }));
  assert.equal(
    (screen.getByLabelText("和了者を選択") as HTMLSelectElement).value,
    "member-2"
  );
  assert.equal(
    (screen.getByLabelText("役満種を選択") as HTMLSelectElement).value,
    "tsuuiisou"
  );

  fireEvent.click(screen.getByRole("button", { name: "役満記録 1 を削除" }));
  assert.equal(screen.queryByLabelText("役満種を選択"), null);
  assert.equal(
    (screen.getByRole("checkbox", { name: "役満があった" }) as HTMLInputElement)
      .checked,
    false
  );
});
